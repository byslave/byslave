from sohbet.session import ChatSession


class _OldLlm:
    def ping(self) -> bool:
        return True


def test_ping_fallback_without_ping_detail() -> None:
    from main import _ping

    session = ChatSession(
        memory=object(),  # type: ignore[arg-type]
        stt=object(),  # type: ignore[arg-type]
        llm=_OldLlm(),  # type: ignore[arg-type]
        tts=object(),  # type: ignore[arg-type]
    )
    ok, err = _ping(session)
    assert ok is True
    assert err == ""


def test_diagnose_fallback_message(monkeypatch) -> None:
    import sohbet.config as cfg
    from main import _diagnose

    monkeypatch.delattr(cfg, "diagnose_setup", raising=False)
    message = _diagnose(None)
    assert "sohbet klasörü eski" in message or "komple" in message or "kopyala" in message
