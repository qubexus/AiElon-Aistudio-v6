# Ask Elon — Ninja wersja siódma

Natywna aplikacja (iOS / Android) doradcy prawa pracy UK, zbudowana na **Expo SDK 58 / React Native 0.88 / React 19** i TypeScript. Repozytorium zawiera dwie niezależne części: aplikację mobilną w katalogu głównym oraz lekki backend API w `server/`.

---

## Co nowego w wersji 7

- **Branding** — głowa robota (logo aplikacji) jest teraz widoczna w górnym pasku każdego ekranu głównego, w zaokrąglonym badge'u z delikatnym cieniem, bez nachodzenia na tytuł i akcje po prawej. Logo zasila też ikonę aplikacji, splash, adaptive icon Androida i favicon.
- **Odsłuch odpowiedzi** — każda odpowiedź Elona ma przycisk „Odsłuchaj / Read aloud” (`expo-speech`, głos dopasowany do języka: pl-PL, en-GB, ro-RO).
- **Eksport pism do PDF** — gotowe pismo można wygenerować jako A4 PDF i udostępnić systemowym sheetem (`expo-print` + `expo-sharing`).
- **Podgląd zapisanych pism** — w Profilu: pełna treść w modalu, kopiowanie do schowka, PDF i usuwanie.
- **Priorytet sprawy** — niski / średni / wysoki, ustawiany w szczegółach sprawy.
- **Wyszukiwarka** — w Sprawach i Pismach (tytuł, opis, pracodawca, sektor, kategoria, przepis).
- **Onboarding** — ekran powitalny przy pierwszym uruchomieniu z wyborem języka i imieniem.
- **Porządki** — usunięte `expo-secure-store` i `expo-font`, backend nie serwuje już Vite ani statycznego web builda (czyste API dla aplikacji natywnej), model Gemini konfigurowalny przez `GEMINI_MODEL`.

---

## Języki (i18n)

Aplikacja jest w pełni trójjęzyczna: **English (domyślny)**, **Polski** i **Română**. Język można zmienić w onboardingu oraz w Profilu, a wybór jest zapamiętywany lokalnie.

- Wszystkie teksty interfejsu (nawigacja, czat, sprawy, pisma, profil, komunikaty, błędy, etykiety dostępności) znajdują się w `src/i18n/translations.ts`.
- Słownik angielski jest źródłem prawdy (`as const`), a typ `TranslationKey` wymusza na kompilatorze, że polski i rumuński mają **każdy** klucz — brak tłumaczenia to błąd TypeScript.
- Daty i godziny formatowane są przez `Intl` z tagami `en-GB` / `pl-PL` / `ro-RO`, a odsłuch (TTS) używa tego samego języka.
- Pisma prawne generowane są po angielsku (wymóg brytyjskich pracodawców i trybunałów) — ekran pisma pokazuje stosowną informację w wybranym języku.

---

## Struktura repozytorium

```
.
├── app/                     # expo-router (file-based routing)
│   ├── _layout.tsx          # root stack + AppProvider
│   ├── (tabs)/
│   │   ├── _layout.tsx      # dolna nawigacja: Czat / Sprawy / Pisma / Profil
│   │   ├── index.tsx        # Czat ze streamem SSE + odsłuch
│   │   ├── cases.tsx        # lista spraw + wyszukiwarka
│   │   ├── templates.tsx    # biblioteka pism + wyszukiwarka
│   │   └── profile.tsx      # profil, historia pism, podgląd/kopiuj/PDF
│   ├── case/[id].tsx        # szczegóły sprawy (status, priorytet, notatki)
│   └── template/[id].tsx    # formularz pisma + podgląd + PDF
├── src/
│   ├── api/client.ts        # health, chat, SSE stream, transkrypcja, analizy
│   ├── components/ui.tsx    # Screen, Header (z logo), Card, Pill, Button, Field…
│   ├── data/legalTemplates.ts
│   ├── i18n/translations.ts # pl / en / ro
│   ├── store/AppContext.tsx # stan + AsyncStorage + online probe
│   ├── theme/tokens.ts      # kolory, spacing, radius, typografia
│   ├── types/index.ts
│   └── utils/
│       ├── letter.ts        # parser tagów odpowiedzi AI
│       ├── pdf.ts           # A4 → PDF → share
│       └── speech.ts        # TTS + czyszczenie tekstu
├── assets/                  # logo, ikony, splash
├── server/                  # Express 5 + @google/genai (API only)
│   ├── server.ts
│   ├── package.json
│   └── .env.example
├── app.json
├── package.json
└── tsconfig.json
```

---

## Wymagania

- Node.js 20+
- npm 10+
- Do uruchomienia na telefonie: aplikacja **Expo Go** (SDK 58) lub lokalny build (`npx expo run:ios` / `run:android`)
- Klucz **Google Gemini API** dla backendu

---

## Szybki start

### 1. Backend

```bash
cd server
cp .env.example .env      # wpisz GEMINI_API_KEY
npm install
npm run dev               # http://localhost:3000
```

Endpointy:

| Metoda | Ścieżka | Opis |
| --- | --- | --- |
| GET | `/api/health` | status + informacja o skonfigurowanym kluczu |
| POST | `/api/gemini/chat` | odpowiedź AI (JSON) |
| POST | `/api/gemini/chat-stream` | odpowiedź AI (SSE) |
| POST | `/api/gemini/transcribe` | transkrypcja nagrania |
| POST | `/api/gemini/analyze-letter-sentiment` | ton pisma |
| POST | `/api/gemini/legal-summary` | streszczenie prawne |
| POST | `/api/gemini/detect-document-type` | rozpoznanie typu dokumentu |
| POST | `/api/email/transcript` | wysyłka transkryptu (Resend, opcjonalne) |

### 2. Aplikacja

```bash
cp .env.example .env
npm install
npm start
```

W `.env` ustaw `EXPO_PUBLIC_BACKEND_URL` na adres komputera w sieci LAN (np. `http://192.168.1.10:3000`). Jeśli zmienna jest pusta, aplikacja wyprowadza host z adresu Metro i dokłada `:3000`.

Skrypty:

```bash
npm run start        # Expo dev server
npm run android      # Android
npm run ios          # iOS
npm run typecheck    # tsc --noEmit
npm run export:web   # smoke test bundlingu (dist/)
```

---

## Architektura w skrócie

- **Routing** — `expo-router` z typed routes; grupa `(tabs)` to cztery główne ekrany, a `case/[id]` i `template/[id]` to stos szczegółów.
- **Stan** — `AppContext` trzyma profil, sprawy, pisma i wiadomości; wszystko jest zapisywane w `AsyncStorage` pod kluczem `ask-elon/state/v1`. Co 30 s wykonywany jest probe `/api/health`, który ustawia flagę `online`.
- **Streaming** — React Native nie ma `ReadableStream`, więc SSE jest parsowane ręcznie na `XMLHttpRequest` w `streamElon()`.
- **Protokół odpowiedzi AI** — model opakowuje list po angielsku w `[ENGLISH_LETTER_START]…[ENGLISH_LETTER_END]`, a aktualizację profilu w `[PROFILE_UPDATE_START]…[PROFILE_UPDATE_END]`; `parseAnswer()` rozdziela te sekcje od rozmowy.
- **Design system** — jasny motyw (`#FBF8F3`), butelkowa zieleń (`#1D4F3C`), granat (`#132B41`) i pomarańcz (`#F97316`) jako akcent. Nagłówek jest półprzezroczysty (glass), a logo siedzi w badge'u `#FFF4EA` z obramowaniem `#F3DCC8`, dzięki czemu pomarańczowo-zielona głowa robota jest czytelna na jasnym tle.
- **Dostępność** — minimalny target dotyku 44 pt, `hitSlop` na ikonach, `accessibilityLabel` na logo i przyciskach.

---

## Assety brandingu

Wszystkie pliki w `assets/` powstały z jednego źródłowego PNG (`elon-robot-oryginal-przezroczysty.png`, 1485×1546, RGBA) przez przycięcie do kanału alfa i osadzenie na kanwie:

| Plik | Przeznaczenie |
| --- | --- |
| `logo-robot.png` | logo w treści (przezroczyste, 512 px) |
| `logo-mark.png` | znaczek w górnym pasku (256 px, kwadrat) |
| `icon.png` | ikona aplikacji 1024×1024 na `#FBF8F3` |
| `splash-icon.png` | splash 1024×1024 (przezroczysty) |
| `android-icon-foreground.png` | adaptive icon — pierwszy plan |
| `android-icon-background.png` | adaptive icon — tło `#FBF8F3` |
| `android-icon-monochrome.png` | motyw monochromatyczny |
| `favicon.png` | favicon 128 px |

---

## Licencja

Projekt prywatny — wszelkie prawa zastrzeżone.
