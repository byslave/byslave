"""Canlı mikrofon ve PCM16 oynatma. 24 kHz, Realtime API ile uyumlu."""

from __future__ import annotations

import threading
from collections.abc import Callable

import numpy as np

from sohbet.errors import AppError

LIVE_RATE = 24000
BLOCK = 480  # 20 ms


class LiveMic:
    def __init__(self, sample_rate: int = LIVE_RATE) -> None:
        self.sample_rate = sample_rate
        self._stream = None
        self._active = False

    @property
    def active(self) -> bool:
        return self._active

    def start(self, on_pcm: Callable[[bytes], None]) -> None:
        if self._active:
            return
        try:
            import sounddevice as sd
        except ImportError as exc:
            raise AppError("Ses kayıt kütüphanesi yüklü değil. requirements.txt ile kurulum yap.") from exc

        def callback(indata, frames, time, status) -> None:  # type: ignore[no-untyped-def]
            if status or not self._active:
                return
            on_pcm(np.ascontiguousarray(indata).tobytes())

        try:
            self._stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=1,
                dtype="int16",
                blocksize=BLOCK,
                callback=callback,
            )
            self._stream.start()
        except Exception as exc:
            self._stream = None
            raise AppError(
                "Mikrofon açılamadı. Cihaz bağlı mı ve izinler açık mı?",
                detail=str(exc),
            ) from exc
        self._active = True

    def stop(self) -> None:
        self._active = False
        stream = self._stream
        self._stream = None
        if stream is None:
            return
        try:
            stream.stop()
            stream.close()
        except Exception:
            pass


class PcmOutput:
    def __init__(self, sample_rate: int = LIVE_RATE) -> None:
        self.sample_rate = sample_rate
        self._lock = threading.Lock()
        self._buffer = bytearray()
        self._stream = None
        self._active = False

    def start(self) -> None:
        if self._active:
            return
        try:
            import sounddevice as sd
        except ImportError as exc:
            raise AppError("Ses çıkışı başlatılamadı.") from exc

        def callback(outdata, frames, time, status) -> None:  # type: ignore[no-untyped-def]
            needed = frames * 2
            with self._lock:
                chunk = self._buffer[:needed]
                del self._buffer[:needed]
            if len(chunk) < needed:
                chunk = chunk + b"\x00" * (needed - len(chunk))
            outdata[:] = np.frombuffer(chunk, dtype=np.int16).reshape(-1, 1)

        try:
            self._stream = sd.OutputStream(
                samplerate=self.sample_rate,
                channels=1,
                dtype="int16",
                blocksize=BLOCK,
                callback=callback,
            )
            self._stream.start()
        except Exception as exc:
            raise AppError("Hoparlör açılamadı. Ses çıkışını kontrol et.") from exc
        self._active = True

    def feed(self, pcm16: bytes) -> None:
        if not pcm16:
            return
        with self._lock:
            self._buffer.extend(pcm16)

    def clear(self) -> None:
        with self._lock:
            self._buffer.clear()

    def stop(self) -> None:
        self._active = False
        self.clear()
        stream = self._stream
        self._stream = None
        if stream is None:
            return
        try:
            stream.stop()
            stream.close()
        except Exception:
            pass
