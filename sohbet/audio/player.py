"""TTS sesini çalma. Pygame yoksa Windows MCI veya geçici dosya kullanılır."""

from __future__ import annotations

import io
import os
import sys
import tempfile
import threading
import time

from sohbet.errors import AppError


class AudioPlayer:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._mixer = None
        self._tried_pygame = False
        self._stop = False

    def _try_pygame(self) -> None:
        if self._tried_pygame:
            return
        self._tried_pygame = True
        try:
            import pygame

            pygame.mixer.init()
            self._mixer = pygame.mixer
        except Exception:
            self._mixer = None

    def play(self, audio_bytes: bytes) -> None:
        if not audio_bytes:
            return
        with self._lock:
            self._stop = False
            self._try_pygame()
            if self._mixer is not None:
                try:
                    self._mixer.music.load(io.BytesIO(audio_bytes))
                    self._mixer.music.play()
                    while self._mixer.music.get_busy() and not self._stop:
                        self._mixer.time.wait(50)
                    return
                except Exception:
                    pass
            _play_mp3_file(audio_bytes)

    def stop(self) -> None:
        self._stop = True
        if self._mixer is not None:
            try:
                self._mixer.music.stop()
            except Exception:
                pass


def _play_mp3_file(audio_bytes: bytes) -> None:
    suffix = ".mp3" if audio_bytes[:3] == b"ID3" or audio_bytes[:2] == b"\xff\xfb" else ".mp3"
    handle = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    path = handle.name
    handle.write(audio_bytes)
    handle.close()
    try:
        if sys.platform == "win32":
            _play_windows_mci(path)
        else:
            raise AppError("Sesli cevap çalınamadı. pygame kurulu değil.")
    finally:
        time.sleep(0.05)
        try:
            os.unlink(path)
        except OSError:
            pass


def _play_windows_mci(path: str) -> None:
    import ctypes

    winmm = ctypes.windll.winmm
    alias = "sohbetses"
    cmds = (
        f'open "{path}" type mpegvideo alias {alias}',
        f"play {alias} wait",
        f"close {alias}",
    )
    for cmd in cmds:
        err = winmm.mciSendStringW(cmd, None, 0, 0)
        if err and "open" in cmd:
            raise AppError("Sesli cevap çalınamadı. Windows sesini kontrol et.")
