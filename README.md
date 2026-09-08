# NEONPATLAT

Block Blast tarzı, neon temalı mobil puzzle. Parçayı sürükle, satır ve sütunu patlat, komboyu büyüt.

iOS ve Android için tek kod tabanı: **React + Vite + Capacitor**.

## Ekranlar

- **Oyna** — 8x8 tahta, 3 parça, satır/sütun patlatma, kombo
- **Sıralama** — Reaktör Ligi haftalık yarış (arkadaşlar / dünya)
- **Patlama Kasası** — patlama efektleri (Neon Yağmuru, Jelibon Fırtınası, …)

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
