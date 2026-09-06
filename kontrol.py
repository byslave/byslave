#!/usr/bin/env python3
"""Anahtar yazdırmaz. .env ve Groq bağlantısını kontrol eder."""

from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parent
    sys.path.insert(0, str(root))
    from sohbet.config import get_settings, inspect_env_file
    from sohbet.factory import build_session
    from sohbet.version import APP_VERSION

    env_path = root / ".env"
    print(f"Sohbet surum {APP_VERSION}")
    print(f".env yolu: {env_path}")
    print(f".env var mi: {'evet' if env_path.exists() else 'HAYIR'}")

    info = inspect_env_file(env_path)
    print(f"GROQ_API_KEY satiri: {info['key_lines']}")
    print(f"Gercek anahtar: {'evet' if info['real_key'] else 'hayir'}")
    print(f"Sablon gsk_... : {'evet' if info['placeholder_key'] else 'hayir'}")
    print(f"Komut satiri .env icinde: {'evet' if info['command_line'] else 'hayir'}")
    print(f"GROQ_MODEL satirlari: {info['models'] or '-'}")

    settings = get_settings()
    print(f"Secilen saglayici: {settings.resolved_provider}")
    print(f"Kullanilacak model: {settings.llm_model}")
    print(f"Anahtar yuklendi: {'evet' if settings.api_configured else 'hayir'}")
    if settings.api_configured:
        print(f"Anahtar uzunlugu: {len(settings.active_api_key)} (deger yazilmaz)")

    if not settings.api_configured:
        print("SONUC: anahtar yok veya gsk_... sablon. .env'yi 3 satira indir.")
        return 1

    session, _ = build_session(settings)
    ok, err = session.llm.ping_detail()
    if ok:
        print("SONUC: Groq yanit verdi. Botu ac: .venv\\Scripts\\python.exe main.py")
        return 0
    print(f"SONUC: Groq reddetti: {err}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
