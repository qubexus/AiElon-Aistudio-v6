import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { X, FolderPlus } from "lucide-react";

export const NewCaseModal: React.FC = () => {
  const { isNewCaseModalOpen, setIsNewCaseModalOpen, addCase, user, t } = useApp();

  const [title, setTitle] = useState("");
  const [sector, setSector] = useState(user.industry || "Logistyka / Magazyn");
  const [employer, setEmployer] = useState(user.employerName || "Amazon UK");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState("");

  if (!isNewCaseModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    addCase({
      title: title.trim(),
      sector,
      employer,
      priority,
      description: description.trim(),
      status: "open"
    });

    setIsNewCaseModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0F2C4D] border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6A00] flex items-center justify-center text-black">
              <FolderPlus className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-extrabold text-white">
              {t("newCase")}
            </h2>
          </div>

          <button
            onClick={() => setIsNewCaseModalOpen(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {t("caseTitleLabel")}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Bezprawne potrącenie z wypłaty za wrzesień"
              className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                {t("caseSectorLabel")}
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
              >
                <option value="Logistyka / Magazyn">Logistyka / Magazyn</option>
                <option value="Opieka / NHS">Opieka / NHS</option>
                <option value="Budownictwo">Budownictwo</option>
                <option value="Gastronomia">Gastronomia</option>
                <option value="Agencja pracy">Agencja pracy</option>
                <option value="Handel i Usługi">Handel i Usługi</option>
                <option value="Inne">Inne</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">
                {t("casePriorityLabel")}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
              >
                <option value="low">{t("priorityLow")}</option>
                <option value="medium">{t("priorityMedium")}</option>
                <option value="high">{t("priorityHigh")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {t("caseEmployerLabel")}
            </label>
            <input
              type="text"
              required
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              placeholder="np. Amazon Fulfilment LCY2"
              className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {t("caseDescLabel")}
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opisz dokładnie sytuację, kwoty, daty oraz co powiedział pracodawca..."
              className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewCaseModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#BACADA] hover:text-white"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-extrabold text-xs shadow-md hover:opacity-95 transition-opacity"
            >
              {t("createCaseBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
