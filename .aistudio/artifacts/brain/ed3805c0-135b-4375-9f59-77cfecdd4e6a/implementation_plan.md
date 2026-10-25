# Accessible Read Aloud Controls for AI Legal Responses

Enhances the chat interface with an accessible, clearly labeled **Read Aloud** control suite on every AI response using the Web Speech API (`window.speechSynthesis`), complete with Play/Pause/Resume, Stop, playback speed selection (`0.85x`, `1x`, `1.25x`), active bubble highlighting with an animated audio equalizer indicator, and automatic per-message language detection (`pl-PL`, `en-GB`, `ro-RO`) with clean legal text normalization.

## User Review & Critical Decisions

> [!IMPORTANT]
> All product and UX decisions below were confirmed during the clarification step.

- **Confirmed Decision — Read Aloud Control Suite**: Every AI message displays a clearly labeled **Read Aloud** (`Odsłuchaj` / `Read aloud` / `Ascultă`) button in the message action bar. When active, it expands inline to reveal **Pause / Resume**, **Stop**, and a **Playback Speed** selector (`0.85x`, `1.0x`, `1.25x`).
- **Confirmed Decision — Active Bubble Visual Feedback**: While an AI response is being spoken (or paused mid-speech), its message bubble is highlighted with a high-contrast border and subtle glow, accompanied by an animated multi-bar audio indicator and live status badge (`Speaking...` / `Paused`).
- **Confirmed Decision — Auto Language Detection & Legal Text Normalization**: Before speaking, a text normalization pipeline strips markdown formatting, emojis, bullet symbols, and expands statutory abbreviations (e.g., `s.13 ERA 1996` → full spoken phrasing) while automatically detecting whether the message text is in Polish, Romanian, or English so the matching native synthesis voice is selected even if the user switched UI locales mid-conversation.

---

## 1. Overview & Core Concept

- **What It Does**: Provides workers with one-click spoken playback of Elon's UK employment law guidance directly inside each AI response bubble, with full playback control (Play, Pause/Resume, Stop, Speed) and clear visual state feedback.
- **Target Audience / Persona**: UK warehouse, factory, and transport workers checking legal advice on mobile or desktop who benefit from auditory comprehension—especially when reading dense statutory references in Polish, English, or Romanian after a long shift.
- **Key Value**: Makes complex UK employment rights advice effortless to absorb hands-free, while giving users full control to pause, slow down, or replay critical legal instructions.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Starting Playback**: Every AI message includes a prominent, accessible `Read Aloud` button (`min-h-[32px]`, clear icon + text label, `aria-label`, and `aria-pressed` state). Clicking it cancels any prior speech and begins reading the selected message aloud.
  2. **In-Playback Controls (Pause, Resume, Stop, Speed)**:
     - While a message is active, the control bar on that bubble displays:
       - **Pause / Resume** toggle button (`Pause` / `Resume` label + icon).
       - **Stop** button (`Stop` label + square stop icon).
       - **Speed** cycle button (`0.85x` · `1x` · `1.25x` in `font-mono tabular-nums`) that dynamically updates speech rate.
  3. **Active Visual Highlighting**:
     - The active AI message bubble receives an highlighted border (`border-[#FF6A00]/60` when speaking, `border-[#2EE59D]/50` when paused) and an animated 4-bar audio wave indicator in the bubble header/footer so the user can immediately spot which legal response is being read.
  4. **Auto-Read Toggle Integration**: The top chat toolbar's `Read Aloud` (`Auto-read`) toggle automatically triggers this enhanced speech engine whenever a new AI reply arrives.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-contrast, accessible utilitarian dark UI aligned with the Ask Elon palette.
  - *Color Palette & Mood*: Deep slate bubble canvas (`#0F2C4D`), energetic amber (`#FF6A00`) for active speech controls and animated audio bars, and emerald (`#2EE59D`) for default interactive affordances.
  - *Typography & Hierarchy*: `Plus Jakarta Sans` for single-line button labels (`whitespace-nowrap shrink-0`) and `JetBrains Mono` (`tabular-nums`) for speech rate multipliers (`0.85x`, `1x`, `1.25x`).

- **Interactive Feedback & Motion**:
  - Smooth CSS keyframe animation on the 4-bar equalizer indicator while actively speaking (pauses cleanly when speech is paused or `prefers-reduced-motion` is enabled).
  - Clean cleanup on component unmount or tab switch so speech never continues as a ghost background process.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Per-Message Language Detection + Voice Matching**
  - *Chosen Approach*: Inspect each AI message's text for Polish, Romanian, or English lexical/diacritic markers (falling back to the active app `locale`), and select the highest-quality matching `SpeechSynthesisVoice` (`pl-PL`, `ro-RO`, `en-GB`) available in the browser.
  - *Why*: Users frequently switch interface languages or have mixed-language chat history; detecting the language of the specific message prevents an English voice from attempting to read a Polish legal explanation.
  - *Alternatives Considered*: Hardcoding `utterance.lang` strictly to the current UI dropdown, which fails when reading older messages in a different language.

- **Decision 2: Legal Text & Symbol Normalization Pipeline**
  - *Chosen Approach*: Strip markdown (`**`, `*`, `#`, `` ` ``), decorative emojis (`⚖️`, `⚠️`, `📋`), and normalize UK statutory shorthand (such as `s.9`, `s.13`, `ERA 1996`, `NLW`, `SSP`) into natural spoken text before passing to `SpeechSynthesisUtterance`.
  - *Why*: Raw markdown and emojis cause screen readers and Web Speech API voices to read awkward punctuation or emoji names ("scales", "warning sign", "asterisk asterisk") in the middle of legal advice.
  - *Alternatives Considered*: Passing raw `msg.text` directly, which degrades comprehension.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ChatTab Speech Synthesis Controller                 │
│  • State: speakingMsgId, isPaused, speechRate (0.85 | 1.0 | 1.25)       │
│  • Voices Loader: window.speechSynthesis.onvoiceschanged                │
│  • Unmount & Tab-Switch Cleanup: speechSynthesis.cancel()               │
└───────────────┬─────────────────────────────┬───────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────┐ ┌───────────────────────────────────────┐
│   Speech Normalization Utils  │ │    AI Message Bubble Accessibility    │
│  • detectMessageLocale(text)  │ │  • Highlighted active bubble border   │
│  • cleanLegalTextForSpeech()  │ │  • Animated 4-bar audio wave indicator│
│    (strips markdown/emojis &  │ │  • Labeled Read Aloud / Pause /       │
│     expands UK legal abbrevs) │ │    Resume / Stop / Speed action bar   │
└───────────────────────────────┘ └───────────────────────────────────────┘
```

- **Data Model & State**:
  - `speakingMsgId: string | null`: ID of the AI message currently being spoken or paused.
  - `isSpeechPaused: boolean`: Tracks whether the active utterance is currently paused.
  - `speechRate: number`: User-selected playback speed (`0.85`, `1.0`, `1.25`).
  - `speechSupported: boolean`: Detects `"speechSynthesis" in window` and provides a graceful toast message if unsupported.

- **Interactive Component & State Mapping**:
  - **Play / Read Aloud Handler**: Normalizes message text, detects language (`pl-PL`, `ro-RO`, `en-GB`), picks the best available browser voice, configures `rate`, binds `onend`/`onerror` listeners to reset state, and starts playback.
  - **Pause / Resume Handler**: Calls `window.speechSynthesis.pause()` or `window.speechSynthesis.resume()` and updates `isSpeechPaused` state.
  - **Speed Selector Handler**: Cycles between `1.0x → 1.25x → 0.85x → 1.0x`; if a message is currently playing, restarts playback cleanly at the new speed.
