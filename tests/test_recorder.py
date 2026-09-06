import numpy as np

from sohbet.audio.recorder import PushToTalkRecorder, _float32_to_wav


def test_wav_header_is_valid() -> None:
    samples = np.sin(np.linspace(0, 4, 1600)).astype(np.float32)
    wav = _float32_to_wav(samples, 16000)
    assert wav[:4] == b"RIFF"
    assert b"WAVE" in wav[:16]
    assert len(wav) > 44


def test_stop_without_start_is_empty() -> None:
    recorder = PushToTalkRecorder()
    assert recorder.stop() == b""
    assert recorder.is_recording() is False
