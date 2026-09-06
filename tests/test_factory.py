from sohbet.config import Settings
from sohbet.factory import build_session


def test_build_session_without_key() -> None:
    settings = Settings(
        openai_api_key="",
        openai_model="gpt-4o-mini",
        openai_stt_model="whisper-1",
        openai_tts_model="tts-1",
        openai_tts_voice="nova",
        openai_base_url=None,
    )
    session, loaded = build_session(settings)
    assert loaded.api_configured is False
    assert session.voice_enabled is True
    assert "kişisel bir sohbet" in session.memory.system_prompt
