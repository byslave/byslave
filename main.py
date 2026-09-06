#!/usr/bin/env python3
"""Kişisel sesli sohbet botunu başlatır."""

from __future__ import annotations

import sys
import traceback


def main() -> int:
    try:
        from sohbet.factory import build_session
        from sohbet.ui.app import run_app
    except Exception as exc:
        print(f"Bot başlatılamadı: {exc}", file=sys.stderr)
        traceback.print_exc()
        return 1

    try:
        from sohbet.config import diagnose_setup

        session, settings = build_session()
        api_ready = False
        startup_error: str | None = None
        if settings.api_configured:
            api_ready, startup_error = session.llm.ping_detail()
            if api_ready:
                startup_error = None
        else:
            startup_error = diagnose_setup(settings)
        if startup_error:
            print(startup_error, file=sys.stderr)
        run_app(session, api_ready=api_ready, startup_error=startup_error)
        return 0
    except Exception as exc:
        print(f"Bot çalışırken durdu: {exc}", file=sys.stderr)
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
