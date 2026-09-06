from sohbet.config import Settings
from sohbet.factory import build_session
from sohbet.ui.app import ChatApp


def test_window_builds_and_shows_disconnected_status() -> None:
    settings = Settings(
        openai_api_key="",
        openai_model="gpt-4o-mini",
        openai_stt_model="whisper-1",
        openai_tts_model="tts-1",
        openai_tts_voice="nova",
        openai_base_url=None,
    )
    session, _ = build_session(settings)
    app = ChatApp(session, api_ready=False)
    try:
        app.update()
        assert app.title() == "Sohbet"
        assert "bağlı değil" in app.status_label.cget("text")
        assert app.voice_var.get() is True
        app._clear_history()
        app.update()
        assert "temiz" in app.reply_label.cget("text").lower()
    finally:
        app.destroy()
