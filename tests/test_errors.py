from sohbet.errors import AppError, user_message


def test_date_error_passthrough() -> None:
    assert user_message(AppError("mikrofon yok")) == "mikrofon yok"


def test_maps_auth_and_mic() -> None:
    assert "API anahtarı" in user_message(RuntimeError("Incorrect API key provided"))
    assert "Mikrofon" in user_message(RuntimeError("No default input device available"))
    assert "Hata: RuntimeError" in user_message(RuntimeError("weird boom"))


def test_maps_missing_model_and_audio_libs() -> None:
    assert "GROQ_MODEL" in user_message(RuntimeError("Error code: 404 - model_not_found"))
    assert "numpy" in user_message(ImportError("No module named 'numpy'")).lower()
    assert "sounddevice" in user_message(OSError("PortAudio library not found")).lower()
