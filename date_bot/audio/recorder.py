"""Bas-konuş mikrofon kaydı. Gerçek zamanlı akış ileride ayrı bir sınıfta tutulabilir."""

from __future__ import annotations

import io
import threading
import wave
from typing import Protocol

import numpy as np

from date_bot.errors import DateError


class AudioInput(Protocol):
    def start(self) -> None: ...
    def stop(self) -> bytes: ...
    def is_recording(self) -> bool: ...


class PushToTalkRecorder:
    """16 kHz mono PCM kaydı. start/stop ile bas-konuş döngüsü."""

    def __init__(self, sample_rate: int = 16000) -> None:
        self.sample_rate = sample_rate
        self._chunks: list[np.ndarray] = []
        self._stream = None
        self._lock = threading.Lock()
        self._recording = False

    def is_recording(self) -> bool:
        return self._recording

    def start(self) -> None:
        if self._recording:
            return

        try:
            import sounddevice as sd
        except ImportError as exc:
            raise DateError("Ses kayıt kütüphanesi yüklü değil. requirements.txt ile kurulum yap.") from exc

        self._chunks = []

        def callback(indata, frames, time, status) -> None:  # type: ignore[no-untyped-def]
            if status:
                return
            with self._lock:
                self._chunks.append(indata.copy())

        try:
            self._stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=1,
                dtype="float32",
                callback=callback,
            )
            self._stream.start()
        except Exception as exc:
            self._stream = None
            raise DateError(
                "Mikrofon açılamadı. Cihaz bağlı mı ve izinler açık mı?",
                detail=str(exc),
            ) from exc

        self._recording = True

    def stop(self) -> bytes:
        if not self._recording:
            return b""

        self._recording = False
        stream = self._stream
        self._stream = None
        if stream is not None:
            try:
                stream.stop()
                stream.close()
            except Exception:
                pass

        with self._lock:
            chunks = list(self._chunks)
            self._chunks = []

        if not chunks:
            raise DateError("Kayıt boş geldi. Mikrofonu kontrol edip biraz daha uzun bas.")

        audio = np.concatenate(chunks, axis=0)
        if float(np.max(np.abs(audio))) < 1e-4:
            raise DateError("Ses algılanamadı. Mikrofonunu kontrol et veya daha yakın konuş.")

        return _float32_to_wav(audio[:, 0], self.sample_rate)


def _float32_to_wav(samples: np.ndarray, sample_rate: int) -> bytes:
    clipped = np.clip(samples, -1.0, 1.0)
    pcm = (clipped * 32767).astype(np.int16)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm.tobytes())
    return buffer.getvalue()
