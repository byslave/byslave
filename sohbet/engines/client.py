"""OpenAI uyumlu istemci (OpenAI veya ücretsiz Groq)."""

from __future__ import annotations

from sohbet.config import Settings
from sohbet.errors import AppError


def build_client(settings: Settings, existing=None):
    if existing is not None:
        return existing
    if not settings.api_configured:
        raise AppError(
            "API anahtarı yok. Ücretsiz için .env içine GROQ_API_KEY yaz. "
            "Anahtarı https://console.groq.com/keys adresinden al."
        )
    from openai import OpenAI

    kwargs: dict = {"api_key": settings.active_api_key, "timeout": 45.0}
    if settings.client_base_url:
        kwargs["base_url"] = settings.client_base_url
    return OpenAI(**kwargs)
