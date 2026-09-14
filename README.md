# NEONPATLAT

Block Blast tarzı neon arcade puzzle. Parçayı sürükle, satır ve sütunu patlat, komboyu büyüt, gizemli kutu aç.

iOS ve Android: **React + Vite + Capacitor**. Uygulama kimliği: `com.byslave.neonpatlat`.

## Ekranlar

- **Oyna** — 8×8 tahta, yerçekimi zinciri, kademe kabinleri (1500 / 4000 / 9000 / 16000 / 28000). Harita ancak tahta tamamen temizlenince değişir.
- **Sıralama** — e-posta + şifre ile lig (yalnızca bu cihazda). Dünya listesindeki diğer isimler sahne yarışçılarıdır.
- **Gizemli Kutu** — patlatınca ⚡; 80⚡ kutudan patlama seti. Bloklar kombin 5x’te alev alır, 10x’te ekranı yakar.

Oyun misafir olarak açılır. Lig sadece Sıralama’da bağlanır.

Gizlilik metni: `public/gizlilik.html` (Play Console’a `https://byslave.github.io/byslave/gizlilik.html` konabilir).

## Geliştirme

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

## Google Play

```bash
npm i -D @capacitor/android
npx cap add android
npm run cap:sync
npx cap open android
```

Android Studio’dan **Build → Generate Signed Bundle / APK → Android App Bundle**. Play Console’a AAB yükle. Paket adı değişmez: `com.byslave.neonpatlat`.
