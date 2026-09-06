"""TTS sesini çalma. Sesli cevap kapalıyken bu katman çağrılmaz."""

from __future__ import annotations

import io
import threading

from date_bot.errors import DateError


class AudioPlayer:
    def __init__(self) -> None:
        self._ready = False
        self._lock = threading.Lock()
        self._mixer = None

    def _ensure(self) -> None:
        if self._ready:
            return
        try:
            import pygame

            pygame.mixer.init()
            self._mixer = pygame.mixer
            self._ready = True
        except Exception as exc:
            raise DateError("Ses çıkışı başlatılamadı. Hoparlör / ses sürücüsünü kontrol et.") from exc

    def play(self, audio_bytes: bytes) -> None:
        if not audio_bytes:
            return
        with self._lock:
            self._ensure()
            assert self._mixer is not None
            try:
                self._mixer.music.load(io.BytesIO(audio_bytes))
                self._mixer.music.play()
                while self._mixer.music.get_busy():
                    self._mixer.time.wait(50)
            except Exception as exc:
                raise DateError("Sesli cevap çalınamadı.") from exc

    def stop(self) -> None:
        if not self._ready or self._mixer is None:
            return
        try:
            self._mixer.music.stop()
        except Exception:
            pass
