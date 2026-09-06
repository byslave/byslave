"""Metni sese çevirir. İlk sürüm: OpenAI TTS. Yerel motor ileride eklenebilir."""

from __future__ import annotations

from typing import Protocol

from sohbet.config import Settings
from sohbet.errors import AppError, user_message
from sohbet.voices import normalize_voice


class Speaker(Protocol):
    def speak(self, text: str) -> bytes: ...


class TextToSpeech:
    def __init__(self, settings: Settings, client=None) -> None:
        self._settings = settings
        self._client = client
        self.voice = settings.openai_tts_voice

    def set_voice(self, name: str) -> str:
        self.voice = normalize_voice(name)
        return self.voice

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

    def speak(self, text: str) -> bytes:
        clean = text.strip()
        if not clean:
            return b""
        try:
            client = self._client_or_raise()
            response = client.audio.speech.create(
                model=self._settings.openai_tts_model,
                voice=self.voice,
                input=clean,
                response_format="mp3",
            )
            return response.content
        except AppError:
            raise
        except Exception as exc:
            raise AppError(user_message(exc), detail=str(exc)) from exc
