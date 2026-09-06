"""OpenAI TTS sesleri. Arayüzden veya .env ile seçilir."""

from __future__ import annotations

VOICES: tuple[str, ...] = (
    "nova",
    "shimmer",
    "coral",
    "sage",
    "alloy",
    "echo",
    "onyx",
    "ash",
    "fable",
)

VOICE_LABELS: dict[str, str] = {
    "nova": "nova — yumuşak",
    "shimmer": "shimmer — parlak",
    "coral": "coral — sıcak",
    "sage": "sage — sakin",
    "alloy": "alloy — dengeli",
    "echo": "echo — yumuşak erkek",
    "onyx": "onyx — derin erkek",
    "ash": "ash — düşük",
    "fable": "fable — anlatıcı",
}


def normalize_voice(name: str) -> str:
    clean = (name or "").strip().lower()
    if clean in VOICES:
        return clean
    return "nova"


def label_for(name: str) -> str:
    voice = normalize_voice(name)
    return VOICE_LABELS[voice]


def voice_from_label(label: str) -> str:
    for voice, text in VOICE_LABELS.items():
        if label == text or label == voice:
            return voice
    return normalize_voice(label)
