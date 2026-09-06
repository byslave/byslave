"""Canlı konuşma oturumu: mikrofon → Realtime API → hoparlör."""

from __future__ import annotations

import base64
from collections.abc import Callable

from sohbet.audio.streamer import LIVE_RATE, LiveMic, PcmOutput
from sohbet.config import Settings
from sohbet.conversation import ConversationMemory
from sohbet.engines.realtime import ParsedEvent, RealtimeClient, TranscriptBuffer
from sohbet.errors import AppError
from sohbet.personality import build_system_prompt
from sohbet.session import ChatSession
from sohbet.turn_live import TurnLiveSession


def create_live(session: ChatSession, on_ui) -> LiveSession | TurnLiveSession:
    settings = session.settings
    if settings is not None and settings.uses_openai_realtime:
        voice = "nova"
        if hasattr(session.tts, "voice"):
            voice = getattr(session.tts, "voice") or "nova"
        return LiveSession(settings, session.memory, voice, on_ui)
    return TurnLiveSession(session, on_ui)


class LiveSession:
    def __init__(
        self,
        settings: Settings,
        memory: ConversationMemory,
        voice: str,
        on_ui: Callable[[str, str], None],
    ) -> None:
        self.settings = settings
        self.memory = memory
        self.voice = voice
        self._on_ui = on_ui
        self._client: RealtimeClient | None = None
        self._mic = LiveMic(settings.live_sample_rate or LIVE_RATE)
        self._out = PcmOutput(settings.live_sample_rate or LIVE_RATE)
        self._buf = TranscriptBuffer()
        self._pending_user = ""

    @property
    def running(self) -> bool:
        return self._client is not None and self._client.running

    def start(self) -> None:
        if self.running:
            return
        if not self.settings.api_configured:
            raise AppError("API anahtarı yok. Proje klasörüne .env ekleyip OPENAI_API_KEY yaz.")

        client = RealtimeClient(
            settings=self.settings,
            instructions=self.memory.system_prompt or build_system_prompt(),
            voice=self.voice,
            on_event=self._handle,
        )
        client.start()
        self._client = client
        try:
            self._out.start()
            self._mic.start(client.send_pcm)
        except Exception:
            self.stop()
            raise
        self._on_ui("status", "Seni dinliyorum. Konuş, susunca cevap gelir. Sözünü kesmek için tekrar konuş.")

    def stop(self) -> None:
        self._mic.stop()
        self._out.stop()
        if self._client is not None:
            self._client.stop()
            self._client = None
        leftover = self._buf.assistant.strip()
        if leftover:
            self.memory.add_assistant(leftover)
            self._on_ui("assistant", leftover)
            self._buf.assistant = ""

    def set_voice(self, voice: str) -> None:
        self.voice = voice
        if self._client is not None:
            self._client.update_voice(voice)

    def restart(self) -> None:
        was_running = self.running
        self.stop()
        if was_running:
            self.start()

    def _handle(self, event: ParsedEvent) -> None:
        if event.kind == "speech_started":
            self._out.clear()
            if self._client is not None:
                self._client.cancel_response()
            if self._buf.assistant.strip():
                self._buf.assistant = ""
            self._on_ui("status", "Konuşuyorsun…")
            return

        if event.kind == "speech_stopped":
            self._on_ui("status", "Dinledim, cevaplıyorum…")
            return

        if event.kind == "audio" and event.audio_b64:
            try:
                self._out.feed(base64.b64decode(event.audio_b64))
            except Exception:
                pass
            return

        if event.kind == "user_transcript" and event.text:
            self.memory.add_user(event.text)
            self._on_ui("user", event.text)
            return

        viewed = self._buf.consume(event)
        if viewed.kind == "assistant_delta" and viewed.text:
            self._on_ui("assistant_partial", viewed.text)
            return
        if viewed.kind == "assistant_done" and viewed.text.strip():
            self.memory.add_assistant(viewed.text.strip())
            self._on_ui("assistant", viewed.text.strip())
            return

        if event.kind == "error" and event.text:
            self._on_ui("err", event.text)
