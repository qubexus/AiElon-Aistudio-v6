import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { X, MessageSquarePlus, Compass, CheckSquare, Award } from "lucide-react";

export const NewPostModal: React.FC = () => {
  const { isNewPostModalOpen, setIsNewPostModalOpen, addForumPost, t } = useApp();

  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Prawo Pracy UK w Praktyce");
  const [content, setContent] = useState("");
  const [whereToGo, setWhereToGo] = useState("");
  const [whatToSelectRaw, setWhatToSelectRaw] = useState("");
  const [whatYouGet, setWhatYouGet] = useState("");
  const [statuteBadge, setStatuteBadge] = useState("");

  if (!isNewPostModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const parsedSteps = whatToSelectRaw
      .split("\n")
      .map((line) => line.replace(/^\d+[\).\s-]*/, "").trim())
      .filter(Boolean);

    addForumPost(title.trim(), content.trim(), tag, {
      whereToGo: whereToGo.trim() || undefined,
      whatToSelect: parsedSteps.length > 0 ? parsedSteps : undefined,
      whatYouGet: whatYouGet.trim() || undefined,
      statuteOrFeatureBadge: statuteBadge.trim() || undefined,
    });
    setTitle("");
    setContent("");
    setWhereToGo("");
    setWhatToSelectRaw("");
    setWhatYouGet("");
    setStatuteBadge("");
    setIsNewPostModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#131B2E] border border-white/15 rounded-3xl w-full max-w-lg max-h-[90dvh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#38B28B] flex items-center justify-center text-black">
              <MessageSquarePlus className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-extrabold text-white">
              {t("newPost")}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsNewPostModalOpen(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {t("postTitleLabel")}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Jak wygenerować odwołanie od dyscyplinarki i zapisać je w sprawie?"
              className="w-full bg-[#1A243B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38B28B]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                {t("postTagLabel")}
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full bg-[#1A243B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38B28B]"
              >
                <option value="Czat AI i Głos">Czat AI i Głos</option>
                <option value="Pisma i Generator PDF">Pisma i Generator PDF</option>
                <option value="Sprawy i Przypięte Dowody">Sprawy i Przypięte Dowody</option>
                <option value="Audyt Payslipu i Dokumenty">Audyt Payslipu i Dokumenty</option>
                <option value="Notatki, Karta PRO i Offline">Notatki, Karta PRO i Offline</option>
                <option value="Prawo Pracy UK w Praktyce">Prawo Pracy UK w Praktyce</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Podstawa prawna / Moduł (opcjonalnie)
              </label>
              <input
                type="text"
                value={statuteBadge}
                onChange={(e) => setStatuteBadge(e.target.value)}
                placeholder="np. Section 13 ERA 1996"
                className="w-full bg-[#1A243B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38B28B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {t("postContentLabel")}
            </label>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Opisz krótko zagadnienie, pytanie lub wskazówkę dla użytkowników ask Elon..."
              className="w-full bg-[#1A243B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38B28B] resize-none"
            />
          </div>

          {/* Optional Systematic Capability Steps */}
          <div className="rounded-2xl bg-[#0B0F17]/70 border border-white/10 p-3.5 space-y-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#D97724]">
              Instrukcja krok po kroku (opcjonalnie):
            </p>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#38BDF8] mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span>1. Gdzie trzeba wejść?</span>
              </label>
              <input
                type="text"
                value={whereToGo}
                onChange={(e) => setWhereToGo(e.target.value)}
                placeholder="np. Nawigacja dolna → Zakładka: Pisma → Kategoria: Zwolnienia"
                className="w-full bg-[#1A243B] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#38B28B]"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#D97724] mb-1">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>2. Co zaznaczyć / kliknąć? (każdy krok w nowej linii)</span>
              </label>
              <textarea
                rows={3}
                value={whatToSelectRaw}
                onChange={(e) => setWhatToSelectRaw(e.target.value)}
                placeholder={"1) Zaznacz wzór odwołania od zwolnienia\n2) Wpisz datę spotkania dyscyplinarnego\n3) Kliknij Pobierz PDF"}
                className="w-full bg-[#1A243B] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#38B28B] resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#38B28B] mb-1">
                <Award className="w-3.5 h-3.5" />
                <span>3. Co uzyskasz?</span>
              </label>
              <input
                type="text"
                value={whatYouGet}
                onChange={(e) => setWhatYouGet(e.target.value)}
                placeholder="np. Gotowe odwołanie po angielsku zgodne z ACAS Code of Practice"
                className="w-full bg-[#1A243B] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#38B28B]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewPostModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white cursor-pointer"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1D6852] to-[#38B28B] text-black font-extrabold text-xs shadow-md hover:opacity-95 transition-opacity cursor-pointer"
            >
              {t("publishPost")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
