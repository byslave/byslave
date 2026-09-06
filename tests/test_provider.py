from sohbet.audio.vad import EnergyVad, pcm16_rms
from sohbet.config import Settings
from sohbet.live import create_live
from sohbet.turn_live import TurnLiveSession


def _settings(**kwargs) -> Settings:
    data = dict(
        openai_api_key="",
        openai_model="gpt-4o-mini",
        openai_stt_model="whisper-1",
        openai_tts_model="tts-1",
        openai_tts_voice="nova",
        openai_base_url=None,
    )
    data.update(kwargs)
    return Settings(**data)


def test_groq_key_wins_in_auto() -> None:
    settings = _settings(groq_api_key="gsk-test")
    assert settings.resolved_provider == "groq"
    assert settings.api_configured is True
    assert settings.uses_gtts is True
    assert settings.uses_openai_realtime is False
    assert settings.client_base_url and "groq.com" in settings.client_base_url


def test_openai_when_no_groq() -> None:
    settings = _settings(openai_api_key="sk-test")
    assert settings.resolved_provider == "openai"
    assert settings.uses_openai_realtime is True


def test_vad_starts_on_loud_chunk() -> None:
    import numpy as np

    loud = (np.ones(480, dtype=np.int16) * 3000).tobytes()
    quiet = (np.zeros(480, dtype=np.int16)).tobytes()
    vad = EnergyVad(start=500, stop=250)
    assert vad.update(quiet) == "silence"
    assert vad.update(loud) == "start"
    assert pcm16_rms(loud) > 1000


def test_create_live_uses_turn_for_groq() -> None:
    from sohbet.conversation import ConversationMemory
    from sohbet.session import ChatSession

    settings = _settings(groq_api_key="gsk-test")
    session = ChatSession(
        memory=ConversationMemory(system_prompt="x"),
        stt=object(),  # type: ignore[arg-type]
        llm=object(),  # type: ignore[arg-type]
        tts=object(),  # type: ignore[arg-type]
        settings=settings,
    )
    live = create_live(session, lambda *_: None)
    assert isinstance(live, TurnLiveSession)
