"""Konuşmayı metne çevirir. İlk sürüm: Whisper API (dosya)."""

from __future__ import annotations

from io import BytesIO
from typing import Protocol

from sohbet.config import Settings
from sohbet.errors import AppError, user_message


class Transcriber(Protocol):
    def transcribe(self, wav_bytes: bytes, language: str = "tr") -> str: ...


class SpeechToText:
    def __init__(self, settings: Settings, client=None) -> None:
        self._settings = settings
        self._client = client

    def _client_or_raise(self):
        if self._client is not None:
            return self._client
        if not self._settings.api_configured:
            raise AppError("API anahtarı yok. Proje klasörüne .env ekleyip OPENAI_API_KEY yaz.")
        from openai import OpenAI

        kwargs: dict = {"api_key": self._settings.openai_api_key}
        if self._settings.openai_base_url:
            kwargs["base_url"] = self._settings.openai_base_url
        self._client = OpenAI(**kwargs)
        return self._client

    def transcribe(self, wav_bytes: bytes, language: str = "tr") -> str:
        if not wav_bytes:
            raise AppError("Kaydedilecek ses yok.")
        try:
            client = self._client_or_raise()
            audio = BytesIO(wav_bytes)
            audio.name = "speech.wav"
            result = client.audio.transcriptions.create(
                model=self._settings.openai_stt_model,
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
