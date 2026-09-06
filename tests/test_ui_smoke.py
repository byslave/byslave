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
        assert app.live_var.get() is True
        assert "Canlı" in app.mic_button.cget("text")
        assert "nova" in app.voice_choice.get()
        app._on_voice_choice("onyx — derin erkek")
        assert session.tts.voice == "onyx"
        app._clear_history()
        app.update()
        assert "temiz" in app.reply_label.cget("text").lower()
        app._start_live()
        app.update()
        assert "GROQ_API_KEY" in app.reply_label.cget("text") or "API anahtarı" in app.reply_label.cget("text")
        app.live_var.set(False)
        app._on_live_toggle()
        app.update()
        assert "Bas-konuş" in app.mic_button.cget("text")
    finally:
        app.destroy()


def test_startup_error_is_shown_in_reply() -> None:
    settings = Settings(
        openai_api_key="",
        openai_model="gpt-4o-mini",
        openai_stt_model="whisper-1",
        openai_tts_model="tts-1",
        openai_tts_voice="nova",
        openai_base_url=None,
        groq_api_key="gsk-test",
    )
    session, _ = build_session(settings)
    app = ChatApp(session, api_ready=False, startup_error="Model bulunamadı. GROQ_MODEL yaz.")
    try:
        app.update()
        assert "yanıt vermedi" in app.status_label.cget("text")
        assert "GROQ_MODEL" in app.reply_label.cget("text")
    finally:
        app.destroy()
