from sohbet.config import Settings
from sohbet.engines.realtime import (
    TranscriptBuffer,
    parse_realtime_event,
    realtime_url,
    session_payload,
)


def _settings(**kwargs) -> Settings:
    data = dict(
        openai_api_key="sk-test",
        openai_model="gpt-4o-mini",
        openai_stt_model="whisper-1",
        openai_tts_model="tts-1",
        openai_tts_voice="nova",
        openai_base_url=None,
    )
    data.update(kwargs)
    return Settings(**data)


def test_realtime_url_default() -> None:
    url = realtime_url(_settings())
    assert url.startswith("wss://api.openai.com/v1/realtime?model=")
    assert "gpt-4o-mini-realtime-preview" in url


def test_realtime_url_custom_base() -> None:
    url = realtime_url(_settings(openai_base_url="https://example.com/v1"))
    assert url == "wss://example.com/v1/realtime?model=gpt-4o-mini-realtime-preview"


def test_parse_user_and_audio_aliases() -> None:
    user = parse_realtime_event(
        {"type": "conversation.item.input_audio_transcription.completed", "transcript": "selam"}
    )
    assert user.kind == "user_transcript"
    assert user.text == "selam"
    audio = parse_realtime_event({"type": "response.output_audio.delta", "delta": "abc"})
    assert audio.kind == "audio"
    assert audio.audio_b64 == "abc"


def test_parse_error_and_speech() -> None:
    err = parse_realtime_event({"type": "error", "error": {"message": "bad key"}})
    assert err.kind == "error"
    assert "bad key" in err.text
    assert parse_realtime_event({"type": "input_audio_buffer.speech_started"}).kind == "speech_started"


def test_transcript_buffer_accumulates() -> None:
    buf = TranscriptBuffer()
    first = buf.consume(parse_realtime_event({"type": "response.audio_transcript.delta", "delta": "mer"}))
    second = buf.consume(parse_realtime_event({"type": "response.audio_transcript.delta", "delta": "haba"}))
    assert first.text == "mer"
    assert second.text == "merhaba"
    done = buf.consume(parse_realtime_event({"type": "response.done"}))
    assert done.kind == "assistant_done"
    assert done.text == "merhaba"
    assert buf.assistant == ""


def test_session_payload_has_vad() -> None:
    payload = session_payload("talimat", "coral")
    assert payload["type"] == "session.update"
    assert payload["session"]["voice"] == "coral"
    assert payload["session"]["turn_detection"]["type"] == "server_vad"
