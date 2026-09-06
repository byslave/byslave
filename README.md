# Kişisel sesli sohbet botu

Kendi bilgisayarında çalışan, yalnızca senin kullanacağın bir sesli sohbet arkadaşı. Mikrofonla konuşur, cevabı hem metin hem ses olarak verir. İlk sürüm **bas-konuş**; gerçek zamanlı konuşma için ses ve motor katmanları ayrı duruyor.

Günlük sohbet, mizah, ilişkiler, duygular, fikir alışverişi ve (sen açarsan) yetişkin konularında konuşur. Bir ürün veya marka değil.

## Hangi teknolojiler, neden

| Katman | Seçim | Neden |
| --- | --- | --- |
| Dil | Python 3.12 | İstediğin dil; ses ve masaüstü ekosistemi olgun. |
| Arayüz | CustomTkinter | Hafif masaüstü penceresi, krem/kahve teması kolay, ekstra tarayıcı yok. |
| LLM / STT / TTS | OpenAI API (`gpt-4o-mini`, Whisper, TTS) | Tek anahtar, Türkçe kalitesi iyi, cevaplar kısa tutulabiliyor. Motorlar ayrı sınıflarda; başka sağlayıcıya geçmek kolay. |
| Mikrofon | `sounddevice` + NumPy | Bas-konuş için callback’li kayıt. PyAudio’dan daha az kurulum derdi. |
| Ses çalma | pygame mixer | MP3 TTS’i bloklamadan çalmak için yeterli. |
| Ayarlar | `python-dotenv` | Anahtarlar yalnızca `.env` / ortam değişkeninden okunur, koda yazılmaz. |

Gerçek zamanlı (sürekli dinleme) için ileride `audio/` altına streaming kaydedici, `engines/` altına streaming STT eklenebilir. `ChatSession` aynı kalır.

## Klasör yapısı

```
.
├── main.py
├── requirements.txt
├── .env.example
├── sohbet/
│   ├── config.py          # .env okuma
│   ├── personality.py     # kişilik
│   ├── conversation.py    # bellek içi geçmiş
│   ├── session.py         # STT → LLM → TTS turu
│   ├── factory.py
│   ├── errors.py
│   ├── audio/             # kayıt + oynatma
│   ├── engines/           # stt / llm / tts
│   └── ui/                # masaüstü
└── tests/
```

## Kurulum

```bash
cd /path/to/byslave
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Sistemde mikrofon için PortAudio gerekir:

```bash
# Debian / Ubuntu
sudo apt-get install portaudio19-dev python3-tk

# macOS
brew install portaudio
```

## API anahtarı

```bash
cp .env.example .env
```

`.env` içine kendi anahtarını yaz:

```
OPENAI_API_KEY=sk-...
```

Anahtarı koda yapıştırma. İsteğe bağlı modeller `.env.example` içinde.

## Nasıl kullanılır

```bash
source .venv/bin/activate
python main.py
```

1. İlk seferde `cp .env.example .env` yap, `OPENAI_API_KEY` yaz.
2. `python main.py` — pencere açılır, sağ üstte **API bağlı** olmalı.
3. **Bas-konuş**’u basılı tut, konuş, bırak. Bot metni çözer, cevap yazar, sesli okur.
4. Mikrofon yoksa kutuya yazıp Enter’a bas.
5. **Ses tonu** listesinden sesi değiştir (nova, onyx, coral…). Bir sonraki cevap yeni sesle gelir.
6. **Sesli cevap** kapalıysa sadece yazar, okumaz.
7. **Geçmişi temizle** konuşmayı sıfırlar.

Bu sürüm **bas-konuş**. ChatGPT Voice gibi sürekli dinleyip anında keserek cevap vermez. Sen konuşursun, bırakırsın, sonra cevap gelir (birkaç saniye). Gerçek zamanlı katman ayrı duruyor; istersen sonra eklenebilir.

Cevaplar kısa tutulur; hata olursa uygulama kapanmaz, mesajı ekranda gösterir.

## Test

```bash
source .venv/bin/activate
python -m pytest -q
```
