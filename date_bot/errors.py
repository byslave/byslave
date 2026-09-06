"""Kullanıcıya gösterilecek anlaşılır hata mesajları."""

from __future__ import annotations


class DateError(Exception):
    """Uygulama içi, kullanıcıya güvenle gösterilebilen hata."""

    def __init__(self, message: str, *, detail: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.detail = detail


def user_message(exc: Exception) -> str:
    """Teknik istisnayı kısa, Türkçe bir mesaja çevir."""
    if isinstance(exc, DateError):
        return exc.message

    text = str(exc).lower()
    name = type(exc).__name__.lower()

    if "api key" in text or "authentication" in text or "401" in text:
        return "API anahtarı geçersiz veya eksik. .env dosyasındaki OPENAI_API_KEY değerini kontrol et."
    if "rate limit" in text or "429" in text:
        return "API kotası doldu. Biraz bekleyip tekrar dene."
    if "timeout" in text or "timed out" in text:
        return "Bağlantı zaman aşımına uğradı. İnternetini kontrol edip tekrar dene."
    if "connection" in text or "connect" in name:
        return "API'ye bağlanılamadı. İnternet bağlantını kontrol et."
    if "microphone" in text or "input device" in text or "no default input" in text:
        return "Mikrofon bulunamadı veya kullanılamıyor. Sistem ayarlarından mikrofon iznini kontrol et."
    if "quota" in text or "insufficient" in text:
        return "API bakiyesi yetersiz. OpenAI hesabını kontrol et."
    return "Bir şeyler ters gitti. Tekrar dene; sorun sürerse .env ve internet bağlantını kontrol et."
