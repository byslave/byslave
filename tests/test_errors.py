from date_bot.errors import DateError, user_message


def test_date_error_passthrough() -> None:
    assert user_message(DateError("mikrofon yok")) == "mikrofon yok"


def test_maps_auth_and_mic() -> None:
    assert "API anahtarı" in user_message(RuntimeError("Incorrect API key provided"))
    assert "Mikrofon" in user_message(RuntimeError("No default input device available"))
    assert "ters gitti" in user_message(RuntimeError("weird boom"))
