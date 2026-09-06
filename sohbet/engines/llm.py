"""LLM cevap üretimi. Konuşma geçmişi ConversationMemory üzerinden gelir."""

from __future__ import annotations

from typing import Protocol

from sohbet.config import Settings
from sohbet.conversation import ConversationMemory
from sohbet.engines.client import build_client
from sohbet.errors import AppError, user_message


class Responder(Protocol):
    def reply(self, memory: ConversationMemory) -> str: ...


class ChatEngine:
    def __init__(self, settings: Settings, client=None) -> None:
        self._settings = settings
        self._client = client

    def _client_or_raise(self):
        self._client = build_client(self._settings, self._client)
        return self._client

    def reply(self, memory: ConversationMemory) -> str:
        try:
            client = self._client_or_raise()
            response = client.chat.completions.create(
                model=self._settings.llm_model,
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

    def ping_detail(self) -> tuple[bool, str]:
        """Bağlantıyı dene; başarısızsa kullanıcıya gösterilecek nedeni dön."""
        if not self._settings.api_configured:
            return False, "API anahtarı yok. .env içine GROQ_API_KEY yaz."
        try:
            client = self._client_or_raise()
            client.chat.completions.create(
                model=self._settings.llm_model,
                messages=[{"role": "user", "content": "ok"}],
                max_tokens=1,
            )
            return True, ""
        except Exception as exc:
            return False, user_message(exc)

    def ping(self) -> bool:
        """Bağlantı durumu için kısa bir deneme."""
        ok, _ = self.ping_detail()
        return ok
