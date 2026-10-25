import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { ContractType } from "../types";
import {
  User,
  Building2,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  Search,
  Upload,
  AlertTriangle,
  CheckCircle,
  Shield,
  Trash2,
  Plus,
  Coins,
  Briefcase
} from "lucide-react";

export const ProfileTab: React.FC = () => {
  const {
    user,
    updateUser,
    documents,
    addDocument,
    removeDocument,
    runDocumentAudit,
    notes,
    addNote,
    removeNote,
    setIsEmployerLookupModalOpen,
    setIsPaywallModalOpen,
    t
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<"details" | "docs" | "notes">("details");

  // Form State
  const [formData, setFormData] = useState({
    fullName: user.fullName || "",
    phone: user.phone || "",
    email: user.email || "",
    homeAddress: user.homeAddress || "",
    employerName: user.employerName || "",
    companyNumber: user.companyNumber || "",
    employerAddress: user.employerAddress || "",
    jobTitle: user.jobTitle || "",
    startDate: user.startDate || "2024-03-15",
    hourlyRate: user.hourlyRate || 13.5,
    hoursPerWeek: user.hoursPerWeek || 40,
    contractType: (user.contractType || "permanent") as ContractType,
    industry: user.industry || "Warehouse / Logistics"
  });

  // New Note State
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [noteCategory, setNoteCategory] = useState("Wypłata");

  // Calculate Length of Service (Staż pracy)
  const calculateSeniority = (startDateStr: string) => {
    if (!startDateStr) return "0 mies.";
    const start = new Date(startDateStr);
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (diffMonths <= 0) return t("lessThanMonth");

    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;

    if (years === 0) return `${months} ${t("months")}`;
    if (months === 0) return `${years} ${years === 1 ? t("year") : t("years")}`;
    return `${years} ${years === 1 ? t("year") : t("years")}, ${months} ${t("months")}`;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(formData);
  };

  // Upload Payslip / Document simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addDocument({
      name: file.name,
      type: file.name.toLowerCase().includes("payslip") ? "payslip" : "contract",
      fileSize: `${Math.round(file.size / 1024)} KB`
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteDesc.trim()) return;
    addNote(noteTitle.trim(), noteDesc.trim(), noteCategory);
    setNoteTitle("");
    setNoteDesc("");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
      {/* Profile Card Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B6E4F] via-[#0A2A5C] to-[#070F1A] p-6 border border-white/15 shadow-2xl mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2EE59D] to-[#0B6E4F] border-2 border-white/30 flex items-center justify-center font-extrabold text-2xl text-black shadow-lg">
              {formData.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "EL"}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {formData.fullName || "Artur Kowalski"}
                </h1>
                {user.isPro ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#FF6A00] text-black text-[10px] font-black uppercase tracking-wider shadow-sm">
                    PRO
                  </span>
                ) : (
                  <button
                    onClick={() => setIsPaywallModalOpen(true)}
                    className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-[#FF6A00] text-white hover:text-black text-[10px] font-bold border border-white/20 transition-colors"
                  >
                    Kup PRO
                  </button>
                )}
              </div>

              <p className="text-xs text-[#2EE59D] font-semibold mt-0.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{formData.jobTitle || "Warehouse Operative"}</span>
                <span>•</span>
                <span>{formData.employerName || "Amazon UK"}</span>
              </p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#BACADA] mt-2">
                <span className="bg-black/30 px-2 py-0.5 rounded-md border border-white/10">
                  ID: <strong className="text-white">#{user.accountId}</strong>
                </span>
                <span className="bg-black/30 px-2 py-0.5 rounded-md border border-white/10">
                  {t("seniority")}: <strong className="text-white">{calculateSeniority(formData.startDate)}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <span className="text-xs text-[#BACADA]">Subskrypcja:</span>
            <button
              onClick={() => setIsPaywallModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-black text-xs font-black shadow-md transition-colors"
            >
              {user.isPro ? "Zarządzaj PRO" : "Aktywuj (£9.99/m)"}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex bg-[#0F2C4D] border border-white/10 rounded-2xl p-1 mb-6">
        <button
          onClick={() => setActiveSubTab("details")}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeSubTab === "details"
              ? "bg-[#FF6A00] text-black shadow-md"
              : "text-[#BACADA] hover:text-white"
          }`}
        >
          {t("tabData")}
        </button>
        <button
          onClick={() => setActiveSubTab("docs")}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeSubTab === "docs"
              ? "bg-[#FF6A00] text-black shadow-md"
              : "text-[#BACADA] hover:text-white"
          }`}
        >
          {t("tabDocs")} ({documents.length})
        </button>
        <button
          onClick={() => setActiveSubTab("notes")}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeSubTab === "notes"
              ? "bg-[#FF6A00] text-black shadow-md"
              : "text-[#BACADA] hover:text-white"
          }`}
        >
          {t("tabNotes")} ({notes.length})
        </button>
      </div>

      {/* Tab 1: Details & Form */}
      {activeSubTab === "details" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
            <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#2EE59D]" />
              <span>{t("personalDataSection")}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#BACADA] mb-1">
                  {t("fullName")}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#BACADA] mb-1">
                  {t("phone")}
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#BACADA] mb-1">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#BACADA] mb-1">
                  {t("homeAddress")}
                </label>
                <input
                  type="text"
                  value={formData.homeAddress}
                  onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                  placeholder="np. 42 Victoria Road, Dartford DA1 5DJ"
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                />
              </div>
            </div>
          </div>

          {/* Employer & Agency Details */}
          <div className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#FF6A00]" />
                <span>{t("employerSection")}</span>
              </h2>

              <button
                type="button"
                onClick={() => setIsEmployerLookupModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12304F] hover:bg-[#153a5e] border border-white/15 text-xs font-bold text-[#2EE59D] transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t("employerLookupBtn")}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#BACADA] mb-1">
                  {t("employerName")}
                </label>
                <input
                  type="text"
                  value={formData.employerName}
                  onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#BACADA] mb-1">
                  {t("companyNumber")}
                </label>
                <input
                  type="text"
                  value={formData.companyNumber}
                  onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
                  placeholder="np. 03223028"
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#BACADA] mb-1">
                  {t("employerAddress")}
                </label>
                <input
                  type="text"
                  value={formData.employerAddress}
                  onChange={(e) => setFormData({ ...formData, employerAddress: e.target.value })}
                  placeholder="np. London Distribution Park, Windrush Drive, Tilbury RM18 7AN"
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                />
              </div>
            </div>
          </div>

          {/* Terms & Conditions of Employment */}
          <div className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
            <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#2EE59D]" />
              <span>{t("termsSection")}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#BACADA] mb-1">
                  {t("jobTitle")}
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#BACADA] mb-1">
                  {t("startDate")}
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#BACADA] mb-1">
                  {t("hourlyRate")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#BACADA] mb-1">
                  {t("contractType")}
                </label>
                <select
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ContractType })}
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                >
                  <option value="permanent">{t("ctPermanent")}</option>
                  <option value="zero_hours">{t("ctZeroHours")}</option>
                  <option value="agency">{t("ctAgency")}</option>
                  <option value="fixed_term">{t("ctFixedTerm")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-extrabold text-sm shadow-xl hover:opacity-95 transition-all"
          >
            {t("saveProfile")}
          </button>
        </form>
      )}

      {/* Tab 2: Documents & Payslip AI Audit */}
      {activeSubTab === "docs" && (
        <div className="space-y-5">
          {/* Upload card */}
          <div className="bg-[#0F2C4D] border border-dashed border-[#2EE59D]/40 rounded-2xl p-6 text-center shadow-xl">
            <Upload className="w-10 h-10 text-[#2EE59D] mx-auto mb-2 opacity-90" />
            <h3 className="text-base font-bold text-white mb-1">
              {t("uploadDoc")}
            </h3>
            <p className="text-xs text-[#BACADA] max-w-sm mx-auto mb-4">
              Wgraj swój payslip (PDF lub zdjęcie), aby Elon sprawdził czy stawka jest zgodna z prawem pracy UK.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 text-white font-bold text-xs cursor-pointer shadow-md transition-colors">
              <Upload className="w-4 h-4" />
              <span>Wybierz plik z dysku</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Documents list */}
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#12304F] border border-white/15 flex items-center justify-center text-[#FF6A00]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{doc.name}</h4>
                      <p className="text-[11px] text-[#BACADA]">
                        {doc.uploadDate} • {doc.fileSize} • {doc.type.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runDocumentAudit(doc.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black text-xs font-black shadow-md hover:opacity-95 transition-opacity"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t("auditPayslip")}</span>
                    </button>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-[#EF4444] transition-colors"
                      title="Usuń"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Audit breakdown */}
                {doc.auditResult && (
                  <div className="bg-[#12304F] border border-white/10 rounded-xl p-4 mt-2 space-y-2.5">
                    <div className="flex items-center gap-2">
                      {doc.auditResult.valid ? (
                        <CheckCircle className="w-4 h-4 text-[#10B981]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-[#FF6A00]" />
                      )}
                      <span className="text-xs font-bold text-white">
                        {doc.auditResult.summary}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {doc.auditResult.items.map((item, idx) => (
                        <div key={idx} className="text-xs p-2.5 rounded-lg bg-[#070F1A]/70 border border-white/5">
                          <p className="font-bold text-[#FF6A00] mb-0.5">{item.issue}</p>
                          <p className="text-[#BACADA] leading-relaxed">{item.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Notes & Dispute Timeline */}
      {activeSubTab === "notes" && (
        <div className="space-y-6">
          {/* Add note card */}
          <div className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
            <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#FF6A00]" />
              <span>Dodaj notatkę do osobistej osi czasu</span>
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Tytuł incydentu (np. Rozmowa z kierownikiem ws. nadgodzin)"
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                />
              </div>

              <div>
                <textarea
                  rows={3}
                  value={noteDesc}
                  onChange={(e) => setNoteDesc(e.target.value)}
                  placeholder="Opisz dokładnie co zaszło, kto był świadkiem, jakie słowa padły..."
                  className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D] resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="bg-[#12304F] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value="Wypłata">Wypłata i potrącenia</option>
                  <option value="Dyscyplina">Kwestie dyscyplinarne</option>
                  <option value="BHP / Zdrowie">BHP i zdrowie</option>
                  <option value="Mobbing">Nierówne traktowanie</option>
                  <option value="Inne">Inne</option>
                </select>

                <button
                  type="submit"
                  disabled={!noteTitle.trim() || !noteDesc.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 text-white font-bold text-xs disabled:opacity-40 transition-colors shadow-md"
                >
                  Zapisz notatkę
                </button>
              </div>
            </form>
          </div>

          {/* Notes list */}
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-md space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF6A00]/20 text-[#FF6A00] border border-[#FF6A00]/30">
                      {note.category}
                    </span>
                    <span className="text-xs text-[#BACADA]">{note.date}</span>
                  </div>

                  <button
                    onClick={() => removeNote(note.id)}
                    className="p-1 rounded text-[#BACADA] hover:text-[#EF4444] transition-colors"
                    title="Usuń"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white">{note.title}</h4>
                <p className="text-xs text-[#F4F8FB] leading-relaxed whitespace-pre-wrap">
                  {note.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
