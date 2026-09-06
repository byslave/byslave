"""Uygulama parçalarını bir araya getirir."""

from __future__ import annotations

from date_bot.audio.player import AudioPlayer
from date_bot.config import Settings, get_settings
from date_bot.conversation import ConversationMemory
from date_bot.engines.llm import ChatEngine
from date_bot.engines.stt import SpeechToText
from date_bot.engines.tts import TextToSpeech
from date_bot.personality import build_system_prompt
from date_bot.session import ChatSession


def build_session(settings: Settings | None = None) -> tuple[ChatSession, Settings]:
    settings = settings or get_settings()
    memory = ConversationMemory(system_prompt=build_system_prompt())
    session = ChatSession(
        memory=memory,
        stt=SpeechToText(settings),
        llm=ChatEngine(settings),
        tts=TextToSpeech(settings),
        player=AudioPlayer(),
    )
    return session, settings
