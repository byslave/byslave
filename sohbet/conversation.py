"""Bellekte tutulan konuşma geçmişi."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Message:
    role: str
    content: str

    def to_api(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


@dataclass
class ConversationMemory:
    """Sistem mesajı + kullanıcı/asistan turları. Kalıcı dosya yok."""

    system_prompt: str
    messages: list[Message] = field(default_factory=list)
    max_turns: int = 40

    def as_api_messages(self) -> list[dict[str, str]]:
        payload = [Message(role="system", content=self.system_prompt).to_api()]
        payload.extend(m.to_api() for m in self.messages)
        return payload

    def add_user(self, text: str) -> None:
        self.messages.append(Message(role="user", content=text.strip()))
        self._trim()

    def add_assistant(self, text: str) -> None:
        self.messages.append(Message(role="assistant", content=text.strip()))
        self._trim()

    def clear(self) -> None:
        self.messages.clear()

    def last_assistant(self) -> str:
        for message in reversed(self.messages):
            if message.role == "assistant":
                return message.content
        return ""

    def _trim(self) -> None:
        # Her tur user+assistant = 2 mesaj. Eski turları at, sistemi koru.
        max_messages = self.max_turns * 2
        if len(self.messages) > max_messages:
            self.messages = self.messages[-max_messages:]
