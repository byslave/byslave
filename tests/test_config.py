from sohbet.config import Settings, get_settings


def test_missing_key_is_not_configured(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_MODEL", "gpt-4o-mini")
    settings = get_settings()
    assert settings.api_configured is False
    assert settings.openai_model == "gpt-4o-mini"


def test_settings_dataclass() -> None:
    settings = Settings(
        openai_api_key="sk-test",
        openai_model="gpt-4o-mini",
        openai_stt_model="whisper-1",
        openai_tts_model="tts-1",
        openai_tts_voice="nova",
        openai_base_url=None,
    )
    assert settings.api_configured is True
    assert settings.sample_rate == 16000
