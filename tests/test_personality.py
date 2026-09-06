from sohbet.personality import BOT_NAME, build_system_prompt


def test_prompt_covers_tone_and_turkish() -> None:
    prompt = build_system_prompt()
    assert BOT_NAME == "Sohbet"
    assert "Türkçe" in prompt
    assert "robot" in prompt.lower()
    assert "kısa" in prompt.lower()
