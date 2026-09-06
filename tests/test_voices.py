from sohbet.config import Settings
from sohbet.engines.tts import TextToSpeech
from sohbet.voices import label_for, normalize_voice, voice_from_label


def test_normalize_unknown_falls_back_to_nova() -> None:
    assert normalize_voice("NOVA") == "nova"
    assert normalize_voice("yok") == "nova"


def test_label_roundtrip() -> None:
    assert voice_from_label(label_for("onyx")) == "onyx"
    assert voice_from_label("echo") == "echo"


def test_tts_voice_can_change_at_runtime() -> None:
    settings = Settings(
        openai_api_key="",
        openai_model="gpt-4o-mini",
        openai_stt_model="whisper-1",
        openai_tts_model="tts-1",
        openai_tts_voice="nova",
        openai_base_url=None,
    )
    tts = TextToSpeech(settings)
    assert tts.voice == "nova"
    assert tts.set_voice("onyx") == "onyx"
    assert tts.voice == "onyx"
