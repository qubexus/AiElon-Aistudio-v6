# Ask Elon v7 — polecenie: baner górny i baner dolny

Dokument gotowy do przekazania projektantowi i programiście. Nic tu nie wdrażamy — to wytyczne. Wszystkie wymiary pochodzą z kodu (stan na 19 listopada 2026, czas londyński, GMT). Kolory i typografia zgodne z paletą z 18 listopada 2026.

**Pliki makiet (telefon 390×844):**

- `mockup-phone-dark.png` — motyw ciemny, nagłówek PL
- `mockup-phone-light.png` — motyw jasny, nagłówek EN

Wersja do wklejenia w AI Studio (angielski): `polecenie-banery-aistudio.md`.

---

## 0. Zasady nadrzędne (nie łamać)

1. **Nie choinka.** Banery są spokojne i profesjonalne. Dozwolone: neutrale (granat / łupek / biel) + zieleń + turkus. Pomarańcz (`#F59E42` / `#FBB063`) tylko jako mikroakcent (np. kropka 2 px albo już istniejący logotyp „Elon” w nagłówku pod banerem) — nie w tle ani w głównym tekście banera. **Maksimum dwa kolory akcentu na jeden baner** (rekomendacja: tylko turkus; zieleń ewentualnie jako drugi, bardzo oszczędny).
2. **Turkus jest akcentem uspokajającym**, nie ozdobą: `#2DD4BF` w motywie ciemnym, `#0D9488` w jasnym. Cienie i poświaty turkusu trzymać poniżej 20% krycia.
3. **Zero skojarzeń z NSZZ „Solidarność”.** Wolno mówić o solidarności jako wartości (bycie solidarnym, trzymanie się razem na emigracji). Nie wolno: nazwy związku, logotypu, charakterystycznego kroju „Solidarność” (pochylona, „sztandarowa” typografia), barw czerwono-białych w układzie sztandaru, hasła czy układu kojącego wyglądać jak identyfikacja związku. W tekstach unikać rzeczownika „Solidarność” jako nazwy własnej. Dopuszczalny jest przymiotnik „solidarni” / ang. „solidarity” / rum. „solidari” w znaczeniu potocznym.
4. **Banery nie nachodzą na robota** (maskotkę z kaskiem). Górny: tekst i ciemne pole trzymają się prawej strony, bo w AI Studio maskotka wchodzi w baner od lewej. Dolny: nigdy nie przykrywa głowy ani anteny robota wystającego ponad pasek zakładek; może schodzić do poziomu etykiet zakładek tylko w skrzydłach po lewej i prawej.
5. **Nie usuwać istniejącego interfejsu.** Baner górny dochodzi nad obecny nagłówek. Baner dolny jest warstwą nad tłem, pod (albo za, jeśli jest przezroczysty) etykietami zakładek, z wycięciem na robota.

---

## 1. Stan obecny (źródło prawdy: kod)

### 1.1 AI Studio — repozytorium `qubexus/AiElon-Aistudio-v6`

| Gałąź | Commit | Data (Londyn) | Baner górny |
|---|---|---|---|
| **main (najnowszy)** | `92ffea5fd08dcb4e7b347b06142d779fde6d8c3a` (`92ffea5`) | 19.11.2026, 02:07 | Tak. Dodany w `ca1a5d3` (19.11.2026, 00:03). Nie zmienił się od `16d8464`. |
| **v1ninja** | `880a5a0e8a4b8c7ecbb64d1fb75c18a686e04832` (`880a5a0`) | 17.11.2026, 02:09 | **Brak** paska z gradientem i podpisu. Jest tylko zwykły `<Header />`. |

W `README.md` i `metadata.json` **nie ma** publicznego URL podglądu. Z wcześniejszych zrzutów znany jest podgląd AI Studio (rama „Remix ask-elon-5”), ale przy ocenie wyglądu trzeba opierać się na kodzie, nie na ramce AI Studio:

`https://aistudio.google.com/apps/ed3805c0-135b-4375-9f59-77cfecdd4e6a?fullscreenApplet=true&showAssistant=true&showPreview=true`

**Dokładny napis w banerze górnym (main `92ffea5`):** zawsze angielski, **niedostępny w i18n**, z atrybutem `translate="no"`:

```
Elon, your mate
```

Nie ma wersji PL ani RO tego podpisu. Domyślny język aplikacji to **polski** (`loadLocale()` zwraca `"pl"`, gdy w `localStorage` nic nie ma — `src/services/storageService.ts:103-108`). Domyślny motyw to **ciemny** (`loadThemeMode()` → `"dark"`, linie 503-508). Mimo to pasek zawsze pokazuje angielski tekst.

**Miejsce i styl dziś** (`src/App.tsx:31-36`, `src/index.css:1286-1337`):

- Pasek na pełną szerokość, **nad** sticky nagłówkiem, `flex-shrink: 0`.
- Wysokość: `min-height: calc(80px + env(safe-area-inset-top, 0px))`; `padding-top: env(safe-area-inset-top)`; `padding-bottom: 10px`; `padding-left/right: 88px`.
- Układ podpisu: `display: flex; align-items: flex-end; justify-content: center` — tekst jest **na dole i na środku**.
- Gradient **pionowy**, `180deg` (ciemny u góry → tło u dołu).

Motyw jasny:

```
linear-gradient(180deg, #0B0F17 0%, #141D29 22%, #354B5E 48%, #CBD8E3 76%, #F8FAFC 100%)
```

Motyw ciemny:

```
linear-gradient(180deg, #0B0F17 0%, #0E141D 38%, #111820 72%, #141B23 100%)
```

Typografia podpisu (`.top-ad-banner-signature`):

- Font: `Plus Jakarta Sans`, fallback `-apple-system, BlinkMacSystemFont, sans-serif`
- 13 px, weight **500**, letter-spacing **0.5 px**, line-height **1.2**
- Bez uppercase, bez cienia, `pointer-events: none`, `user-select: none`
- Kolor jasny: `rgba(46, 111, 87, 0.72)` (zieleń `#2E6F57` @ 72%)
- Kolor ciemny: `rgba(82, 183, 152, 0.72)` (zieleń `#52B798` @ 72%)

**Problem kontrastu w obecnym układzie:** podpis siedzi na **jasnym** dole gradientu (bo `align-items: flex-end`). Złożony kolor `#679685` na `#F8FAFC` ma tylko **3,20:1** — nie spełnia WCAG AA (4,5:1) dla zwykłego tekstu. W motywie ciemnym złożony `#418B77` na `#141B23` ma **4,28:1** — też poniżej AA. Dlatego nowy układ przenosi główny napis do **ciemnej części** i daje mu **białą** czcionkę.

**Maskotka vs. baner** (`src/components/Header.tsx:233-277`): nagłówek ma `h-15` = **60 px** (Tailwind v4). Maskotka (`/brand/logo-mark.png`) jest `absolute left-0 bottom-0` i **wchodzi w górę w baner**:

| Szerokość okna | Maskotka (szer. × wys.) | Wystawanie w baner (wys. − 60) | Szczyt maskotki od góry banera (80 px) |
|---|---|---|---|
| < 360 px | 72 × 72 | 12 px | 68 px |
| ≥ 360 px (telefon 390) | 84 × 96 | 36 px | 44 px |
| ≥ 640 px (`sm`, tablet) | 96 × 96 | 36 px | 44 px |

Odstęp poziomy: baner ma padding 88 px, a maskotka na `sm` ma 96 px — **8 px nachodzenia** na pole tekstu. Nowy układ tego nie powtarza: tekst idzie na **prawą trzecią**, ciemna strona gradientu też jest po prawej, lewa zostaje dla maskotki z luzem.

Pod nagłówkiem (nie w banerze) jest logotyp `ask` + `Elon` (15 px / `sm` 18 px, weight 800, `ask` w `--logo-ask`, `Elon` w pomarańczu) oraz pastylka `DEMO`, a pod spodem status 10 px (`Header.tsx:289-305`).

Pełnoekranowy czat (`ChatTab.tsx`, `fixed inset-0 z-40`) **przykrywa baner i pasek zakładek**. Na zakładkach (Sprawy, Pisma, Forum, Profil) baner jest widoczny.

### 1.2 v7 (lokalny `round3-ninja-port` = `7d9ea5a`, wdrożone `223d2d3` z 18.11.2026, 18:38 Londyn)

**Banera górnego z gradientem nie ma.** Nagłówek to `Header` w `src/components/ui.tsx:97-160`: `paddingTop = safe-area-top + 8`, wiersz min. 44 px, logotyp „ask Elon” (20 px przy szer. < 380, inaczej 22 px, weight 800) i podtytuł z i18n:

- EN (domyślny język v7, `AppContext` initial `locale: "en"`): `UK workplace rights advisor`
- PL: `Doradca prawa pracy w UK`
- RO: `Consilier în dreptul muncii din UK`

Komentarz w kodzie: robot **nie** siedzi w górnym pasku — jest tylko na dolnym pasku zakładek. Motyw domyślny: **ciemny**.

**Pasek zakładek i robot** (`src/components/RobotTabButton.tsx:20-43`, `AppTabBar.tsx`):

```
robotMetrics(width):
  390 px:  bar 58, head 88, notch 112, headBottom 7, protrusion 33
  ≥ 768 px (próg w kodzie to 640): bar 64, head 100, notch 128, headBottom 7, protrusion 38
```

`protrusion` to ile głowa (z anteną, skala 1,05) wystaje **ponad** korpus paska. Całkowita wysokość wrapa: `protrusion + bar + safe-area-bottom`. Robot stoi na cokoliku 7 px, w wycięciu `notch` (112 / 128 px) na środku. Etykiety zakładek są w skrzydłach, w korpusie paska (ikonka 26 px + etykieta 12/16). `TAB_BAR_MIN_BOTTOM = 0`; na dole liczy się `max(insets.bottom, 0)` oraz na Web `env(safe-area-inset-bottom)`.

---

## 2. Baner górny — wytyczne docelowe (główna zmiana)

Cel: ten sam pasek ~80 px co w AI Studio, ale z ciemną stroną i masą typograficzną **po prawej**, białym nagłówkiem w ciemniejszej części gradientu oraz drugą, delikatnie wschodząca linią o solidarności na emigracji — w miejscu przejścia do jasnego tła.

### 2.1 Gradient (ciemny po prawej, jasny po lewej i u dołu)

Kierunek: **200°** (CSS `200deg`). 0% leży u góry po prawej (najciemniej), 100% u dołu po lewej (tło strony). Dzięki temu:

- biały nagłówek ma za sobą ciemne pole,
- dolna krawędź zmiękcza się w nagłówek aplikacji,
- lewa strona jest jaśniejsza i zostawia miejsce na maskotkę.

**Motyw jasny** (rodzina identyczna ze stanem obecnym, tylko obrót osi):

```
linear-gradient(200deg,
  #0B0F17 0%,
  #141D29 18%,
  #1A2433 32%,
  #354B5E 48%,
  #CBD8E3 72%,
  #F8FAFC 100%)
```

**Motyw ciemny** (nie schodzić do bieli — tylko do tła `#141B23`):

```
linear-gradient(200deg,
  #0B0F17 0%,
  #0E141D 22%,
  #111820 48%,
  #141B23 78%,
  #141B23 100%)
```

Opcjonalny, bardzo słaby drugorzędny nalot turkusem wyłącznie w ciemnym rogu, max 8% krycia, żeby nie robić drugiej tęczy:

```
/* na wierzchu, pointer-events: none */
linear-gradient(200deg, rgba(45, 212, 191, 0.08) 0%, rgba(45, 212, 191, 0) 36%, transparent 100%)
```

To jest jedyny akcent kolorystyczny banera górnego (turkus). Pomarańcza nie używać.

### 2.2 Wymiary, safe area, lumek względem maskotki

| | Telefon 390 px | Tablet ≥ 768 px |
|---|---|---|
| `min-height` | `80px + env(safe-area-inset-top)` | `88px + env(safe-area-inset-top)` |
| Padding górny | `safe-area-inset-top` | to samo |
| Padding dolny | 8 px | 10 px |
| Padding lewy | **108 px** (luźno obok maskotki 84–96 px; min. **12 px** odstępu od jej prawej krawędzi) | **120 px** |
| Padding prawy | 16 px | 24 px |
| Kolumna tekstu | szer. **42%** ekranu, max 164 px, wyrównana do prawej (optyczna masa w prawej trzeciej; 33% = 130 px jest za ciasne na dłuższe PL/EN/RO) | **33%** szerokości, max 280 px, do prawej |
| `text-align` / `alignItems` | `right` / `flex-end` w poziomie, w pionie od góry ciemnej strefy | to samo |
| Promień, obramowanie, cień | brak (pasek krawędź do krawędzi) | brak |

**W pionie (w polu 80/88 px, pod safe area):**

1. **Nagłówek (biały):** 8 px od góry pola treści. Musi w całości siedzieć tam, gdzie tło jest nie jaśniejsze niż `#354B5E` (w praktyce prawa-górna ćwiartka, zatrzymania 0–48%).
2. Odstęp 6 px.
3. **Druga linia:** niżej, w strefie przejścia (`#354B5E` → `#CBD8E3` w jasnym; `#111820` → `#141B23` w ciemnym). Nie schodzić niżej niż 8 px nad dolną krawędź paska i nie wchodzić w maskotkę poziomo (lewa krawędź kolumny tekstu ≥ prawa krawędź maskotki + 12 px).

Na telefonie 390: szczyt maskotki jest 44 px od góry paska, ale maskotka jest **po lewej** (0–84 px). Kolumna tekstu zaczyna się ok. x = 390 − 16 − 164 = 210, więc poziomy luz to ok. 210 − 84 = **126 px**. Kolizji nie ma, o ile tekst zostaje w prawej kolumnie.

W v7 dziś nie ma maskotki w nagłówku — te same wymiary i prawą kolumnę i tak stosujemy (spójność z AI Studio i decyzją o masie po prawej).

Na pełnoekranowym czacie: zostawić **wariant zwarty** 44 px + safe area, tylko biały nagłówek, bez drugiej linii — albo ukryć pasek, jeśli czat ma iść pod sam status bar. Rekomendacja: wariant zwarty, żeby marka była widoczna.

### 2.3 Typografia nagłówka (biała, w ciemnej części)

| | Telefon | Tablet |
|---|---|---|
| Font | Plus Jakarta Sans | to samo |
| Size / min | 13 px / min **12 px** | 15 px / min 13 px |
| Weight | 600 (SemiBold) | 600 |
| Letter-spacing | 0.4 px | 0.5 px |
| Line-height | 1.2 | 1.2 |
| Transform | bez uppercase (jak dziś: „Elon, your mate”) | to samo |
| Kolor | `#FFFFFF` | `#FFFFFF` |
| Cień tekstu | brak (kontrast i tak jest wysoki) | brak |
| Max linii | 1, awaryjnie 2 | 1, awaryjnie 2 |

**Kontrast bieli na ciemnej części (WCAG 2.x, tekst zwykły, AA ≥ 4,5:1, AAA ≥ 7:1):**

| Tło (zatrzymanie gradientu) | Kontrast `#FFFFFF` | Werdykt |
|---|---|---|
| `#0B0F17` (0%) | **19,18:1** | AAA |
| `#0E141D` | **18,48:1** | AAA |
| `#111820` | **17,87:1** | AAA |
| `#141D29` (18%) | **16,97:1** | AAA |
| `#1A2433` (32%) | **15,62:1** | AAA |
| `#2A3C4C` | **11,36:1** | AAA |
| `#354B5E` (48%, skraj strefy) | **9,05:1** | AAA |

Reguła implementacyjna: środek bounding-boxu nagłówka musi wypadać na pikselu o luminance względnej ≤ luminance `#354B5E` (kontrast bieli ≥ 9:1).

**Teksty nagłówka (dodać do i18n; dziś jest tylko zakodowane EN):**

| Język | Tekst | Szer. 13/600 | Na telefonie 114–164 px |
|---|---|---|---|
| EN | Elon, your mate | 96,5 px | 1 linia |
| PL | Elon, Twój kumpel | 111,8 px | 1 linia (ciasno w 114, wygodnie w 164) |
| RO | Elon, colegul tău | 103,1 px | 1 linia |

Domyślny język: w AI Studio **PL**, w v7 **EN**. Pokaż wersję zgodną z locale użytkownika (nie trzymać na sztywno angielskiego).

### 2.4 Druga linia — solidarność na emigracji (wschodzi w strefie przejścia)

Delikatna, krótka linia. Wschodzi po pojawieniu się paska (nie skacze). Kolor miękki, nie konkuruje z białym nagłówkiem.

| | Telefon | Tablet |
|---|---|---|
| Size / min | 11 px / min **11 px** (nie schodzić niżej — dostępność) | 12 px / min 11 px |
| Weight | 500 | 500 |
| Letter-spacing | 0.2 px | 0.25 px |
| Line-height | 1.25 | 1.25 |
| Max linii | 2 (preferuj 1) | 1, awaryjnie 2 |
| Kolor na ciemniejszym przejściu (lum. tła niska, np. `#354B5E` / `#111820`) | `rgba(241, 245, 249, 0.78)` czyli `#F1F5F9` @ 78% | to samo |
| Kontrast tego koloru na `#354B5E` | złożony ≈ `#BCC5CE` → **5,18:1** (AA) | |
| Kontrast na `#111820` @ 55–78% | **5,7–7:1** (AA / AAA) | |
| Kolor na jaśniejszym przejściu (np. `#CBD8E3` / `#E8EEF3`) | `rgba(30, 41, 59, 0.80)` czyli `#1E293B` @ 80% | to samo |
| Kontrast na `#E8EEF3` | **6,97:1** (AA, blisko AAA) | |
| Turkus do tekstu tej linii | **nie** — `#2DD4BF` na `#354B5E` @ 85% ma tylko 3,96:1 | |

Wybór koloru: jeśli względna luminance tła pod środkiem linii < 0,25, użyj jasnego `#F1F5F9` @ 78%; w przeciwnym razie ciemnego `#1E293B` @ 80%.

Opcjonalny mikroakcent (1 z 2 dozwolonych, tu jedyny): kreska 1×16 px w `#2DD4BF` / `#0D9488` @ 70%, wyrównana do prawej, między nagłówkiem a drugą linią (odstęp 4 px + kreska + 4 px zamiast 6 px).

**Animacja drugiej linii**

- Opóźnienie: **400 ms** od pojawienia się paska
- Czas: **700 ms**
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out)
- Od `opacity: 0` + `translateY(4px)` do docelowej opacity 1 (kolor już ma własne 78/80%) i `translateY(0)`
- `prefers-reduced-motion: reduce` — bez przesunięcia, opacity 0→1 w 200 ms albo od razu widoczna
- Nie zapętlać, nie pulsować

**Warianty tekstu (locale = język UI). Preferowany na telefonie = ten, który mieści się w 1 linii albo ładnie łamie się po przecinku.**

**PL**

1. **Solidarni na emigracji** (preferowany; 11 px ≈ 111 px) — przymiotnik „solidarni”, nie nazwa związku
2. Razem, daleko od domu
3. Siła wspólnoty na emigracji (na telefonie zwykle 2 linie)

**EN**

1. Together, away from home (preferowany na telefonie; 11 px ≈ 140 px — 1 linia w kolumnie 164 px, 2 linie w 114 px)
2. Stronger together, far from home (łamać po przecinku)
3. A community of workers abroad

**RO**

1. **Solidari în emigrație** (preferowany; 11 px ≈ 103 px)
2. Împreună, departe de casă
3. Mai puternici împreună, departe de casă (za długi na 1 linię na telefonie — tylko tablet albo 2 linie)

Nie używać: „Solidarność”, „NSZZ”, „ścieżka Solidarności”, czerwonego logotypu, fontu imitującego historyczny napis.

### 2.5 Łamanie długich PL/RO/EN (obie linie, oba banery)

1. `hyphens: none` / RN `hyphenation="none"`. Bez dzielenia wyrazów.
2. `word-break: normal`, `overflow-wrap: normal` (nie łamać w środku słowa).
3. `text-wrap: balance` tam, gdzie CSS na to pozwala; w RN trzymać znane łamania po przecinku albo spacji naturalnej (`Elon,` / `Twój kumpel`; `Together,` / `away from home`).
4. Najpierw zmniejsz font do minimum z tabeli, potem pozwól na 2 linie (nagłówek i druga linia górnego) albo 1 linię z wielokropkiem (baner dolny).
5. Ostateczność: `numberOfLines={2}` (góra) / `{1}` (dół) + `ellipsizeMode="tail"`.
6. Nie odrywać „Elon” od przecinka; w razie łamania łamać **po** przecinku.

---

## 3. Baner dolny — wytyczne

Cel: delikatny pas w tej samej rodzinie kolorystycznej, **schodzący do poziomu etykiet zakładek**, nigdy nie przykrywający robota.

### 3.1 Rekomendacja kierunku gradientu: **w bok, do środka** (nie w dół jako jedyny kierunek)

**Dlaczego na boki, zanikanie ku robotowi:**

- Robot stoi na środku i wystaje 33 px (telefon) / 38 px (tablet) **ponad** korpus paska. Pełnoszerokościowy pas, który schodzi do etykiet, musiałby przejechać przez głowę robota — tego nie wolno.
- Etykiety siedzą w skrzydłach. Naturalny kształt to dwa skrzydła po lewej i prawej stronie wycięcia (`notch` 112 / 128 px) z dodatkowym luzem.
- Gradient poziomy: pełniejsze, ciemniejsze/barwne przy zewnętrznych krawędziach, **zanika do 0 w stronę wycięcia**. Robot „wyłania się” z pustego środka.
- Lekkie **dodatkowe** zanikanie w dół (do 0 u dołu skrzydła) pilnuje, żeby etykiety zakładek (12 px, kolor `#94A3B8` / `#64748B`) zostały czytelne: na `#141B23` mają 6,76:1, na `#F8FAFC` zieleń etykiety aktywnej 5,69:1. Warstwa banera przy etykietach ma mieć ≤ 20% krycia.

Czysto pionowy fade pełnej szerokości **odrzucamy** jako główny kierunek: albo zostanie nad robotem (nie dojdzie do etykiet), albo go przykryje.

### 3.2 Wymiary (nad i w skrzydłach paska)

Telefon **390**:

- Wycięcie środkowe (nie malować / `pointer-events: none`): szerokość `notch + 16` = **128 px**, wycentrowane. Góra wycięcia = szczyt robota + **8 px** luzu (ok. `protrusion + 8` nad górą korpusu paska, praktycznie od góry wrapa).
- Skrzydła: od krawędzi ekranu do krawędzi wycięcia. Padding poziomy skrzydła: 12 px.
- Góra skrzydła: **8 px ponad** górną krawędź korpusu paska (58 px). To jest obok robota, nie nad nim — głowa zostaje w wycięciu.
- Dół skrzydła: **poziom linii bazowej etykiet** (dolna część korpusu 58 px), nad `safe-area-inset-bottom`. Nie wchodzić w pasek gestów.
- Wysokość skrzydła ≈ 8 + 58 = **66 px** minus ewentualny bezpieczny dolny margines 2 px → **64 px**.
- Promień wewnętrznej krawędzi (od strony robota): 16 px. Zewnętrzne narożniki: 0 (przy krawędzi ekranu) albo 12 px, jeśli pas nie dochodzi 8 px do krawędzi (wówczas poziomy margines 8 px).
- Rekomendacja: margines poziomy 8 px, promień 12 px, żeby pas nie kleił się do krawędzi.

Tablet **≥ 768**:

- Wycięcie: `notch + 20` = **148 px**, luz nad robotem **10 px**.
- Góra skrzydła: 10 px ponad korpus (64 px). Wysokość skrzydła ≈ **72 px**.
- Padding poziomy 16 px, margines 12 px, promień 16 px.

**Nigdy nie przykrywać:** głowy, kasku, anteny, cokolika i zielonej poświaty robota (poświata ma `head * 1.7` szer. — trzymaj wycięcie ≥ notch).

### 3.3 Gradient skrzydeł (ta sama rodzina co góra)

Malować osobno lewe i prawe skrzydło. Krycie całości skrzydła zaczynać od ok. 0,72 u krawędzi i schodzić do 0 przy wycięciu.

**Ciemny, skrzydło lewe** (100% = przy krawędzi ekranu, 0% = przy robocie):

```
linear-gradient(90deg,
  rgba(11, 15, 23, 0.00) 0%,
  rgba(14, 20, 29, 0.20) 28%,
  rgba(17, 24, 32, 0.48) 62%,
  rgba(11, 15, 23, 0.72) 100%)
```

**Ciemny, skrzydło prawe** — lustrzane, `270deg` (albo te same zatrzymania w `90deg` od krawędzi prawej).

Dodatkowo maska pionowa na każdym skrzydle:

```
linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.18) 100%)
```

(u dołu, przy etykietach, prawie znika).

**Jasny, skrzydło lewe:**

```
linear-gradient(90deg,
  rgba(11, 15, 23, 0.00) 0%,
  rgba(53, 75, 94, 0.10) 30%,
  rgba(20, 29, 41, 0.28) 65%,
  rgba(11, 15, 23, 0.50) 100%)
```

W jasnym motywie skrzydło jest delikatniejsze (max 0,50), żeby nie zrobić „brudnej belki” na `#F8FAFC`. Ten sam pionowy zanik do etykiet. Opcjonalny turkus tylko jako 1 px kreska przy zewnętrznej krawędzi @ 25% krycia — albo w ogóle pominąć, jeśli górny baner już ma kreskę (limit 2 akcentów, tu lepiej 0–1).

### 3.4 Treść, zamykanie, animacja

- Maks **1 linia**. Font Plus Jakarta Sans 11 px / 500, letter-spacing 0,2 px, kolor `#F1F5F9` @ 86% na ciemnym skrzydle (kontrast na `#0B0F17` ≫ 7:1) albo `#F8FAFC` @ 92% na ciemniejszym jasnym skrzydle. Na bardzo jasnym resztkowym tle nie kłaść tekstu — tylko po lewej, w ciemniejszej części skrzydła.
- Tekst tylko w **lewym** skrzydle (albo w tym, które jest ciemniejsze — przy naszym gradiencie oba końce są ciemniejsze; standard: lewe). Prawe skrzydło: przycisk zamknięcia.
- Propozycje (krótkie; 11 px):
  - PL: `Prawo pracy UK pod ręką` (≈ 131 px — mieści się w skrzydle 390: (390−128)/2 − 24 ≈ 107 px? **Za długie na 107 px.** Użyć krótszych:)
  - PL preferowany: `Prawo pracy UK` albo `Elon po Twojej stronie`
  - EN: `UK work rights` / `Elon is on your side`
  - RO: `Drepturi în UK` / `Elon e de partea ta`
- Przycisk **×**: hit area **44×44**, ikona 16 px, kolor `#F1F5F9` @ 70%, w prawym skrzydle, pionowo w górnej (ciemniejszej) połowie skrzydła, nie na etykiecie zakładki. `accessibilityLabel`: PL „Zamknij baner”, EN „Dismiss banner”, RO „Închide bannerul”.
- Po zamknięciu: zapisać na urządzeniu (`AsyncStorage` / `localStorage` klucz `ask-elon/bottom-banner/dismissed/v1`). **Pokazać ponownie** po 14 dniach, po zmianie wersji aplikacji albo po zmianie języka. Nie pokazywać na pełnoekranowym czacie (tam i tak nie widać paska zakładek w AI Studio; w v7 czat jest osobną trasą).
- Wejście: opacity 0→1 w **280 ms**, easing `ease-out`, opóźnienie 200 ms po starcie ekranu. `prefers-reduced-motion`: bez opóźnienia, 150 ms albo od razu.
- Nie zasłaniać etykiet, badge’y zakładek ani hit area 48× min. zakładek (`minHeight: 48` w `AppTabBar`). Tekst banera trzymać w górnej połowie skrzydła; dół zostaje dla etykiet.

---

## 4. Paleta (skrót, 18.11.2026)

| Token | Jasny | Ciemny |
|---|---|---|
| tło | `#F8FAFC` | `#141B23` |
| powierzchnia | `#FFFFFF` | `#1E2732` |
| zieleń | `#2E6F57` | `#52B798` |
| pomarańcz (nie w tle banerów) | `#F59E42` | `#FBB063` |
| tekst | `#1E293B` / `#64748B` | `#F1F5F9` / `#94A3B8` |
| obramowanie | `#E2E8F0` | `#2C3847` |
| turkus akcent | `#0D9488` | `#2DD4BF` |
| rodzina gradientu | `#0B0F17`, `#141D29`, `#354B5E`, `#CBD8E3`, `#F8FAFC` | `#0B0F17`, `#0E141D`, `#111820`, `#141B23` |

Font w całej aplikacji i na banerach: **Plus Jakarta Sans** (już ładowany w v7 i w AI Studio).

---

## 5. Dostępność

- Nagłówek górny: `#FFFFFF` na ciemnej strefie, kontrast **9,05–19,18:1** (AAA).
- Druga linia: dobór jasny/ciemny według luminance, minimum **5,18:1** (AA).
- Etykiety zakładek nie mogą spaść poniżej 4,5:1 przez warstwę dolnego banera — stąd zanik do ≤ 20% krycia na ich poziomie.
- Wszystkie elementy klikalne (×, ewentualnie cały dolny pas jeśli jest odnośnikiem — rekomendacja: nie jest) mają hit area **44×44**.
- `prefers-reduced-motion` opisany wyżej.
- Nie polegać wyłącznie na kolorze. Tekst jest czytelny sam z siebie.
- Druga linia i dolny tekst nie są jedynym źródłem informacji (to nastrój / tagline, nie instrukcja prawna).
- Kontrast liczony ze wzoru WCAG 2: \( (L_1+0,05)/(L_2+0,05) \).
- Górny pasek może mieć `aria-hidden` jeśli powiela markę z nagłówka; jeśli zostawiamy go dostępny: `role="banner"` tylko raz na stronę (nie dublować z `<header>`). Bezpieczniej: dekoracyjny, `aria-hidden="true"`, a prawdziwy tytuł zostaje w `Header` / `Wordmark`.
- Nie blokować fokusu; `pointer-events: none` na samym gradiencie, `auto` tylko na przycisku ×.

---

## 6. Gotowy fragment React Native (v7)

Wymiary brać z `robotMetrics()`. Do gradientu: `expo-linear-gradient` (albo odpowiednik). To szkic do wklejenia i dopasowania, nie gotowy do wdrożenia bez tesu na 390 i 768.

```tsx
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { robotMetrics } from "../components/RobotTabButton";

const FONT = "PlusJakartaSans-Medium";
const FONT_SEMI = "PlusJakartaSans-SemiBold";

export const TOP_BANNER_BODY = 80; // 88 on tablet
export const TOP_TEXT = {
  en: { title: "Elon, your mate", line: "Together, away from home" },
  pl: { title: "Elon, Twój kumpel", line: "Solidarni na emigracji" },
  ro: { title: "Elon, colegul tău", line: "Solidari în emigrație" },
} as const;

export function topBannerGradients(dark: boolean) {
  return dark
    ? (["#0B0F17", "#0E141D", "#111820", "#141B23", "#141B23"] as const)
    : (["#0B0F17", "#141D29", "#1A2433", "#354B5E", "#CBD8E3", "#F8FAFC"] as const);
}
export const TOP_BANNER_LOCATIONS_DARK = [0, 0.22, 0.48, 0.78, 1];
export const TOP_BANNER_LOCATIONS_LIGHT = [0, 0.18, 0.32, 0.48, 0.72, 1];
// start=top-right, end=bottom-left ≈ CSS 200deg
export const TOP_BANNER_START = { x: 1, y: 0 };
export const TOP_BANNER_END = { x: 0.15, y: 1 };

export const stylesBanners = StyleSheet.create({
  topStrip: { width: "100%", overflow: "hidden" },
  topInner: { flex: 1, justifyContent: "flex-start", alignItems: "flex-end" },
  topColPhone: { width: "42%", maxWidth: 164, paddingRight: 16, paddingTop: 8, paddingBottom: 8 },
  topColTablet: { width: "33%", maxWidth: 280, paddingRight: 24, paddingTop: 10, paddingBottom: 10 },
  topTitle: {
    fontFamily: FONT_SEMI, fontWeight: "600", color: "#FFFFFF",
    fontSize: 13, lineHeight: 16, letterSpacing: 0.4, textAlign: "right",
  },
  topTitleTablet: { fontSize: 15, lineHeight: 18, letterSpacing: 0.5 },
  topRule: { alignSelf: "flex-end", width: 16, height: 1, backgroundColor: "rgba(45,212,191,0.7)", marginTop: 4, marginBottom: 4 },
  topLine: {
    fontFamily: FONT, fontWeight: "500", color: "rgba(241,245,249,0.78)",
    fontSize: 11, lineHeight: 14, letterSpacing: 0.2, textAlign: "right",
  },
  topLineTablet: { fontSize: 12, lineHeight: 15, letterSpacing: 0.25 },
  // Bottom wings — parent is the tab-bar wrap (position: 'absolute', bottom: 0)
  bottomLayer: { ...StyleSheet.absoluteFillObject, pointerEvents: "box-none" },
  wing: { position: "absolute", overflow: "hidden" },
  wingText: {
    fontFamily: FONT, fontWeight: "500", color: "rgba(241,245,249,0.86)",
    fontSize: 11, lineHeight: 14, letterSpacing: 0.2,
  },
  dismissHit: { position: "absolute", width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dismissIcon: { color: "rgba(241,245,249,0.7)", fontSize: 16, lineHeight: 16 },
});

// Layout helpers for the bottom wings on a 390 / 768 canvas:
// const m = robotMetrics(width, height);
// const cut = m.notch + (width >= 768 ? 20 : 16);
// const rise = width >= 768 ? 10 : 8;
// const wingTop = m.protrusion - rise; // wings start a little above the bar body
// const wingH  = rise + m.bar - 2;
// left wing:  { left: 8,  width: (width - cut) / 2 - 8, top: wingTop, height: wingH }
// right wing: { right: 8, width: (width - cut) / 2 - 8, top: wingTop, height: wingH }
// Gradients: left  start{x:1,y:0} end{x:0,y:0}  (fades toward the robot)
//            right start{x:0,y:0} end{x:1,y:0}
```

Na Web / AI Studio odpowiednik CSS jest w `polecenie-banery-aistudio.md`.

---

## 7. Źródła w kodzie (do cytowania)

- AI Studio main `92ffea5` (19.11.2026, 02:07 Londyn): `src/App.tsx:31-36`, `src/index.css:1286-1337`, `src/components/Header.tsx:233-305`, `src/services/storageService.ts:103-108, 503-508`.
- AI Studio `v1ninja` `880a5a0` (17.11.2026, 02:09): brak paska.
- v7 `7d9ea5a` / wdrożone `223d2d3` (18.11.2026, 18:38): `src/components/ui.tsx:97-160, 343-354`, `src/components/RobotTabButton.tsx:20-43`, `src/components/AppTabBar.tsx:27-30, 58, 122-150`, `src/store/AppContext.tsx:133-134`, `src/i18n/translations.ts` klucze `header.advisor`.
- Paleta: `src/index.css:8-76` (AI Studio) i `src/theme/tokens.ts` (v7).

Niczego nie wypchnięto i nie wdrożono. To wyłącznie brief i makiety.
