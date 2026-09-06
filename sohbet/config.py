"""Uygulama ayarları. API anahtarları yalnızca ortam / .env üzerinden okunur."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

from sohbet.voices import normalize_voice

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def load_env(env_path: Path | None = None) -> None:
    """Proje kökündeki .env dosyasını yükle. Mevcut ortam değişkenlerini ezme."""
    path = env_path or PROJECT_ROOT / ".env"
    if path.exists():
        load_dotenv(path, override=False)


@dataclass(frozen=True)
class Settings:
    openai_api_key: str
    openai_model: str
    openai_stt_model: str
    openai_tts_model: str
    openai_tts_voice: str
    openai_base_url: str | None
    openai_realtime_model: str = "gpt-4o-mini-realtime-preview"
    sample_rate: int = 16000
    live_sample_rate: int = 24000

    @property
    def api_configured(self) -> bool:
        return bool(self.openai_api_key.strip())


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
    )
