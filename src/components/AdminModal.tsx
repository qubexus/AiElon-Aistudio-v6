import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  X,
  Shield,
  Users,
  FolderKanban,
  FileText,
  Sparkles,
  Tag,
  Send,
  Plus
} from "lucide-react";

export const AdminModal: React.FC = () => {
  const {
    isAdminModalOpen,
    setIsAdminModalOpen,
    cases,
    sentLetters,
    documents,
    showToast,
    t
  } = useApp();

  const [promoCodes, setPromoCodes] = useState([
    { code: "ELON3M", discount: "3 miesiące PRO za darmo", used: 124 },
    { code: "SOLIDARITY", discount: "Roczny dostęp -50%", used: 86 },
    { code: "UNITE", discount: "Dla członków związków", used: 219 }
  ]);

  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("");

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastText, setBroadcastText] = useState("");

  if (!isAdminModalOpen) return null;

  const handleAddCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setPromoCodes([
      ...promoCodes,
      { code: newCode.trim().toUpperCase(), discount: newDiscount.trim() || "Dostęp PRO", used: 0 }
    ]);
    setNewCode("");
    setNewDiscount("");
    showToast("Dodano nowy kod promocyjny!");
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastText.trim()) return;
    showToast("Wysłano ogłoszenie do wszystkich pracowników!");
    setBroadcastTitle("");
    setBroadcastText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0F2C4D] border border-white/15 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6A00] flex items-center justify-center text-black">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {t("adminTitle")}
              </h2>
              <p className="text-[11px] text-[#BACADA]">
                Statystyki platformy, zarządzanie kodami i komunikacja
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAdminModalOpen(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#12304F] border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-[#BACADA] mb-1">
                <Users className="w-3.5 h-3.5 text-[#2EE59D]" />
                <span>Pracownicy</span>
              </div>
              <div className="text-xl font-black text-white">1,482</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#12304F] border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-[#BACADA] mb-1">
                <FolderKanban className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Sprawy</span>
              </div>
              <div className="text-xl font-black text-white">{342 + cases.length}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#12304F] border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-[#BACADA] mb-1">
                <FileText className="w-3.5 h-3.5 text-[#2EE59D]" />
                <span>Pisma</span>
              </div>
              <div className="text-xl font-black text-white">{890 + sentLetters.length}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#12304F] border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-[#BACADA] mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Audyty</span>
              </div>
              <div className="text-xl font-black text-white">{615 + documents.length}</div>
            </div>
          </div>

          {/* Promo Codes Manager */}
          <div className="bg-[#12304F] border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#FF6A00]" />
              <span>Kody promocyjne i zniżki związkowe</span>
            </h3>

            <div className="space-y-2 mb-4">
              {promoCodes.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#070F1A]/70 border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#2EE59D] px-2 py-0.5 rounded bg-[#0B6E4F]/20">
                      {p.code}
                    </span>
                    <span className="text-white">{p.discount}</span>
                  </div>
                  <span className="text-[11px] text-[#BACADA]">{p.used} aktywacji</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCode} className="flex gap-2">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Nowy KOD"
                className="w-1/3 bg-[#070F1A] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white uppercase focus:outline-none"
              />
              <input
                type="text"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                placeholder="Opis promocji"
                className="flex-1 bg-[#070F1A] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newCode.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 text-white font-bold text-xs disabled:opacity-40 transition-colors"
              >
                Dodaj
              </button>
            </form>
          </div>

          {/* Broadcast Announcement */}
          <div className="bg-[#12304F] border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-[#2EE59D]" />
              <span>Wyślij powiadomienie do użytkowników</span>
            </h3>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Tytuł komunikatu (np. Aktualizacja stawek NLW)"
                className="w-full bg-[#070F1A] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <textarea
                rows={3}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Treść ogłoszenia prawnego lub organizacyjnego..."
                className="w-full bg-[#070F1A] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none resize-none"
              />
              <button
                type="submit"
                disabled={!broadcastTitle.trim() || !broadcastText.trim()}
                className="w-full py-2.5 rounded-xl bg-[#FF6A00] text-black font-extrabold text-xs disabled:opacity-40 shadow-md"
              >
                Opublikuj powiadomienie
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
