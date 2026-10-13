# PULSE

Gece hayatı için harita merkezli mobil uygulama. Faz 0: tasarım sistemi, beş sekmeli kabuk, demo veriyle Harita / Akış / Gecem, 18+ kapısı ve Supabase hazırlığı.

## Çalıştırma

```bash
npm install
npm run web
npm run ios
npm run android
```

iOS için macOS gerekir. Android ve iOS’ta Expo Go yeterlidir; harita WebView içinde MapLibre kullanır.

## Ortam

`.env.example` dosyasını `.env` olarak kopyala. Hepsi boş bırakılırsa uygulama **demo** modunda açılır.

- `EXPO_PUBLIC_SUPABASE_URL` — istemci. Supabase proje adresi.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — istemci. Yalnızca anon anahtar.
- `EXPO_PUBLIC_MAPBOX_TOKEN` — istemci. Doluysa harita Mapbox Dark stilini kullanır.
- `SUPABASE_SERVICE_ROLE_KEY` — yalnızca sunucu. Uygulama ikilisine koyma.

## Demo

İlk açılışta 18+ kapısından geç. “Demoya gir” örnek İstanbul / Ankara / İzmir gecelerini açar. Katılım sayıları, sıralama ve gece kartı örnek diye işaretlidir. “Gidiyorum” sayacı bu cihazda artar.

## Kalite

```bash
npm run typecheck
npm run lint
npm test
```

Testler yaş kapısı, katılım sayacı, hafta sonu tarihi ve harita kümelemesini kapsar. Sıçrama algılama Faz 3’tedir.

## Fotoğraflar

Demo görseller Unsplash üzerindedir ve örnek içeriktir:

- https://unsplash.com/photos/1516450360452-9312f5e86fc7
- https://unsplash.com/photos/1429962714451-bb934ecdc4ec
- https://unsplash.com/photos/1470229722913-7c0e2dbbafd3
- Portreler: 1534528741775, 1500648767791, 1524504388940, 1507003211169
