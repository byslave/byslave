"""OpenAI Realtime API. Sunucu VAD + akan ses + söz kesme."""

from __future__ import annotations

import asyncio
import base64
import json
import threading
from collections.abc import Callable
from dataclasses import dataclass, field

from sohbet.config import Settings
from sohbet.errors import AppError, user_message


@dataclass
class ParsedEvent:
    kind: str
    text: str = ""
    audio_b64: str = ""


def realtime_url(settings: Settings) -> str:
    model = settings.openai_realtime_model
    base = (settings.openai_base_url or "").rstrip("/")
    if not base:
        return f"wss://api.openai.com/v1/realtime?model={model}"
    if base.startswith("https://"):
        base = "wss://" + base[len("https://") :]
    elif base.startswith("http://"):
        base = "ws://" + base[len("http://") :]
    if base.endswith("/v1"):
        return f"{base}/realtime?model={model}"
    if "/realtime" in base:
        return f"{base}?model={model}" if "?" not in base else base
    return f"{base}/v1/realtime?model={model}"


def _nested_transcript(event: dict) -> str:
    direct = event.get("transcript")
    if isinstance(direct, str) and direct.strip():
        return direct.strip()
    item = event.get("item")
    if isinstance(item, dict):
        content = item.get("content")
        if isinstance(content, list):
            for part in content:
                if isinstance(part, dict) and part.get("transcript"):
                    return str(part["transcript"]).strip()
    return ""


def parse_realtime_event(event: dict) -> ParsedEvent:
    kind = str(event.get("type") or "")
    if kind in {"session.created", "session.updated"}:
        return ParsedEvent("session_ready")
    if kind in {
        "conversation.item.input_audio_transcription.completed",
        "conversation.item.input_audio_transcription.done",
    }:
        return ParsedEvent("user_transcript", text=_nested_transcript(event))
    if kind in {"response.audio_transcript.delta", "response.output_audio_transcript.delta"}:
        return ParsedEvent("assistant_delta", text=str(event.get("delta") or ""))
    if kind in {"response.audio_transcript.done", "response.output_audio_transcript.done"}:
        return ParsedEvent("assistant_done", text=_nested_transcript(event) or str(event.get("transcript") or ""))
    if kind in {"response.audio.delta", "response.output_audio.delta"}:
        return ParsedEvent("audio", audio_b64=str(event.get("delta") or ""))
    if kind == "input_audio_buffer.speech_started":
        return ParsedEvent("speech_started")
    if kind == "input_audio_buffer.speech_stopped":
        return ParsedEvent("speech_stopped")
    if kind == "response.done":
        return ParsedEvent("response_done")
    if kind == "error":
        err = event.get("error")
        if isinstance(err, dict):
            message = str(err.get("message") or err.get("code") or "Realtime API hatası")
        else:
            message = str(err or "Realtime API hatası")
        return ParsedEvent("error", text=message)
    return ParsedEvent("ignored")


def session_payload(instructions: str, voice: str) -> dict:
    return {
        "type": "session.update",
        "session": {
            "modalities": ["audio", "text"],
            "instructions": instructions,
            "voice": voice,
            "input_audio_format": "pcm16",
            "output_audio_format": "pcm16",
            "input_audio_transcription": {"model": "whisper-1"},
            "turn_detection": {
                "type": "server_vad",
                "threshold": 0.5,
                "prefix_padding_ms": 300,
                "silence_duration_ms": 400,
            },
        },
    }


class RealtimeClient:
    """WebSocket oturumu. Ses parçaları başka iş parçacığından gelir."""

    def __init__(
        self,
        settings: Settings,
        instructions: str,
        voice: str,
        on_event: Callable[[ParsedEvent], None],
    ) -> None:
        self._settings = settings
        self._instructions = instructions
        self._voice = voice
        self._on_event = on_event
        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: threading.Thread | None = None
        self._outgoing: asyncio.Queue[dict] | None = None
        self._ws = None
        self._stop = threading.Event()
        self._ready = threading.Event()
        self._error: str | None = None

    @property
    def running(self) -> bool:
        return self._thread is not None and self._thread.is_alive() and not self._stop.is_set()

    def start(self, timeout: float = 15.0) -> None:
        if not self._settings.api_configured:
            raise AppError("API anahtarı yok. Proje klasörüne .env ekleyip OPENAI_API_KEY yaz.")
        if self.running:
            return
        self._stop.clear()
        self._ready.clear()
        self._error = None
        self._thread = threading.Thread(target=self._thread_main, daemon=True)
        self._thread.start()
        if not self._ready.wait(timeout):
            self.stop()
            raise AppError("Canlı oturum açılmadı. İnternetini ve API anahtarını kontrol et.")
        if self._error:
            message = self._error
            self.stop()
            raise AppError(message)

    def send_pcm(self, pcm16: bytes) -> None:
        if not pcm16 or self._loop is None or self._outgoing is None:
            return
        payload = {
            "type": "input_audio_buffer.append",
            "audio": base64.b64encode(pcm16).decode("ascii"),
        }
        self._loop.call_soon_threadsafe(self._outgoing.put_nowait, payload)

    def cancel_response(self) -> None:
        self._send({"type": "response.cancel"})

    def update_voice(self, voice: str) -> None:
        self._voice = voice
        self._send(session_payload(self._instructions, voice))

    def stop(self) -> None:
        self._stop.set()
        loop = self._loop
        ws = self._ws
        if loop is not None and loop.is_running() and ws is not None:
            asyncio.run_coroutine_threadsafe(ws.close(), loop)
        thread = self._thread
        if thread is not None and thread.is_alive() and thread is not threading.current_thread():
            thread.join(timeout=3)
        self._thread = None
        self._loop = None
        self._outgoing = None
        self._ws = None

    def _send(self, payload: dict) -> None:
        if self._loop is None or self._outgoing is None:
            return
        self._loop.call_soon_threadsafe(self._outgoing.put_nowait, payload)

    def _thread_main(self) -> None:
        loop = asyncio.new_event_loop()
        self._loop = loop
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self._run())
        except Exception as exc:
            self._error = user_message(exc)
            self._ready.set()
        finally:
            try:
                pending = asyncio.all_tasks(loop)
                for task in pending:
                    task.cancel()
                if pending:
                    loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
            except Exception:
                pass
            loop.close()
            self._loop = None

    async def _run(self) -> None:
        try:
            import websockets
        except ImportError as exc:
            raise AppError("websockets yüklü değil. pip install -r requirements.txt") from exc

        headers = {
            "Authorization": f"Bearer {self._settings.openai_api_key}",
            "OpenAI-Beta": "realtime=v1",
        }
        url = realtime_url(self._settings)
        ws = await _open_socket(websockets, url, headers)
        self._ws = ws
        self._outgoing = asyncio.Queue()
        try:
            await ws.send(json.dumps(session_payload(self._instructions, self._voice)))
            sender = asyncio.create_task(self._pump_out(ws))
            try:
                async for raw in ws:
                    if self._stop.is_set():
                        break
                    event = json.loads(raw)
                    parsed = parse_realtime_event(event)
                    if parsed.kind == "session_ready":
                        self._ready.set()
                    if parsed.kind == "error":
                        self._error = parsed.text
                        self._ready.set()
                        self._on_event(parsed)
                        break
                    self._on_event(parsed)
            finally:
                sender.cancel()
                try:
                    await sender
                except asyncio.CancelledError:
                    pass
        finally:
            try:
                await ws.close()
            except Exception:
                pass
            if not self._ready.is_set():
                if not self._error:
                    self._error = "Canlı bağlantı kapandı."
                self._ready.set()

    async def _pump_out(self, ws) -> None:
        assert self._outgoing is not None
        while not self._stop.is_set():
            payload = await self._outgoing.get()
            await ws.send(json.dumps(payload))


async def _open_socket(websockets, url: str, headers: dict):
    kwargs = {"max_size": 2**23}
    try:
        return await websockets.connect(url, additional_headers=headers, **kwargs)
    except TypeError:
        return await websockets.connect(url, extra_headers=headers, **kwargs)


@dataclass
class TranscriptBuffer:
    assistant: str = ""
    events: list[ParsedEvent] = field(default_factory=list)

    def consume(self, event: ParsedEvent) -> ParsedEvent:
        if event.kind == "assistant_delta":
            self.assistant += event.text
            return ParsedEvent("assistant_delta", text=self.assistant)
        if event.kind in {"assistant_done", "response_done"}:
            text = event.text or self.assistant
            self.assistant = ""
            return ParsedEvent("assistant_done", text=text)
        return event
