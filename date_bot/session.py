"""Bir sohbet turunu yönetir: STT → bellek → LLM → (isteğe bağlı) TTS."""

from __future__ import annotations

from date_bot.audio.player import AudioPlayer
from date_bot.conversation import ConversationMemory
from date_bot.engines.llm import ChatEngine
from date_bot.engines.stt import SpeechToText
from date_bot.engines.tts import TextToSpeech
from date_bot.errors import DateError


class ChatSession:
    def __init__(
        self,
        memory: ConversationMemory,
        stt: SpeechToText,
        llm: ChatEngine,
        tts: TextToSpeech,
        player: AudioPlayer | None = None,
    ) -> None:
        self.memory = memory
        self.stt = stt
        self.llm = llm
        self.tts = tts
        self.player = player or AudioPlayer()
        self.voice_enabled = True

    def handle_audio(self, wav_bytes: bytes) -> tuple[str, str]:
        user_text = self.stt.transcribe(wav_bytes, language="tr")
        return self.handle_text(user_text)

    def handle_text(self, user_text: str) -> tuple[str, str]:
        clean = user_text.strip()
        if not clean:
            raise DateError("Bir şey duyulmadı veya yazılmadı.")
        self.memory.add_user(clean)
        reply = self.llm.reply(self.memory)
        self.memory.add_assistant(reply)
        if self.voice_enabled:
            audio = self.tts.speak(reply)
            self.player.play(audio)
        return clean, reply

    def clear(self) -> None:
        self.memory.clear()
        self.player.stop()
