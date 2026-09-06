"""Uygulama parçalarını bir araya getirir."""

from __future__ import annotations

from sohbet.audio.player import AudioPlayer
from sohbet.config import Settings, get_settings
from sohbet.conversation import ConversationMemory
from sohbet.engines.llm import ChatEngine
from sohbet.engines.stt import SpeechToText
from sohbet.engines.tts import TextToSpeech
from sohbet.personality import build_system_prompt
from sohbet.session import ChatSession


def build_session(settings: Settings | None = None) -> tuple[ChatSession, Settings]:
    settings = settings or get_settings()
    memory = ConversationMemory(system_prompt=build_system_prompt())
    session = ChatSession(
        memory=memory,
        stt=SpeechToText(settings),
        llm=ChatEngine(settings),
        tts=TextToSpeech(settings),
        player=AudioPlayer(),
        settings=settings,
    )
    return session, settings
