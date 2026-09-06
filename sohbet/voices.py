"""Ses seçimi. Groq yolunda Microsoft nöral Türkçe, OpenAI yolunda API sesleri."""

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
    "nova": "nova — yumuşak akıcı",
    "shimmer": "shimmer — parlak",
    "coral": "coral — sıcak",
    "sage": "sage — sakin",
    "alloy": "alloy — dengeli",
    "echo": "echo — yumuşak erkek",
    "onyx": "onyx — derin erkek",
    "ash": "ash — düşük",
    "fable": "fable — anlatıcı",
}

# Groq / ücretsiz TTS: Edge nöral Türkçe. Kadın = Emel, erkek = Ahmet.
EDGE_VOICE: dict[str, str] = {
    "nova": "tr-TR-EmelNeural",
    "shimmer": "tr-TR-EmelNeural",
    "coral": "tr-TR-EmelNeural",
    "sage": "tr-TR-EmelNeural",
    "alloy": "tr-TR-EmelNeural",
    "fable": "tr-TR-EmelNeural",
    "echo": "tr-TR-AhmetNeural",
    "onyx": "tr-TR-AhmetNeural",
    "ash": "tr-TR-AhmetNeural",
}

# Biraz hızlı + doğal; gTTS'teki kopuk okumayı kırar.
EDGE_STYLE: dict[str, tuple[str, str]] = {
    "nova": ("+8%", "+0Hz"),
    "shimmer": ("+12%", "+4Hz"),
    "coral": ("+6%", "+2Hz"),
    "sage": ("-4%", "-2Hz"),
    "alloy": ("+8%", "+0Hz"),
    "fable": ("+2%", "+0Hz"),
    "echo": ("+6%", "+0Hz"),
    "onyx": ("+2%", "-3Hz"),
    "ash": ("-2%", "-4Hz"),
}

DEFAULT_EDGE_VOICE = "tr-TR-EmelNeural"
DEFAULT_EDGE_STYLE = ("+8%", "+0Hz")


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


def edge_voice_for(name: str) -> str:
    return EDGE_VOICE.get(normalize_voice(name), DEFAULT_EDGE_VOICE)


def edge_style_for(name: str) -> tuple[str, str]:
    return EDGE_STYLE.get(normalize_voice(name), DEFAULT_EDGE_STYLE)
