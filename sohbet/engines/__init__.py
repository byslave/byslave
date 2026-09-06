"""STT / LLM / TTS motorları. Gerçek zamanlı konuşma için aynı arayüzler kullanılabilir."""

from sohbet.engines.llm import ChatEngine
from sohbet.engines.stt import SpeechToText
from sohbet.engines.tts import TextToSpeech

__all__ = ["ChatEngine", "SpeechToText", "TextToSpeech"]
