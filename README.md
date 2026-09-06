# Kişisel sesli sohbet botu

Kendi bilgisayarında çalışan, yalnızca senin kullanacağın bir sesli sohbet arkadaşı. Mikrofonla konuşur, cevabı hem metin hem ses olarak verir. Varsayılan **canlı konuşma** (OpenAI Realtime API): sürekli dinler, sustuğunda cevap verir, sözünü kesebilirsin. İstersen **bas-konuş**a da geçebilirsin.

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

Canlı konuşma `sohbet/engines/realtime.py` ve `sohbet/live.py` içinde. Bas-konuş `ChatSession` ile duruyor.

## Klasör yapısı

```
.
├── main.py
├── requirements.txt
├── env.ornek.txt
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
cp env.ornek.txt .env
```

`.env` içine kendi anahtarını yaz. Anahtarı koda veya sohbete yapıştırma.

```
GROQ_API_KEY=gsk_...
```

## Nasıl kullanılır

```bash
source .venv/bin/activate
python main.py
```

1. İlk seferde `cp env.ornek.txt .env` yap. Ücretsiz için `GROQ_API_KEY` yaz (https://console.groq.com/keys). OpenAI kredi ister.
2. `python main.py` — pencere açılır, sağ üstte **API bağlı** olmalı.
3. **Canlı konuşma** açıkken **Canlı başlat**’a bir kez bas. Konuş, sus; bot cevaplar. Sözünü kesmek için tekrar konuş.
4. Bitince **Canlı · durdur**.
5. Canlıyı kapatırsan eski **bas-konuş** (basılı tut / bırak) geri gelir.
6. Mikrofon yoksa kutuya yazıp Enter’a bas (canlı kapalıyken).
7. **Ses tonu** listesinden sesi değiştir.
8. **Geçmişi temizle** konuşmayı sıfırlar.

Canlı mod OpenAI Realtime API kullanır (`OPENAI_REALTIME_MODEL`, varsayılan `gpt-4o-mini-realtime-preview`). ChatGPT Voice gibi sunucu tarafında konuşma bitişini algılar ve sesi akış olarak çalar.

Cevaplar kısa tutulur; hata olursa uygulama kapanmaz, mesajı ekranda gösterir.

## Test

```bash
source .venv/bin/activate
python -m pytest -q
```
