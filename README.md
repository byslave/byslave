# NEONPATLAT

Block Blast tarzı, neon temalı mobil puzzle. Parçayı sürükle, satır ve sütunu patlat, komboyu büyüt.

iOS ve Android için tek kod tabanı: **React + Vite + Capacitor**.

## Ekranlar

- **Oyna** — direkt başlar; 8x8, gravity, kombo, ses. Tahta boşalınca reaktör ışığı değişir.
- **Sıralama** — lige girmek isteyen burada hesap bağlar (isim + PIN)
- **Patlama Kasası** — patlama efektleri

## Geliştirme

```bash
npm install
npm run dev      # tarayıcıda oyna
npm test         # oyun motoru testleri
npm run build
```

## iOS / Android

```bash
npm i -D @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
npm run cap:sync
npm run ios        # Xcode
npm run android    # Android Studio
```

Uygulama kimliği: `com.byslave.neonpatlat`
