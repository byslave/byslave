# BLOCK PATLAT

Block Blast–style neon arcade puzzle. Drag a piece, blast a row or column, grow the combo.

iOS and Android: **React + Vite + Capacitor**. App id: `com.byslave.neonpatlat`. Visible name: **BLOCK PATLAT**.

## Screens

- **Play** — 8×8 board, gravity chains, stage cabinets (1500 / 4000 / 9000 / 16000 / 28000). The map changes only after a full board clear. Combos 5x+ heat the cubes; 10x ignites the screen and rumbles the device.
- **Ranks** — email + password league (this device only). Other world-list names are stage racers.

The game opens as Guest. League bind happens only on Ranks.

Privacy: `public/privacy.html` (Play Console can use `https://byslave.github.io/byslave/privacy.html`).

## Develop

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

In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**. Upload the AAB. Package name stays `com.byslave.neonpatlat`.
