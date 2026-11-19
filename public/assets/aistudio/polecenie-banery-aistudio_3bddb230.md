# Ask Elon — AI Studio prompt: top + bottom banners

Paste this into AI Studio as a design/implementation brief. Do not invent a new palette. Do not deploy. Follow every constraint. Source of truth for the current top banner is `qubexus/AiElon-Aistudio-v6` commit `92ffea5` (19 November 2026, 02:07 London time). v7 (`223d2d3` deployed, local tip `7d9ea5a`) has no top banner yet and should receive the same design.

---

## Hard rules

- Calm, professional, restrained. **Not a Christmas tree.** Only neutrals (navy/slate/white) + green + turquoise. Orange (`#F59E42` / `#FBB063`) is not used in banner backgrounds or banner headline/body text. It may already appear in the “Elon” wordmark in the header *below* the top banner. Maximum **two accent colours per banner**; prefer **one**: turquoise `#2DD4BF` (dark theme) / `#0D9488` (light theme), at low opacity. Turquoise is a calming professional accent, not decoration. Glows stay ≤ 8–20% opacity.
- **No implied affiliation with the NSZZ “Solidarność” trade union.** Solidarity is a *value* (standing together, a community of migrant workers). Never use the union’s name as a proper noun, its logo, its distinctive “Solidarność” wordmark/typeface, or red-and-white banner styling. The everyday adjective is allowed: PL “solidarni”, EN “solidarity”, RO “solidari”.
- **Never cover the robot** (the hard-hat mascot).
  - Top: keep typographic mass in the **right third** (phone column may be 42% wide, right-aligned). The mascot rises into the top banner from the **left** of the header.
  - Bottom: never paint over the robot head, helmet, antenna, pedestal or glow. The bottom banner may reach **down to tab-label level only in the left and right wings**.
- Do not remove or overwrite existing header, tab bar, or content. Add the banners around them.
- Font everywhere: **Plus Jakarta Sans**.

---

## Current top banner (do not copy its typography colour or text placement)

In `src/App.tsx` (lines 31–36) and `src/index.css` (lines 1286–1337) on main `92ffea5`:

- Exact string, hardcoded English, `translate="no"`, **not in i18n**: `Elon, your mate`
- Default app language is nevertheless **Polish**; default theme is **dark**. The banner currently ignores locale.
- Size: `min-height: calc(80px + env(safe-area-inset-top))`, padding-top safe area, padding-bottom 10px, padding-left/right 88px.
- Placement today: flex, `align-items: flex-end`, `justify-content: center` — the line sits **bottom-centre**.
- Type today: Plus Jakarta Sans, 13px, weight 500, letter-spacing 0.5px, line-height 1.2, no uppercase, no shadow.
- Colour today: `rgba(46, 111, 87, 0.72)` light / `rgba(82, 183, 152, 0.72)` dark. Because the line sits on the *light* end of a **vertical** gradient, contrast is only **3.20:1** (light) and **4.28:1** (dark) — both fail WCAG AA 4.5:1. This must be fixed.
- Current gradients (vertical, 180deg), light: `#0B0F17 0%`, `#141D29 22%`, `#354B5E 48%`, `#CBD8E3 76%`, `#F8FAFC 100%`. Dark: `#0B0F17 0%`, `#0E141D 38%`, `#111820 72%`, `#141B23 100%`. Keep this **colour family**, change the axis and the text.
- Header mascot (`Header.tsx` 255–277) is absolutely positioned at the left, flush with the header bottom (`h-15` = 60px) and overlaps upward into the banner: 72×72 (<360), 84×96 (≥360, i.e. a 390 phone, 36px into the 80px banner, mascot top at 44px), 96×96 (≥640). Keep a **≥12px gap** from the mascot’s right edge to any banner text. The current 88px side padding is 8px too tight against a 96px mascot — do not repeat that.
- Branch `v1ninja` (`880a5a0`, 17 Nov 2026) has **no** top gradient banner.
- Full-screen chat (`ChatTab`, `fixed inset-0 z-40`) currently covers the banner. On chat, use a compact 44px + safe-area variant (white headline only) or hide the strip. Prefer the compact variant.
- There is no preview URL in `README.md` / `metadata.json`. Rely on the code. v7 has no top banner; its header is the “ask Elon” wordmark plus the i18n subtitle (“UK workplace rights advisor” / “Doradca prawa pracy w UK” / “Consilier în dreptul muncii din UK”). The v7 robot lives **only** in the bottom tab bar.

---

## TOP banner — build this

A full-width strip **above** the existing header, ~80px plus safe-area top.

### Gradient — dark side on the RIGHT

CSS angle **200deg** (0% = top-right, darkest; 100% = bottom-left, page background). White headline sits in that darker right-hand area. The lower zone, where the colour transitions toward the page background, holds the soft secondary line.

Light:

```css
background: linear-gradient(200deg,
  #0B0F17 0%, #141D29 18%, #1A2433 32%,
  #354B5E 48%, #CBD8E3 72%, #F8FAFC 100%);
```

Dark (fade to `#141B23`, never to white):

```css
background: linear-gradient(200deg,
  #0B0F17 0%, #0E141D 22%, #111820 48%,
  #141B23 78%, #141B23 100%);
```

Optional whisper (the only accent, keep it quiet):

```css
linear-gradient(200deg, rgba(45,212,191,0.08) 0%, rgba(45,212,191,0) 36%, transparent 100%)
```

### Layout

| | Phone 390 | Tablet ≥768 |
|---|---|---|
| min-height | 80px + `env(safe-area-inset-top)` | 88px + safe-area-top |
| padding-top | safe-area-top | same |
| padding-bottom | 8px | 10px |
| padding-left | **108px** (≥12px clear of the 84–96px mascot) | **120px** |
| padding-right | 16px | 24px |
| Text column | width **42%**, max 164px, right-aligned (optical mass in the right third; a strict 33% = 130px is too tight for PL/RO) | **33%**, max 280px, right-aligned |
| Headline vertical | 8px from the top of the 80/88px body, fully on a background no lighter than `#354B5E` | same idea |
| Secondary vertical | 6px below the headline (or 4px + 1×16px turquoise rule + 4px), in the transition zone; ≥8px above the strip’s bottom edge | same |

### Headline (white, darker part)

- Plus Jakarta Sans, weight **600**, 13px phone (min 12) / 15px tablet (min 13), letter-spacing 0.4px / 0.5px, line-height 1.2, sentence case, no uppercase, no text-shadow.
- Colour `#FFFFFF`.
- Contrast of white on the dark stops (must remain here): `#0B0F17` **19.18:1**, `#141D29` **16.97:1**, `#1A2433` **15.62:1**, `#354B5E` **9.05:1** (all AAA ≥ 7:1 except the last, still AAA for large / well above AA for body). The headline’s box centre must sit on a pixel whose contrast with white is ≥ 9:1.
- Copy (add to i18n; honour the active locale):
  - EN: `Elon, your mate` (13/600 ≈ 96.5px, one line)
  - PL: `Elon, Twój kumpel` (≈ 111.8px, one line)
  - RO: `Elon, colegul tău` (≈ 103.1px, one line)

### Secondary line (solidarity / emigrants, fade-in, lower, in the transition)

- Plus Jakarta Sans, weight **500**, 11px phone (do not go below 11) / 12px tablet, letter-spacing 0.2–0.25px, line-height 1.25, max **2** lines (prefer 1).
- Colour: if the background luminance under the line is low (e.g. `#354B5E`, `#111820`), use `rgba(241, 245, 249, 0.78)` — composite contrast on `#354B5E` is **5.18:1** (AA). If the line sits on a lighter transition (`#CBD8E3` / `#E8EEF3`), use `rgba(30, 41, 59, 0.80)` — **6.97:1** on `#E8EEF3`. Do **not** set this line in turquoise (`#2DD4BF` @ 85% on `#354B5E` is only 3.96:1).
- Optional 1×16px right-aligned rule in `#2DD4BF` / `#0D9488` at 70% between the two lines — the only turquoise accent.
- Animation: after the strip is visible, wait **400ms**, then 700ms fade-in + `translateY(4px → 0)`, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Honour `prefers-reduced-motion`: no movement, 200ms opacity or instant. Do not loop or pulse.
- Variants (prefer the first on a 390px phone). Never imply the union:

**PL:** (1) `Solidarni na emigracji` (11px ≈ 111px) (2) `Razem, daleko od domu` (3) `Siła wspólnoty na emigracji` (likely two lines on phone)

**EN:** (1) `Together, away from home` (≈ 140px, one line in a 164px column) (2) `Stronger together, far from home` (break after the comma) (3) `A community of workers abroad`

**RO:** (1) `Solidari în emigrație` (≈ 103px) (2) `Împreună, departe de casă` (3) `Mai puternici împreună, departe de casă` (tablet or two lines only)

### Wrapping (both banners)

1. `hyphens: none` (RN `hyphenation="none"`). No mid-word breaks (`word-break: normal`).
2. `text-wrap: balance` where CSS allows; otherwise break after a comma or a natural space (`Elon,` / `Twój kumpel`). Never split `Elon` from its comma.
3. First shrink to the min size in the tables, then wrap (top: max 2 lines; bottom: never wrap — ellipsis).
4. Last resort: ellipsis (`text-overflow: ellipsis`, RN `numberOfLines` + `ellipsizeMode="tail"`).

---

## BOTTOM banner — build this

Subtle, same colour family, **reaches down to tab-label level**, never covers the robot.

### Direction (required recommendation)

Use a **sideways** gradient that fades **inward toward the robot**, plus a light **downward** fade so the wash is almost gone at the labels.

Why not a single full-width downward fade: the robot stands in the centre and protrudes **33px** (phone 390) / **38px** (tablet ≥768) above the 58px / 64px tab-bar body (`robotMetrics` in v7 `RobotTabButton.tsx`). A full-width strip that reaches the labels would cross the head. A sideways fade in two **wings**, left and right of the notch (112px / 128px), lets the colour run down to the labels while the centre stays empty. Tab labels live in those wings; keep the banner ≤ 20% opacity at label level so label contrast stays ≥ 4.5:1 (`#94A3B8` on `#141B23` is 6.76:1 today).

### Geometry

Phone 390: centre cut-out width `notch + 16` = **128px**, centred, top of cut-out = robot tip + **8px** gap. Wings start **8px above** the tab-bar body and end at the **baseline of the tab labels**, above `env(safe-area-inset-bottom)`. Wing height ≈ **64px**. Horizontal margin 8px, corner radius 12px (16px on the inner corner facing the robot). Padding 12px.

Tablet ≥768: cut-out `notch + 20` = **148px**, 10px gap above the robot, wings start 10px above the 64px body, height ≈ **72px**, margin 12px, radius 16px, padding 16px.

Do not paint the pedestal glow (`head * 1.7` wide).

### Wing gradients (dark / light)

Left wing, 100% at the screen edge, 0% at the robot (right wing is mirrored):

Dark:

```css
linear-gradient(90deg,
  rgba(11,15,23,0.00) 0%,
  rgba(14,20,29,0.20) 28%,
  rgba(17,24,32,0.48) 62%,
  rgba(11,15,23,0.72) 100%);
```

Light (softer, max 0.50):

```css
linear-gradient(90deg,
  rgba(11,15,23,0.00) 0%,
  rgba(53,75,94,0.10) 30%,
  rgba(20,29,41,0.28) 65%,
  rgba(11,15,23,0.50) 100%);
```

Vertical mask on every wing:

```css
linear-gradient(180deg, #000 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.18) 100%);
```

### Copy, dismiss, motion

- Max **one line**, 11px / weight 500 / letter-spacing 0.2px, in the **upper half of the left wing** (the darker end). Right wing: dismiss only.
- Short copy: PL `Prawo pracy UK` or `Elon po Twojej stronie`; EN `UK work rights` or `Elon is on your side`; RO `Drepturi în UK` or `Elon e de partea ta`. Colour `rgba(241,245,249,0.86)` on the dark end.
- Dismiss “×”: **44×44** hit target, 16px icon, `rgba(241,245,249,0.7)`, upper half of the right wing, not on a tab label. aria-label: “Zamknij baner” / “Dismiss banner” / “Închide bannerul”.
- Persist dismiss (`ask-elon/bottom-banner/dismissed/v1`). Re-show after 14 days, after an app version change, or after a language change. Do not show on full-screen chat.
- Enter: 200ms delay, 280ms fade, ease-out. `prefers-reduced-motion`: 150ms or instant, no delay.
- Do not steal the tab items’ 48px min height or badges.

v7 metrics to use, not invent: phone 390 → bar 58, head 88, notch 112, headBottom 7, protrusion 33; tablet 768 → bar 64, head 100, notch 128, protrusion 38. Safe area: `max(insets.bottom, 0)` and on web `env(safe-area-inset-bottom)`.

---

## Palette (18 Nov 2026)

Light: bg `#F8FAFC`, surface `#FFFFFF`, green `#2E6F57`, orange `#F59E42` (not in banner fills), text `#1E293B` / `#64748B`, border `#E2E8F0`, turquoise `#0D9488`.

Dark: bg `#141B23`, surface `#1E2732`, green `#52B798`, orange `#FBB063`, text `#F1F5F9` / `#94A3B8`, border `#2C3847`, turquoise `#2DD4BF`.

Gradient family: `#0B0F17`, `#141D29`, `#354B5E`, `#CBD8E3`, `#F8FAFC` (light) and `#0B0F17`, `#0E141D`, `#111820`, `#141B23` (dark).

---

## Accessibility checklist

- Top headline `#FFFFFF` on the dark section: 9.05:1 to 19.18:1 (AAA).
- Secondary line ≥ 4.5:1 (measured 5.18:1 or better with the colours above).
- Tab labels remain ≥ 4.5:1 under the bottom wash.
- 44px tap targets. Decorative gradient has `pointer-events: none`. Prefer `aria-hidden="true"` on the top strip if the real title stays in the header wordmark (only one `role="banner"` per screen).
- Honour `prefers-reduced-motion`.
- Do not use colour alone.

---

## CSS sketch (AI Studio / web)

```css
.top-ad-banner-strip {
  width: 100%;
  min-height: calc(80px + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: 8px;
  padding-left: 108px;
  padding-right: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  background: linear-gradient(200deg, #0B0F17 0%, #141D29 18%, #1A2433 32%, #354B5E 48%, #CBD8E3 72%, #F8FAFC 100%);
}
html.dark .top-ad-banner-strip,
[data-theme="dark"] .top-ad-banner-strip {
  background: linear-gradient(200deg, #0B0F17 0%, #0E141D 22%, #111820 48%, #141B23 78%, #141B23 100%);
}
.top-ad-banner-col { width: 42%; max-width: 164px; text-align: right; padding-top: 8px; }
.top-ad-banner-title {
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: 13px; font-weight: 600; letter-spacing: 0.4px; line-height: 1.2;
  color: #fff; hyphens: none; text-wrap: balance;
}
.top-ad-banner-line {
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: 11px; font-weight: 500; letter-spacing: 0.2px; line-height: 1.25;
  color: rgba(241, 245, 249, 0.78);
  animation: bannerLineIn 700ms 400ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes bannerLineIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .top-ad-banner-line { animation: none; }
}
@media (min-width: 768px) {
  .top-ad-banner-strip { min-height: calc(88px + env(safe-area-inset-top, 0px)); padding-left: 120px; padding-right: 24px; }
  .top-ad-banner-col { width: 33%; max-width: 280px; }
  .top-ad-banner-title { font-size: 15px; letter-spacing: 0.5px; }
  .top-ad-banner-line { font-size: 12px; }
}
```

Implement the bottom wings as two absolutely positioned layers in the tab-bar wrap, with the centre notch left empty, gradients as specified, a 44px dismiss control, and no overlap with the robot button.

Reference mockups (390×844): `mockup-phone-dark.png` (PL) and `mockup-phone-light.png` (EN), in the same folder as this brief.
