"""Basit enerji eşiği ile konuşma / susma algısı."""

from __future__ import annotations

import numpy as np


def pcm16_rms(pcm: bytes) -> float:
    if not pcm:
        return 0.0
    samples = np.frombuffer(pcm, dtype=np.int16).astype(np.float32)
    if samples.size == 0:
        return 0.0
    return float(np.sqrt(np.mean(np.square(samples))))


class EnergyVad:
    def __init__(self, *, start: float = 500.0, stop: float = 250.0) -> None:
        self.start = start
        self.stop = stop
        self.speaking = False

    def update(self, pcm: bytes) -> str:
        level = pcm16_rms(pcm)
        if not self.speaking and level >= self.start:
            self.speaking = True
            return "start"
        if self.speaking and level < self.stop:
            return "quiet"
        if self.speaking:
            return "speech"
        return "silence"
