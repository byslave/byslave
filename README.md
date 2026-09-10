# NEONPATLAT

Block Blast tarzı neon arcade puzzle. Parçayı sürükle, satır ve sütunu patlat, komboyu büyüt, gizemli kutu aç.

iOS ve Android: **React + Vite + Capacitor**.

## Ekranlar

- **Oyna** — 8×8 tahta, yerçekimi zinciri, kademe kabinleri (1500 / 4000 / 9000 / 16000 / 28000). Harita ancak tahta tamamen temizlenince değişir.
- **Sıralama** — e-posta + şifre ile lig hesabı (cihazda saklanır).
- **Gizemli Kutu** — patlatınca ⚡ Neon jeton; 80⚡ kutudan altın, gümüş, meyve, RGB ve diğer blok türleri.

Oyun misafir olarak açılır. Lig sadece Sıralama’da bağlanır.

## Geliştirme

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

## iOS / Android

```bash
npm i -D @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
npm run cap:sync
npm run ios
npm run android
```

Uygulama kimliği: `com.byslave.neonpatlat`
