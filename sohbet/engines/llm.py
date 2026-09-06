"""LLM cevap üretimi. Konuşma geçmişi ConversationMemory üzerinden gelir."""

from __future__ import annotations

from typing import Protocol

from sohbet.config import Settings
from sohbet.conversation import ConversationMemory
from sohbet.errors import AppError, user_message


class Responder(Protocol):
    def reply(self, memory: ConversationMemory) -> str: ...


class ChatEngine:
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

    def reply(self, memory: ConversationMemory) -> str:
        try:
            client = self._client_or_raise()
            response = client.chat.completions.create(
                model=self._settings.openai_model,
                messages=memory.as_api_messages(),
                temperature=0.8,
                max_tokens=280,
            )
            text = (response.choices[0].message.content or "").strip()
        except AppError:
            raise
        except Exception as exc:
            raise AppError(user_message(exc), detail=str(exc)) from exc

        if not text:
            raise AppError("Bu turda cevap gelmedi. Tekrar dene.")
        return text

    def ping(self) -> bool:
        """Bağlantı durumu için ucuz bir doğrulama."""
        if not self._settings.api_configured:
            return False
        try:
            client = self._client_or_raise()
            client.models.retrieve(self._settings.openai_model)
            return True
        except Exception:
            return False
