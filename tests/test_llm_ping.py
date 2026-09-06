from sohbet.config import Settings
from sohbet.engines.llm import ChatEngine


def _settings(**kwargs) -> Settings:
    data = dict(
        openai_api_key="",
        openai_model="gpt-4o-mini",
        openai_stt_model="whisper-1",
        openai_tts_model="tts-1",
        openai_tts_voice="nova",
        openai_base_url=None,
        groq_api_key="gsk-test",
        groq_model="qwen/qwen3.8-27b",
    )
    data.update(kwargs)
    return Settings(**data)


class _OkClient:
    class chat:
        class completions:
            @staticmethod
            def create(**_kwargs):
                return object()


class _BoomClient:
    class chat:
        class completions:
            @staticmethod
            def create(**_kwargs):
                raise RuntimeError("Error code: 404 - model_not_found does not exist")


def test_ping_detail_ok() -> None:
    ok, err = ChatEngine(_settings(), client=_OkClient()).ping_detail()
    assert ok is True
    assert err == ""


def test_ping_detail_maps_missing_model() -> None:
    ok, err = ChatEngine(_settings(), client=_BoomClient()).ping_detail()
    assert ok is False
    assert "GROQ_MODEL" in err


def test_ping_without_key() -> None:
    engine = ChatEngine(_settings(groq_api_key=""))
    assert engine.ping() is False
    ok, err = engine.ping_detail()
    assert ok is False
    assert "GROQ_API_KEY" in err
