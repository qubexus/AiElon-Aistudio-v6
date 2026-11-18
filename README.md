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
- **Nowa paleta „alabaster & obsidian”** — jasny alabaster (`#F8FAFC`) i ciemny obsydian (`#141B23`), butelkowa zieleń (`#2E6F57`) i ciepły bursztyn (`#F59E42`) jako akcent. Pełna tabela kolorów i reguły kontrastu poniżej.
- **Typografia** — Plus Jakarta Sans (400/600/700/800) dla tekstu i DM Mono (500) dla danych technicznych, ładowane przez `expo-font`; `fontFamily` i skala `typography` są wspólne dla całej aplikacji.
- **Wordmark `ask Elon`** — „ask” pisane małą literą w kolorze marki, „Elon” z wielkiej litery w bursztynie; znak siedzi w nagłówku obok logo, z zachowanym odstępem i bez nachodzenia na akcje.
- **Znak wodny robota** — delikatna głowa robota (4% w Light, 6% w Dark) w tle baniek asystenta, za tekstem, bez wpływu na czytelność.
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
- **Design system** — dwa pełne motywy (Light „alabaster” i Dark „obsidian”) z przełącznikiem Light / Dark / System w Profilu. Kolory żyją w `src/theme/tokens.ts` jako palety (`lightColors`, `darkColors`) udostępniane przez proxy `colors`, a `createThemedStyles()` przebudowuje StyleSheet przy zmianie motywu. Szczegóły w sekcji „Paleta kolorów”.
- **Dostępność** — minimalny target dotyku 44 pt, `hitSlop` na ikonach, `accessibilityLabel` na logo i przyciskach.

---

## Paleta kolorów (alabaster & obsidian)

Dwa motywy, jeden zestaw tokenów. Wszystkie wartości znajdują się w `src/theme/tokens.ts`; komponenty nigdy nie używają hexów bezpośrednio, tylko `colors.*`.

| Token | Light — alabaster | Dark — obsydian | Zastosowanie |
| --- | --- | --- | --- |
| `surface` | `#F8FAFC` | `#141B23` | tło ekranów |
| `surfaceSecondary` | `#FFFFFF` | `#1E2732` | karty, pola formularzy |
| `surfaceTertiary` | `#EEF5F2` | `#162C28` | sekcje pomocnicze |
| `onSurface` | `#1E293B` | `#F1F5F9` | tekst główny |
| `muted` | `#64748B` | `#94A3B8` | tekst pomocniczy |
| `placeholder` | `#94A3B8` | `#6B7C8F` | placeholdery |
| `brand` | `#2E6F57` | `#52B798` | marka, ikony, „ask” |
| `accent` | `#F59E42` | `#FBB063` | wypełnienia CTA, pasek karty |
| `accentText` | `#A85E12` | `#FBB063` | bursztynowy **tekst** (kontrast ≥ 4.5:1) |
| `bubbleUser` | `#DCECE6` | `#1F4E3D` | bańka użytkownika |
| `bubbleBot` | `#FFFFFF` | `#232E3C` | bańka asystenta |
| `border` | `#E2E8F0` | `#2C3847` | obramowania |
| `successSoft` | `#E3F2EC` | `#1B3A31` | statusy pozytywne |
| `warningSoft` | `#FDF1E3` | `#3A2E25` | ostrzeżenia |
| `errorSoft` | `#FBE9E6` | `#3A2622` | błędy |
| `logoBadge` | `#FDE6CE` | `#3A2E25` | tło badge'a logo |
| `paper` | `#FFFFFF` | `#1E2732` | powierzchnia PDF/podglądu |

Reguły, których pilnuje kod:

- **Kontrast** — każdy tekst ma ≥ 4.5:1 (duże nagłówki ≥ 3:1). Dlatego bursztyn występuje w dwóch wariantach: `accent` do wypełnień i `accentText` do liter.
- **Motyw systemowy** — `ThemeMode = "light" | "dark" | "system"`; przy `system` używany jest `useColorScheme()`, a `StatusBar` przełącza się automatycznie.
- **Brak migotania** — `setActiveTheme()` ustawia paletę synchronicznie przed renderem, a `createThemedStyles()` trzyma cache per wersja palety, więc zmiana motywu to jedno przebudowanie stylów, nie pełny remount.
- **Opaque surfaces** — nagłówek i `Screen` mają nieprzezroczyste tło (`colors.surface`), żeby treść nieaktywnej zakładki nie prześwitywała.
- **Layout guards** — `MIN_TOUCH = 44`, `ACTION_HEIGHT = 48`, `HIT_SLOP`, `minWidth: 0` na kartach i `overflow: hidden` na bańkach; dzięki temu długie słowa i znak wodny nie rozpychają układu (weryfikowane brakiem poziomego overflow na wszystkich ekranach).

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
