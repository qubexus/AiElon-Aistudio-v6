# Ask Elon v7 — jak uruchomić

## Wymagania
- Node.js 20+
- npm (lub yarn/pnpm)

## Instalacja
```bash
npm install
```

## Uruchomienie
```bash
# telefon (Expo Go) — zeskanuj QR
npx expo start

# przeglądarka
npx expo start --web

# Android (emulator / urządzenie)
npx expo start --android

# iOS (tylko macOS)
npx expo start --ios
```

## Backend AI (opcjonalnie)
Folder `server/` zawiera proxy do modelu Gemini.

```bash
cd server
npm install
GEMINI_API_KEY=twoj_klucz npm start
```
Bez klucza aplikacja działa, ale czat nie generuje odpowiedzi
(pokazuje komunikat o braku połączenia z serwerem).

## Build produkcyjny (Google Play)
```bash
npm i -g eas-cli
eas login
eas build -p android --profile production
```
Wymaga uzupełnienia `extra.eas.projectId` w `app.json`.

## Struktura
- `app/` — trasy (expo-router): `(tabs)/` = Start, Sprawy, Menu, Wzory, Profil; `chat.tsx` = pełnoekranowy czat; `case/[id].tsx` = sprawa; `glossary.tsx`, `search.tsx`, `camera.tsx`
- `src/` — `components/`, `store/` (AppContext + AsyncStorage), `theme/` (tokeny, motywy), `i18n/translations.ts` (EN/PL/RO), `utils/`, `data/`
- `assets/` — ikony, splash, logo
- `server/` — backend proxy do Gemini

## Typy
```bash
npx tsc --noEmit
```
