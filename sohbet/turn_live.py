"""Ücretsiz canlı konuşma: susunca STT → LLM → TTS. OpenAI Realtime gerekmez."""

from __future__ import annotations

import threading
from collections.abc import Callable

from sohbet.audio.recorder import pcm16_to_wav
from sohbet.audio.streamer import LiveMic
from sohbet.audio.vad import EnergyVad
from sohbet.errors import AppError
from sohbet.session import ChatSession

SILENCE_CHUNKS = 18  # ~360 ms at 20 ms / chunk
MIN_SPEECH_BYTES = 16000  # ~0.5 s at 16 kHz mono int16


class TurnLiveSession:
    def __init__(self, session: ChatSession, on_ui: Callable[[str, str], None]) -> None:
        self.session = session
        settings = session.settings
        rate = settings.sample_rate if settings is not None else 16000
        self._mic = LiveMic(rate)
        self._on_ui = on_ui
        self._vad = EnergyVad()
        self._buf = bytearray()
        self._quiet = 0
        self._running = False
        self._busy = False
        self._lock = threading.Lock()

    @property
    def running(self) -> bool:
        return self._running

    def start(self) -> None:
        if self._running:
            return
        if self.session.settings is None or not self.session.settings.api_configured:
            raise AppError(
                "Ücretsiz anahtar yok. .env içine GROQ_API_KEY yaz. "
                "https://console.groq.com/keys"
            )
        self._running = True
        self._buf.clear()
        self._quiet = 0
        self._vad.speaking = False
        self._mic.start(self._on_pcm)
        self._on_ui("status", "Ücretsiz canlı: konuş, sus, cevap gelir.")

    def stop(self) -> None:
        self._running = False
        self._mic.stop()

    def set_voice(self, voice: str) -> None:
        self.session.set_tts_voice(voice)

    def _on_pcm(self, pcm: bytes) -> None:
        if not self._running or self._busy:
            return
        kind = self._vad.update(pcm)
        if kind == "start":
            self._buf.extend(pcm)
            self._quiet = 0
            self._on_ui("status", "Konuşuyorsun…")
            return
        if kind in {"speech", "quiet"}:
            self._buf.extend(pcm)
            if kind == "quiet":
                self._quiet += 1
                if self._quiet >= SILENCE_CHUNKS and len(self._buf) >= MIN_SPEECH_BYTES:
                    self._commit()
            else:
                self._quiet = 0

    def _commit(self) -> None:
        with self._lock:
            if self._busy:
                return
            blob = bytes(self._buf)
            self._buf.clear()
            self._quiet = 0
            self._vad.speaking = False
            self._busy = True
        settings = self.session.settings
        rate = settings.sample_rate if settings is not None else 16000
        wav = pcm16_to_wav(blob, rate)
        self._on_ui("status", "Dinledim, cevaplıyorum…")
        threading.Thread(target=self._reply, args=(wav,), daemon=True).start()

    def _reply(self, wav: bytes) -> None:
        try:
            user, reply = self.session.handle_audio(wav)
            self._on_ui("user", user)
            self._on_ui("assistant", reply)
            self._on_ui("status", "Cevap geldi. Konuşmaya devam edebilirsin.")
        except Exception as exc:
            from sohbet.errors import user_message

            self._on_ui("err", user_message(exc))
        finally:
            self._busy = False
