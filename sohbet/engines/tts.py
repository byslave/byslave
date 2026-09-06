"""Metni sese çevirir. Groq yolunda ücretsiz gTTS, OpenAI yolunda TTS API."""

from __future__ import annotations

from io import BytesIO
from typing import Protocol

from sohbet.config import Settings
from sohbet.engines.client import build_client
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
        self._client = build_client(self._settings, self._client)
        return self._client

    def speak(self, text: str) -> bytes:
        clean = text.strip()
        if not clean:
            return b""
        if self._settings.uses_gtts:
            return _speak_gtts(clean)
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


def _speak_gtts(text: str) -> bytes:
    try:
        from gtts import gTTS
    except ImportError as exc:
        raise AppError("gTTS yüklü değil. pip install -r requirements.txt") from exc
    try:
        buf = BytesIO()
        gTTS(text=text, lang="tr").write_to_fp(buf)
        return buf.getvalue()
    except Exception as exc:
        raise AppError(user_message(exc), detail=str(exc)) from exc
