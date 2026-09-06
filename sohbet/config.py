"""Uygulama ayarları. API anahtarları yalnızca ortam / .env üzerinden okunur."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

from sohbet.voices import normalize_voice

PROJECT_ROOT = Path(__file__).resolve().parent.parent
GROQ_BASE = "https://api.groq.com/openai/v1"


def load_env(env_path: Path | None = None) -> None:
    """Proje kökündeki .env dosyasını yükle. Mevcut ortam değişkenlerini ezme."""
    path = env_path or PROJECT_ROOT / ".env"
    if path.exists():
        load_dotenv(path, override=False)
    # Boş OPENAI_BASE_URL SDK'yı kırıyor (protokolsüz adres).
    if not os.getenv("OPENAI_BASE_URL", "").strip():
        os.environ.pop("OPENAI_BASE_URL", None)


@dataclass(frozen=True)
class Settings:
    openai_api_key: str
    openai_model: str
    openai_stt_model: str
    openai_tts_model: str
    openai_tts_voice: str
    openai_base_url: str | None
    openai_realtime_model: str = "gpt-4o-mini-realtime-preview"
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"
    groq_stt_model: str = "whisper-large-v3"
    provider: str = "auto"
    sample_rate: int = 16000
    live_sample_rate: int = 24000

    @property
    def resolved_provider(self) -> str:
        wanted = (self.provider or "auto").strip().lower()
        if wanted == "groq" and self.groq_api_key.strip():
            return "groq"
        if wanted == "openai" and self.openai_api_key.strip():
            return "openai"
        if self.groq_api_key.strip():
            return "groq"
        if self.openai_api_key.strip():
            return "openai"
        return "none"

    @property
    def api_configured(self) -> bool:
        return self.resolved_provider != "none"

    @property
    def active_api_key(self) -> str:
        if self.resolved_provider == "groq":
            return self.groq_api_key.strip()
        return self.openai_api_key.strip()

    @property
    def client_base_url(self) -> str | None:
        if self.resolved_provider == "groq":
            return GROQ_BASE
        return self.openai_base_url

    @property
    def llm_model(self) -> str:
        if self.resolved_provider == "groq":
            return self.groq_model
        return self.openai_model

    @property
    def stt_model(self) -> str:
        if self.resolved_provider == "groq":
            return self.groq_stt_model
        return self.openai_stt_model

    @property
    def uses_gtts(self) -> bool:
        return self.resolved_provider == "groq"

    @property
    def uses_openai_realtime(self) -> bool:
        return self.resolved_provider == "openai"


def get_settings() -> Settings:
    load_env()
    base_url = os.getenv("OPENAI_BASE_URL", "").strip() or None
    return Settings(
        openai_api_key=os.getenv("OPENAI_API_KEY", "").strip(),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini",
        openai_stt_model=os.getenv("OPENAI_STT_MODEL", "whisper-1").strip() or "whisper-1",
        openai_tts_model=os.getenv("OPENAI_TTS_MODEL", "tts-1").strip() or "tts-1",
        openai_tts_voice=normalize_voice(os.getenv("OPENAI_TTS_VOICE", "nova")),
        openai_base_url=base_url,
        openai_realtime_model=(
            os.getenv("OPENAI_REALTIME_MODEL", "gpt-4o-mini-realtime-preview").strip()
            or "gpt-4o-mini-realtime-preview"
        ),
        groq_api_key=os.getenv("GROQ_API_KEY", "").strip(),
        groq_model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant").strip() or "llama-3.1-8b-instant",
        groq_stt_model=os.getenv("GROQ_STT_MODEL", "whisper-large-v3").strip() or "whisper-large-v3",
        provider=(os.getenv("PROVIDER", "auto").strip() or "auto"),
    )
