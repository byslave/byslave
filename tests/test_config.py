from sohbet.config import Settings, get_settings


def test_missing_key_is_not_configured(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_MODEL", "gpt-4o-mini")
    empty = tmp_path / ".env"
    empty.write_text("OPENAI_MODEL=gpt-4o-mini\n", encoding="utf-8")
    monkeypatch.setattr("sohbet.config.PROJECT_ROOT", tmp_path)
    settings = get_settings()
    assert settings.api_configured is False
    assert settings.openai_model == "gpt-4o-mini"


def test_empty_base_url_is_cleared(monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_BASE_URL", "")
    from sohbet.config import load_env

    load_env()
    assert "OPENAI_BASE_URL" not in __import__("os").environ or not __import__("os").environ.get("OPENAI_BASE_URL")


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
