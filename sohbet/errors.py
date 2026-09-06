"""Kullanıcıya gösterilecek anlaşılır hata mesajları."""

from __future__ import annotations


class AppError(Exception):
    """Uygulama içi, kullanıcıya güvenle gösterilebilen hata."""

    def __init__(self, message: str, *, detail: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.detail = detail


def user_message(exc: Exception) -> str:
    """Teknik istisnayı kısa, Türkçe bir mesaja çevir."""
    if isinstance(exc, AppError):
        return exc.message

    text = str(exc).lower()
    name = type(exc).__name__.lower()

    if "api key" in text or "authentication" in text or "401" in text or "invalid_api_key" in text:
        return "API anahtarı geçersiz. .env içinde GROQ_API_KEY (ücretsiz) veya OPENAI_API_KEY kontrol et."
    if "proxies" in text:
        return "Python paketleri eski. Terminalde: pip install -U openai"
    if "rate limit" in text or "429" in text:
        return "API kotası doldu. Biraz bekleyip tekrar dene."
    if "timeout" in text or "timed out" in text:
        return "Bağlantı zaman aşımına uğradı. İnternetini kontrol edip tekrar dene."
    if "connection" in text or "connect" in name or "apiconnection" in name:
        return "OpenAI'ye bağlanılamadı. Bu Cursor bulutunda genelde kapalıdır; botu kendi bilgisayarında çalıştır."
    if "microphone" in text or "input device" in text or "no default input" in text:
        return "Mikrofon bulunamadı veya kullanılamıyor. Sistem ayarlarından mikrofon iznini kontrol et."
    if "quota" in text or "insufficient" in text or "credit" in text or "billing" in text:
        return "OpenAI bakiyen bitmiş. Ücretsiz için GROQ_API_KEY kullan."
    if "model_not_found" in text or "does not exist" in text:
        return "Model bulunamadı. .env içine GROQ_MODEL=qwen/qwen3.8-27b yaz, kaydet, botu yeniden aç."
    if "numpy" in text:
        return "numpy eksik. Terminal: .venv\\Scripts\\python.exe -m pip install --upgrade pip numpy"
    if "sounddevice" in text or "portaudio" in text:
        return "Ses kütüphanesi eksik. Terminal: .venv\\Scripts\\python.exe -m pip install sounddevice"
    short = str(exc).replace("\n", " ")[:160]
    return f"Hata: {type(exc).__name__}: {short}"
