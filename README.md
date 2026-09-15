# Neon Blast

Paid neon arcade puzzle. Drag a piece, blast a row or column, grow the combo.

iOS and Android: **React + Vite + Capacitor**. Package id: `com.byslave.neonpatlat`. Store name: **Neon Blast**.

## Screens

- **Play** — 8×8 board, gravity chains, stage cabinets (1500 / 4000 / 9000 / 16000 / 28000). The map changes only after a full board clear. Combos 5x+ heat the cubes; 10x ignites the screen and rumbles the device.
- **Ranks** — email + password league (this device only). Other world-list names are stage racers.

The game opens as Guest. League bind happens only on Ranks.

Privacy page for the consoles: `public/privacy.html`. Host it on a public HTTPS URL (GitHub Pages: `https://byslave.github.io/byslave/privacy.html` after enabling Pages).

Store listing copy to paste: `store/PLAY.txt` and `store/APP_STORE.txt`. Icons: `store/icon-512.png`, `store/icon-1024.png`, `store/feature-graphic.png`.

## Develop

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

## Google Play (paid app)

1. One-time: [Google Play Console](https://play.google.com/console) developer account (~$25).
2. On this Mac/PC with Android Studio:

```bash
npm run cap:sync
npx cap open android
```

3. First time only — create an upload keystore (keep this file + passwords offline, never commit it):

```bash
keytool -genkeypair -v -keystore neon-blast-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias neon-blast
```

4. Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**. Use that keystore. Output is an `.aab`.
5. Play Console → Create app → **Neon Blast** → this is a **paid** app (you set the price; there is no in-app shop in the build).
6. Upload the AAB. Package name must stay `com.byslave.neonpatlat`.
7. Paste `store/PLAY.txt`, upload `store/icon-512.png` (hi-res icon) and `store/feature-graphic.png`, plus phone screenshots (portrait).
8. Data safety: no data shared; email/name stay on device if the player uses Ranks. No ads. No IAP.
9. Content rating questionnaire (Everyone / PEGI 3). Privacy policy URL from step above.
10. Roll out to production.

## App Store (paid app)

Needs a Mac, Xcode, and an [Apple Developer](https://developer.apple.com) account ($99/year).

```bash
npm i @capacitor/ios
npx cap add ios
npm run cap:sync
npx cap open ios
```

In Xcode: set signing team, Display Name **Neon Blast**, Bundle ID `com.byslave.neonpatlat`, version `1.0.0`. **Product → Archive** → Distribute App → App Store Connect.

App Store Connect: new iOS app, paid price, paste `store/APP_STORE.txt`, upload `store/icon-1024.png` and iPhone screenshots (6.7" and 6.1"). Privacy nutrition: data not linked to identity, not used for tracking.
