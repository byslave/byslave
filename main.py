#!/usr/bin/env python3
"""Date? kişisel sesli sohbet botunu başlatır."""

from __future__ import annotations

import sys
import traceback


def main() -> int:
    try:
        from date_bot.factory import build_session
        from date_bot.ui.app import run_app
    except Exception as exc:
        print(f"Date? başlatılamadı: {exc}", file=sys.stderr)
        traceback.print_exc()
        return 1

    try:
        session, settings = build_session()
        api_ready = False
        if settings.api_configured:
            api_ready = session.llm.ping()
        run_app(session, api_ready=api_ready)
        return 0
    except Exception as exc:
        print(f"Date? çalışırken durdu: {exc}", file=sys.stderr)
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
