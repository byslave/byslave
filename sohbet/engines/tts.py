"""Metni sese çevirir. Groq yolunda nöral Türkçe (Edge), olmazsa gTTS."""

from __future__ import annotations

import asyncio
import re
from io import BytesIO
from typing import Protocol

from sohbet.config import Settings
from sohbet.engines.client import build_client
from sohbet.errors import AppError, user_message
from sohbet.voices import edge_style_for, edge_voice_for, normalize_voice


class Speaker(Protocol):
    def speak(self, text: str) -> bytes: ...


_THINK = re.compile(r"<think>.*?</think>", re.I | re.S)
_MARKUP = re.compile(r"[*`#_>~]+")
_SPACES = re.compile(r"\s+")


def spoken_text(text: str) -> str:
    """Ses motoruna gidecek metni sadeleştir; takılmayı azaltır."""
    clean = _THINK.sub(" ", text)
    clean = _MARKUP.sub("", clean)
    clean = clean.replace("...", ". ")
    return _SPACES.sub(" ", clean).strip()


class TextToSpeech:
    def __init__(self, settings: Settings, client=None) -> None:
        self._settings = settings
        self._client = client
        self.voice = settings.openai_tts_voice

    def set_voice(self, name: str) -> str:
        self.voice = normalize_voice(name)
        return self.voice

    def _client_or_raise(self):
        self._client = build_client(self._settings, self._client)
        return self._client

    def speak(self, text: str) -> bytes:
        clean = spoken_text(text)
        if not clean:
            return b""
        if self._settings.uses_gtts:
            return _speak_free(clean, self.voice)
        try:
            client = self._client_or_raise()
            response = client.audio.speech.create(
                model=self._settings.openai_tts_model,
                voice=self.voice,
                input=clean,
                response_format="mp3",
            )
            return response.content
        except AppError:
            raise
        except Exception as exc:
            raise AppError(user_message(exc), detail=str(exc)) from exc


def _speak_free(text: str, voice: str) -> bytes:
    try:
        return _speak_edge(text, voice)
    except AppError:
        raise
    except Exception:
        return _speak_gtts(text)


def _speak_edge(text: str, voice: str) -> bytes:
    try:
        import edge_tts
    except ImportError as exc:
        raise RuntimeError("edge-tts yok") from exc

    neural = edge_voice_for(voice)
    rate, pitch = edge_style_for(voice)

    async def _collect() -> bytes:
        comm = edge_tts.Communicate(text, neural, rate=rate, pitch=pitch)
        parts: list[bytes] = []
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                parts.append(chunk["data"])
        audio = b"".join(parts)
        if not audio:
            raise RuntimeError("edge-tts boş döndü")
        return audio

    try:
        return asyncio.run(_collect())
    except RuntimeError as exc:
        if "asyncio.run" in str(exc).lower() or "event loop" in str(exc).lower():
            return asyncio.get_event_loop().run_until_complete(_collect())
        raise


def _speak_gtts(text: str) -> bytes:
    try:
        from gtts import gTTS
    except ImportError as exc:
        raise AppError("Ses paketi yok. Terminal: pip install edge-tts gTTS") from exc
    try:
        buf = BytesIO()
        gTTS(text=text, lang="tr", slow=False).write_to_fp(buf)
        return buf.getvalue()
    except Exception as exc:
        raise AppError(user_message(exc), detail=str(exc)) from exc
