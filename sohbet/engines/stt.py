"""Konuşmayı metne çevirir. İlk sürüm: Whisper API (dosya)."""

from __future__ import annotations

from io import BytesIO
from typing import Protocol

from sohbet.config import Settings
from sohbet.engines.client import build_client
from sohbet.errors import AppError, user_message


class Transcriber(Protocol):
    def transcribe(self, wav_bytes: bytes, language: str = "tr") -> str: ...


class SpeechToText:
    def __init__(self, settings: Settings, client=None) -> None:
        self._settings = settings
        self._client = client

    def _client_or_raise(self):
        self._client = build_client(self._settings, self._client)
        return self._client

    def transcribe(self, wav_bytes: bytes, language: str = "tr") -> str:
        if not wav_bytes:
            raise AppError("Kaydedilecek ses yok.")
        try:
            client = self._client_or_raise()
            audio = BytesIO(wav_bytes)
            audio.name = "speech.wav"
            result = client.audio.transcriptions.create(
                model=self._settings.stt_model,
                file=audio,
                language=language,
            )
        except AppError:
            raise
        except Exception as exc:
            raise AppError(user_message(exc), detail=str(exc)) from exc

        text = (getattr(result, "text", None) or str(result)).strip()
        if not text:
            raise AppError("Konuşma anlaşılamadı. Biraz daha net ve yavaş dene.")
        return text
