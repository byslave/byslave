from sohbet.config import Settings, diagnose_setup, get_settings, parse_env_text, remap_groq_model


def test_missing_key_is_not_configured(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_MODEL", "gpt-4o-mini")
    empty = tmp_path / ".env"
    empty.write_text("OPENAI_MODEL=gpt-4o-mini\n", encoding="utf-8")
    monkeypatch.setattr("sohbet.config.PROJECT_ROOT", tmp_path)
    settings = get_settings()
    assert settings.api_configured is False
    assert settings.openai_model == "gpt-4o-mini"


def test_quoted_groq_key_and_deprecated_model(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_MODEL", raising=False)
    (tmp_path / ".env").write_text(
        'GROQ_API_KEY="gsk_testquotedkey_long_enough"\nGROQ_MODEL=llama-3.1-8b-instant\n',
        encoding="utf-8",
    )
    monkeypatch.setattr("sohbet.config.PROJECT_ROOT", tmp_path)
    settings = get_settings()
    assert settings.groq_api_key == "gsk_testquotedkey_long_enough"
    assert settings.resolved_provider == "groq"
    assert settings.llm_model == "qwen/qwen3.8-27b"


def test_messy_env_keeps_first_real_key() -> None:
    parsed = parse_env_text(
        "\n".join(
            [
                "GROQ_API_KEY=gsk_this_is_a_real_looking_key_value",
                "GROQ_API_KEY=gsk_...",
                "GROQ_MODEL=qwen/qwen3.8-27b",
                "GROQ_MODEL=llama-3.1-8b-instant",
                ".venv\\Scripts\\python.exe main.py",
            ]
        )
    )
    assert parsed["GROQ_API_KEY"] == "gsk_this_is_a_real_looking_key_value"
    assert parsed["GROQ_MODEL"] == "qwen/qwen3.8-27b"
    assert ".venv" not in parsed


def test_placeholder_key_is_ignored(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    (tmp_path / ".env").write_text(
        "GROQ_API_KEY=gsk_...\nGROQ_MODEL=qwen/qwen3.8-27b\n",
        encoding="utf-8",
    )
    monkeypatch.setattr("sohbet.config.PROJECT_ROOT", tmp_path)
    settings = get_settings()
    assert settings.api_configured is False
    assert settings.groq_api_key == ""


def test_remap_deprecated_groq_models() -> None:
    assert remap_groq_model("llama-3.1-8b-instant") == "qwen/qwen3.8-27b"
    assert remap_groq_model("openai/gpt-oss-20b") == "openai/gpt-oss-20b"


def test_diagnose_env_txt(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr("sohbet.config.PROJECT_ROOT", tmp_path)
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".env.txt").write_text("GROQ_API_KEY=gsk_hidden\n", encoding="utf-8")
    settings = Settings(
        openai_api_key="",
        openai_model="gpt-4o-mini",
        openai_stt_model="whisper-1",
        openai_tts_model="tts-1",
        openai_tts_voice="nova",
        openai_base_url=None,
    )
    message = diagnose_setup(settings)
    assert ".env.txt" in message


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
