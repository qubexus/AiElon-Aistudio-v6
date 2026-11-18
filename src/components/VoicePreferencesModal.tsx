import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { ElonVoiceConfig, ElonVoicePreset, Locale } from "../types";
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Check,
  X,
  Bot,
  Sliders,
  ShieldCheck,
  RotateCcw,
  Headphones,
  UserCheck,
} from "lucide-react";

const SAMPLE_TEXTS: Record<Locale, Record<ElonVoicePreset, string>> = {
  pl: {
    young_professional:
      "Cześć, tu Elon. Rozumiem Twoją sytuację w pracy. Przeanalizowałem przepisy i wspólnie ustalimy najlepszą strategię, żeby odzyskać Twoje należności.",
    standard:
      "Witaj. Jestem Twoim asystentem prawa pracy w Wielkiej Brytanii. Gotowy do analizy Twojej sprawy i wygenerowania oficjalnych dokumentów.",
  },
  en: {
    young_professional:
      "Hi there, I'm Elon. I've got your back on this workplace issue. Let's look at UK statutory rights and get your missing pay sorted out.",
    standard:
      "Hello. I am your UK employment law AI assistant. Ready to assess your case details and statutory rights under UK law.",
  },
  ro: {
    young_professional:
      "Salut, sunt Elon. Înțeleg perfect situația ta la locul de muncă. Hai să verificăm drepturile tale legale din Marea Britanie și să rezolvăm problema.",
    standard:
      "Bună ziua. Sunt asistentul tău pentru legislația muncii din Marea Britanie. Pregătit să analizez cazul dumneavoastră.",
  },
};

export const VoicePreferencesModal: React.FC = () => {
  const {
    isVoicePreferencesModalOpen,
    setIsVoicePreferencesModalOpen,
    voiceConfig,
    updateVoiceConfig,
    locale,
    showToast,
    t,
  } = useApp();

  const [selectedPreset, setSelectedPreset] = useState<ElonVoicePreset>(
    voiceConfig.preset || "young_professional"
  );
  const [pitch, setPitch] = useState<number>(voiceConfig.pitch ?? 0.98);
  const [speed, setSpeed] = useState<number>(voiceConfig.speed ?? 1.0);
  const [autoReadAloud, setAutoReadAloud] = useState<boolean>(
    voiceConfig.autoReadAloud ?? true
  );
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const sampleUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isVoicePreferencesModalOpen) {
      setSelectedPreset(voiceConfig.preset || "young_professional");
      setPitch(voiceConfig.pitch ?? (voiceConfig.preset === "young_professional" ? 0.98 : 1.0));
      setSpeed(voiceConfig.speed ?? (voiceConfig.preset === "young_professional" ? 1.0 : 1.05));
      setAutoReadAloud(voiceConfig.autoReadAloud ?? true);
    } else {
      stopSampleAudio();
    }
  }, [isVoicePreferencesModalOpen, voiceConfig]);

  // Load voices for preview
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const updateVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Stop preview when unmounting or closing
  const stopSampleAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    sampleUtteranceRef.current = null;
    setIsPlayingSample(false);
  };

  const handlePresetSelect = (preset: ElonVoicePreset) => {
    stopSampleAudio();
    setSelectedPreset(preset);
    if (preset === "young_professional") {
      setPitch(0.98);
      setSpeed(1.0);
    } else {
      setPitch(1.0);
      setSpeed(1.05);
    }
  };

  const playSampleAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      showToast(t("speechUnsupported") || "Speech not supported");
      return;
    }

    if (isPlayingSample) {
      stopSampleAudio();
      return;
    }

    window.speechSynthesis.cancel();

    const sampleText =
      SAMPLE_TEXTS[locale]?.[selectedPreset] || SAMPLE_TEXTS.pl[selectedPreset];
    const utterance = new SpeechSynthesisUtterance(sampleText);

    const langTag =
      locale === "pl" ? "pl-PL" : locale === "ro" ? "ro-RO" : "en-GB";
    utterance.lang = langTag;
    utterance.pitch = pitch;
    utterance.rate = speed;
    utterance.volume = 1.0;

    // Pick matching voice
    const voicePool =
      availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const langPrefix = langTag.split("-")[0].toLowerCase();
    const matchingLangVoices = voicePool.filter((v) =>
      v.lang.toLowerCase().replace("_", "-").startsWith(langPrefix)
    );
    const candidates = matchingLangVoices.length > 0 ? matchingLangVoices : voicePool;

    if (selectedPreset === "young_professional") {
      const youngKeywords = [
        "krzysztof",
        "marek",
        "jan",
        "ryan",
        "oliver",
        "george",
        "daniel",
        "emil",
        "andrei",
        "plb",
        "pld",
      ];
      const femaleKeywords = [
        "female",
        "kobieta",
        "woman",
        "paulina",
        "agnieszka",
        "zosia",
        "ewa",
        "maja",
        "karolina",
        "katarzyna",
        "hazel",
        "zira",
      ];

      const best = candidates.find((v) => {
        const n = `${v.name} ${v.voiceURI}`.toLowerCase();
        const isFem = femaleKeywords.some((k) => n.includes(k));
        const isYoung = youngKeywords.some((k) => n.includes(k));
        return isYoung && !isFem;
      }) || candidates.find((v) => {
        const n = `${v.name} ${v.voiceURI}`.toLowerCase();
        return (n.includes("male") || n.includes("męski")) && !femaleKeywords.some((k) => n.includes(k));
      });

      if (best) {
        utterance.voice = best;
      }
    } else {
      // Standard AI voice: pick default or neural assistant voice
      const standardAssistant = candidates.find((v) => {
        const n = `${v.name} ${v.voiceURI}`.toLowerCase();
        return n.includes("natural") || n.includes("google") || n.includes("online");
      }) || candidates[0];

      if (standardAssistant) {
        utterance.voice = standardAssistant;
      }
    }

    utterance.onend = () => {
      setIsPlayingSample(false);
      sampleUtteranceRef.current = null;
    };

    utterance.onerror = () => {
      setIsPlayingSample(false);
      sampleUtteranceRef.current = null;
    };

    sampleUtteranceRef.current = utterance;
    setIsPlayingSample(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveAndApply = () => {
    stopSampleAudio();
    const updated: ElonVoiceConfig = {
      preset: selectedPreset,
      pitch,
      speed,
      autoReadAloud,
    };
    updateVoiceConfig(updated);
    setIsVoicePreferencesModalOpen(false);

    showToast(
      locale === "pl"
        ? `Zapisano preferencje głosu: ${
            selectedPreset === "young_professional"
              ? "Młody / Profesjonalny męski"
              : "Standardowy asystent AI"
          }`
        : locale === "ro"
        ? "Preferințele de voce au fost salvate cu succes!"
        : `Saved voice preferences: ${
            selectedPreset === "young_professional"
              ? "Young / Professional male"
              : "Standard AI assistant"
          }`
    );
  };

  const handleResetToPresetDefaults = () => {
    stopSampleAudio();
    if (selectedPreset === "young_professional") {
      setPitch(0.98);
      setSpeed(1.0);
    } else {
      setPitch(1.0);
      setSpeed(1.05);
    }
  };

  if (!isVoicePreferencesModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        stopSampleAudio();
        setIsVoicePreferencesModalOpen(false);
      }}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-[#0B0F17] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#131B2E] via-[#1A243B] to-[#0A1F36] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D97724] to-[#38B28B] p-0.5 shadow-md shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#0B0F17] flex items-center justify-center text-white">
                <Headphones className="w-5 h-5 text-[#38B28B]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {locale === "pl"
                    ? "Preferencje głosu Elona"
                    : locale === "ro"
                    ? "Preferințe voce Elon"
                    : "Elon Voice Preferences"}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#38B28B]/15 border border-[#38B28B]/40 text-[#38B28B] text-[10px] font-extrabold uppercase tracking-wider">
                  TTS
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {locale === "pl"
                  ? "Dopasuj tembr, barwę i tempo wypowiedzi swojego doradcy prawa pracy"
                  : locale === "ro"
                  ? "Alege stilul și viteza vocii asistentului tău juridic"
                  : "Tune the tone, pitch, and delivery of your UK employment advisor"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopSampleAudio();
              setIsVoicePreferencesModalOpen(false);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
          {/* Section 1: Presets Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#94A3B8] mb-3">
              {locale === "pl"
                ? "Wybierz profil głosu"
                : locale === "ro"
                ? "Selectează profilul vocal"
                : "Select Voice Profile"}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: Young / Professional Male */}
              <button
                type="button"
                onClick={() => handlePresetSelect("young_professional")}
                className={`relative text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPreset === "young_professional"
                    ? "bg-[#131B2E] border-[#38B28B] shadow-[0_0_20px_rgba(46,229,157,0.2)]"
                    : "bg-[#0A1A2E]/80 border-white/10 hover:border-white/20 hover:bg-[#131B2E]/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#38B28B]/15 border border-[#38B28B]/40 flex items-center justify-center text-[#38B28B]">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#38B28B]/20 text-[#38B28B] text-[10px] font-black tracking-wide uppercase border border-[#38B28B]/30">
                      {locale === "pl"
                        ? "Zalecany · ~28 lat"
                        : locale === "ro"
                        ? "Recomandat · ~28 ani"
                        : "Recommended · ~28 y/o"}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-white mb-1">
                    {locale === "pl"
                      ? "Młody / Profesjonalny męski"
                      : locale === "ro"
                      ? "Tânăr / Profesionist masculin"
                      : "Young / Professional Male"}
                  </h4>

                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {locale === "pl"
                      ? "Ciepły, naturalny, koleżeński tembr młodego brytyjsko-polskiego doradcy prawa pracy. Spokojna kadencja bez metalicznego przesteru."
                      : locale === "ro"
                      ? "Voce caldă, naturală și prietenoasă de consilier tânăr. Fără distorsiuni metalice."
                      : "Warm, conversational, approachable tone of a 28-year-old advisor. Smooth pacing with zero harshness."}
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#38B28B]">
                  <span>Pitch: 0.98 · Tempo: 1.0x</span>
                  {selectedPreset === "young_professional" && (
                    <span className="w-5 h-5 rounded-full bg-[#38B28B] text-black flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
              </button>

              {/* Option 2: Standard AI Assistant */}
              <button
                type="button"
                onClick={() => handlePresetSelect("standard")}
                className={`relative text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPreset === "standard"
                    ? "bg-[#131B2E] border-[#D97724] shadow-[0_0_20px_rgba(255,106,0,0.25)]"
                    : "bg-[#0A1A2E]/80 border-white/10 hover:border-white/20 hover:bg-[#131B2E]/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#D97724]/15 border border-[#D97724]/40 flex items-center justify-center text-[#D97724]">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#D97724]/20 text-[#D97724] text-[10px] font-black tracking-wide uppercase border border-[#D97724]/30">
                      {locale === "pl" ? "Klasyczny AI" : locale === "ro" ? "Clasic AI" : "Classic AI"}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-white mb-1">
                    {locale === "pl"
                      ? "Standardowy asystent AI"
                      : locale === "ro"
                      ? "Asistent AI standard"
                      : "Standard AI Assistant"}
                  </h4>

                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {locale === "pl"
                      ? "Wyrazisty, klasyczny syntezator mowy o czystej dykcji i neutralnym tonie cyfrowego asystenta."
                      : locale === "ro"
                      ? "Sintetizator clasic, clar, cu dicție neutră de asistent digital."
                      : "Crisp, traditional system synthesizer voice with clear digital diction and neutral tone."}
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#D97724]">
                  <span>Pitch: 1.00 · Tempo: 1.05x</span>
                  {selectedPreset === "standard" && (
                    <span className="w-5 h-5 rounded-full bg-[#D97724] text-black flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Interactive Voice Sample Preview */}
          <div className="p-4 rounded-2xl bg-[#131B2E] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">
                  {locale === "pl"
                    ? "Przetestuj na żywo:"
                    : locale === "ro"
                    ? "Testează în direct:"
                    : "Live Audio Preview:"}
                </span>
                <span className="text-xs text-[#38B28B] font-bold">
                  {selectedPreset === "young_professional"
                    ? locale === "pl"
                      ? "Młody / Profesjonalny (~28 lat)"
                      : "Young / Professional (~28 y/o)"
                    : locale === "pl"
                    ? "Standardowy asystent AI"
                    : "Standard AI Assistant"}
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                {isPlayingSample
                  ? locale === "pl"
                    ? "Odtwarzanie próbki głosu w czasie rzeczywistym..."
                    : "Playing sample speech in real time..."
                  : locale === "pl"
                  ? "Kliknij przycisk, aby posłuchać jak Elon wypowiada odpowiedź."
                  : "Click the button to listen to how Elon delivers responses."}
              </p>
            </div>

            <button
              type="button"
              onClick={playSampleAudio}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md shrink-0 cursor-pointer ${
                isPlayingSample
                  ? "bg-[#EF4444] text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
                  : selectedPreset === "young_professional"
                  ? "bg-[#38B28B] hover:bg-[#38B28B]/90 text-black shadow-[0_0_15px_rgba(46,229,157,0.3)]"
                  : "bg-[#D97724] hover:bg-[#D97724]/90 text-black shadow-[0_0_15px_rgba(255,106,0,0.3)]"
              }`}
            >
              {isPlayingSample ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{locale === "pl" ? "Zatrzymaj" : "Stop"}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {locale === "pl"
                      ? "Odsłuchaj próbkę"
                      : locale === "ro"
                      ? "Ascultă mostră"
                      : "Listen Sample"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Section 3: Fine-Tuning Parameters */}
          <div className="p-4 rounded-2xl bg-[#0A1A2E] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#38B28B]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  {locale === "pl"
                    ? "Dostrajanie parametrów (TTS)"
                    : locale === "ro"
                    ? "Ajustare fină parametri"
                    : "TTS Fine-Tuning"}
                </h4>
              </div>

              <button
                type="button"
                onClick={handleResetToPresetDefaults}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#94A3B8] hover:text-[#38B28B] transition-colors cursor-pointer"
                title="Reset to preset defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>
                  {locale === "pl"
                    ? "Domyślne dla profilu"
                    : locale === "ro"
                    ? "Resetare profil"
                    : "Reset preset"}
                </span>
              </button>
            </div>

            {/* Speed Selector */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[#94A3B8]">
                  {locale === "pl"
                    ? "Tempo mowy (Prędkość)"
                    : locale === "ro"
                    ? "Viteză voce"
                    : "Speech Speed"}
                </span>
                <span className="font-mono font-bold text-[#38B28B] bg-black/40 px-2 py-0.5 rounded border border-white/10">
                  {speed.toFixed(2)}x
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: 0.9, label: "0.9x (Spokojne)" },
                  { val: 1.0, label: "1.0x (Naturalne)" },
                  { val: 1.15, label: "1.15x (Szybkie)" },
                  { val: 1.25, label: "1.25x (Dynamiczne)" },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => {
                      stopSampleAudio();
                      setSpeed(s.val);
                    }}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      Math.abs(speed - s.val) < 0.03
                        ? "bg-[#38B28B] text-black border-[#38B28B] shadow-sm font-black"
                        : "bg-[#131B2E] text-[#94A3B8] border-white/10 hover:text-white hover:bg-[#1A243B]"
                    }`}
                  >
                    {s.val}x
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch Fine Adjustment */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#94A3B8]">
                  {locale === "pl"
                    ? "Wysokość tonu (Pitch)"
                    : locale === "ro"
                    ? "Înălțime ton (Pitch)"
                    : "Pitch (Warmth & Resonance)"}
                </span>
                <span className="font-mono font-bold text-[#D97724] bg-black/40 px-2 py-0.5 rounded border border-white/10">
                  {pitch.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.90"
                max="1.10"
                step="0.01"
                value={pitch}
                onChange={(e) => {
                  stopSampleAudio();
                  setPitch(parseFloat(e.target.value));
                }}
                className="w-full accent-[#38B28B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono mt-1">
                <span>0.90 (Cieplejszy / Niższy)</span>
                <span>0.98 (Zalecany ~28 lat)</span>
                <span>1.10 (Wyższy)</span>
              </div>
            </div>

            {/* Auto-read response toggle */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-bold text-white">
                  {locale === "pl"
                    ? "Automatyczne czytanie odpowiedzi na głos"
                    : locale === "ro"
                    ? "Redare audio automată a răspunsurilor"
                    : "Auto-read AI responses aloud"}
                </span>
                <span className="block text-[11px] text-[#94A3B8]">
                  {locale === "pl"
                    ? "Elon od razu odczytuje swoje odpowiedzi na czacie z płynnym tempem."
                    : locale === "ro"
                    ? "Elon citește imediat mesajele pe chat."
                    : "Elon begins reading responses immediately in the active chat."}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setAutoReadAloud(!autoReadAloud)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  autoReadAloud ? "bg-[#38B28B]" : "bg-white/20"
                }`}
                aria-label="Toggle auto-read aloud"
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-[#0B0F17] transition-transform ${
                    autoReadAloud ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-[#131B2E] border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              stopSampleAudio();
              setIsVoicePreferencesModalOpen(false);
            }}
            className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            {locale === "pl" ? "Anuluj" : locale === "ro" ? "Anulează" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleSaveAndApply}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1D6852] to-[#38B28B] hover:opacity-95 text-black font-black text-xs transition-all shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {locale === "pl"
                ? "Zapisz i zastosuj"
                : locale === "ro"
                ? "Salvează și aplică"
                : "Save & Apply"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
