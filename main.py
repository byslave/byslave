#!/usr/bin/env python3
"""Kişisel sesli sohbet botunu başlatır."""

from __future__ import annotations

import sys
import traceback


def _diagnose(settings) -> str:
    try:
        from sohbet.config import diagnose_setup
    except ImportError:
        return (
            "sohbet klasörü eski. İndirdiğin zip'ten sohbet klasörünün TAMAMINI "
            "üzerine kopyala (yalnız main.py yetmez). Bot yine açılacak."
        )
    return diagnose_setup(settings)


def _ping(session) -> tuple[bool, str]:
    detail = getattr(session.llm, "ping_detail", None)
    if callable(detail):
        return detail()
    try:
        ok = bool(session.llm.ping())
    except Exception as exc:
        return False, f"Hata: {type(exc).__name__}: {exc}"
    return ok, "" if ok else "API yanıt vermedi. .env ve modeli kontrol et."


def _run_app(run_app, session, api_ready: bool, startup_error: str | None) -> None:
    try:
        run_app(session, api_ready=api_ready, startup_error=startup_error)
    except TypeError:
        run_app(session, api_ready=api_ready)


def main() -> int:
    try:
        from sohbet.factory import build_session
        from sohbet.ui.app import run_app
    except Exception as exc:
        print(f"Bot başlatılamadı: {exc}", file=sys.stderr)
        traceback.print_exc()
        return 1

    try:
        import sohbet.config as cfg

        if not hasattr(cfg, "diagnose_setup"):
            print(
                "UYARI: sohbet/config.py eski. Zip'ten sohbet klasörünü komple kopyala.",
                file=sys.stderr,
            )

        session, settings = build_session()
        api_ready = False
        startup_error: str | None = None
        if settings.api_configured:
            api_ready, startup_error = _ping(session)
            if api_ready:
                startup_error = None
        else:
            startup_error = _diagnose(settings)
        if startup_error:
            print(startup_error, file=sys.stderr)
        _run_app(run_app, session, api_ready, startup_error)
        return 0
    except Exception as exc:
        print(f"Bot çalışırken durdu: {exc}", file=sys.stderr)
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
