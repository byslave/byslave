from sohbet.conversation import ConversationMemory
from sohbet.errors import AppError
from sohbet.session import ChatSession


class FakeSTT:
    def transcribe(self, wav_bytes: bytes, language: str = "tr") -> str:
        assert wav_bytes
        assert language == "tr"
        return "nasılsın"


class FakeLLM:
    def reply(self, memory: ConversationMemory) -> str:
        last = memory.messages[-1].content
        return f"cevap:{last}"


class FakeTTS:
    def __init__(self) -> None:
        self.spoken: list[str] = []

    def speak(self, text: str) -> bytes:
        self.spoken.append(text)
        return b"mp3"


class FakePlayer:
    def __init__(self) -> None:
        self.played: list[bytes] = []
        self.stopped = False

    def play(self, audio_bytes: bytes) -> None:
        self.played.append(audio_bytes)

    def stop(self) -> None:
        self.stopped = True


def _session(voice: bool = True) -> tuple[ChatSession, FakeTTS, FakePlayer]:
    tts = FakeTTS()
    player = FakePlayer()
    session = ChatSession(
        memory=ConversationMemory(system_prompt="p"),
        stt=FakeSTT(),
        llm=FakeLLM(),
        tts=tts,
        player=player,
    )
    session.voice_enabled = voice
    return session, tts, player


def test_text_turn_updates_memory_and_speaks() -> None:
    session, tts, player = _session()
    user, reply = session.handle_text("  merhaba  ")
    assert user == "merhaba"
    assert reply == "cevap:merhaba"
    assert session.memory.last_assistant() == reply
    assert tts.spoken == [reply]
    assert player.played == [b"mp3"]


def test_voice_off_skips_tts() -> None:
    session, tts, player = _session(voice=False)
    session.handle_text("selam")
    assert tts.spoken == []
    assert player.played == []


def test_audio_turn_uses_stt() -> None:
    session, _, _ = _session()
    user, reply = session.handle_audio(b"wav")
    assert user == "nasılsın"
    assert reply == "cevap:nasılsın"


def test_empty_text_raises() -> None:
    session, _, _ = _session()
    try:
        session.handle_text("   ")
        raise AssertionError("expected AppError")
    except AppError as exc:
        assert "yazılmadı" in exc.message


def test_clear_stops_audio() -> None:
    session, _, player = _session()
    session.handle_text("hey")
    session.clear()
    assert session.memory.messages == []
    assert player.stopped is True
