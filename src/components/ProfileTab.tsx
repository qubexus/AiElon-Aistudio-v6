import React, { useState, useEffect, useMemo, useRef } from "react";
import { useApp } from "../context/AppContext";
import {
  User,
  FileCheck,
  StickyNote,
  Crown,
  Search,
  Upload,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Building2,
  Calendar,
  Volume2,
  Sun,
  Moon,
  Sliders,
  ShieldCheck,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Camera,
  ScanLine,
  Tag,
  FileText,
  X,
  Eye,
  RefreshCw,
  Filter,
} from "lucide-react";
import { ContractType, DocumentCategoryTag } from "../types";
import {
  ALL_DOCUMENT_CATEGORY_TAGS,
  DOCUMENT_TAG_STYLES,
  analyzeUploadedDocument,
  getDefaultCategoryTagForType,
} from "../utils/documentClassifier";
import { CameraScannerModal } from "./CameraScannerModal";

export const ProfileTab: React.FC = () => {
  const {
    user,
    updateUser,
    profileSubTab,
    setProfileSubTab,
    themeMode,
    setThemeMode,
    toggleThemeMode,
    documents,
    addDocument,
    updateDocumentCategoryTag,
    removeDocument,
    runDocumentAudit,
    notes,
    addNote,
    removeNote,
    setIsEmployerLookupModalOpen,
    setIsPaywallModalOpen,
    setIsVoicePreferencesModalOpen,
    voiceConfig,
    showToast,
    locale,
    t,
  } = useApp();

  // Form states for user details
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [homeAddress, setHomeAddress] = useState(user.homeAddress || "");
  const [employerName, setEmployerName] = useState(user.employerName);
  const [companyNumber, setCompanyNumber] = useState(user.companyNumber);
  const [employerAddress, setEmployerAddress] = useState(user.employerAddress);
  const [jobTitle, setJobTitle] = useState(user.jobTitle);
  const [startDate, setStartDate] = useState(user.startDate);
  const [hourlyRate, setHourlyRate] = useState(user.hourlyRate.toString());
  const [hoursPerWeek, setHoursPerWeek] = useState(user.hoursPerWeek.toString());
  const [contractType, setContractType] = useState(user.contractType);

  // Sync when employer lookup updates user
  useEffect(() => {
    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phone || "");
    setHomeAddress(user.homeAddress || "");
    setEmployerName(user.employerName);
    setCompanyNumber(user.companyNumber);
    setEmployerAddress(user.employerAddress);
    setJobTitle(user.jobTitle);
    setStartDate(user.startDate);
    setHourlyRate(user.hourlyRate.toString());
    setHoursPerWeek(user.hoursPerWeek.toString());
    setContractType(user.contractType);
  }, [user]);

  // Note creation states
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [noteCategory, setNoteCategory] = useState("Godziny i Grafik");

  // Profile completeness calculation
  const completeness = useMemo(() => {
    const checks = [
      Boolean(user.fullName?.trim()),
      Boolean(user.email?.trim()),
      Boolean(user.phone?.trim()),
      Boolean(user.homeAddress?.trim()),
      Boolean(user.employerName?.trim()),
      Boolean(user.employerAddress?.trim()),
      Boolean(user.jobTitle?.trim()),
      Boolean(user.hourlyRate && user.hourlyRate > 0),
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [user]);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      fullName,
      email,
      phone,
      homeAddress,
      employerName,
      companyNumber,
      employerAddress,
      jobTitle,
      startDate,
      hourlyRate: parseFloat(hourlyRate) || 12.21,
      hoursPerWeek: parseFloat(hoursPerWeek) || 40,
      contractType,
    });
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isAnalyzingUpload, setIsAnalyzingUpload] = useState(false);
  const [analyzingFileName, setAnalyzingFileName] = useState<string>("");
  const [isDragOverDocs, setIsDragOverDocs] = useState(false);
  const [selectedDocTagFilter, setSelectedDocTagFilter] = useState<"ALL" | DocumentCategoryTag>("ALL");
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [previewImageDoc, setPreviewImageDoc] = useState<{ name: string; url: string } | null>(null);

  const processUploadedFileOrBlob = async (
    fileOrBlob: File | Blob,
    sourceMethod: "camera" | "system_upload",
    explicitFileName?: string
  ) => {
    const labelName =
      explicitFileName ||
      (fileOrBlob instanceof File && fileOrBlob.name) ||
      "Camera_Document.jpg";
    setIsAnalyzingUpload(true);
    setAnalyzingFileName(labelName);
    setUploadNotice(null);

    try {
      const result = await analyzeUploadedDocument(fileOrBlob, {
        fileName: labelName,
        sourceMethod,
        locale,
      });

      addDocument({
        name: result.fileName,
        type: result.detectionMeta.mappedType,
        categoryTag: result.detectionMeta.categoryTag,
        uploadSource: sourceMethod === "camera" ? "camera" : "system",
        mimeType: result.mimeType,
        previewDataUrl: result.previewDataUrl,
        detectionMeta: result.detectionMeta,
        fileSize: result.fileSize,
      });

      if (result.serverNotice && result.detectionMeta.analysisMethod === "content_heuristic") {
        setUploadNotice(
          locale === "pl"
            ? `Sklasyfikowano lokalnie na podstawie analizy treści i nagłówków pliku (${result.detectionMeta.categoryTag}). Analiza AI niedostępna: ${result.serverNotice}`
            : locale === "ro"
            ? `Clasificat local prin analiza conținutului (${result.detectionMeta.categoryTag}). AI indisponibil: ${result.serverNotice}`
            : `Classified locally via file content & byte inspection (${result.detectionMeta.categoryTag}). AI vision unavailable: ${result.serverNotice}`
        );
      }
    } catch {
      showToast(
        locale === "pl"
          ? "Nie udało się odczytać pliku do analizy."
          : locale === "ro"
          ? "Nu s-a putut citi fișierul."
          : "Could not read file for analysis."
      );
    } finally {
      setIsAnalyzingUpload(false);
      setAnalyzingFileName("");
    }
  };

  const handleSystemFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    for (const file of files) {
      await processUploadedFileOrBlob(file, "system_upload", file.name);
    }
  };

  const handleDocsDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverDocs(false);
    const files = Array.from(e.dataTransfer.files || []);
    for (const file of files) {
      await processUploadedFileOrBlob(file, "system_upload", file.name);
    }
  };

  const docTagCounts = useMemo(() => {
    const counts: Partial<Record<DocumentCategoryTag, number>> = {};
    for (const d of documents) {
      const resolved = d.categoryTag || getDefaultCategoryTagForType(d.type, d.mimeType);
      counts[resolved] = (counts[resolved] || 0) + 1;
    }
    return counts;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    if (selectedDocTagFilter === "ALL") return documents;
    return documents.filter((d) => {
      const resolved = d.categoryTag || getDefaultCategoryTagForType(d.type, d.mimeType);
      return resolved === selectedDocTagFilter;
    });
  }, [documents, selectedDocTagFilter]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteDesc.trim()) return;
    addNote(noteTitle.trim(), noteDesc.trim(), noteCategory);
    setNoteTitle("");
    setNoteDesc("");
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Top User Dossier Header Card */}
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1D6852]/15 border border-[#38B28B]/30 flex items-center justify-center text-[#1D6852] dark:text-[#38B28B] font-bold text-xl shrink-0">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-[#F1F5F9]">
                  {user.fullName}
                </h2>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border ${
                    user.isPro
                      ? "bg-[#1D6852]/15 text-[#1D6852] dark:text-[#38B28B] border-[#38B28B]/30"
                      : "bg-slate-100 dark:bg-[#1A243B] text-slate-600 dark:text-[#94A3B8] border-slate-300 dark:border-white/10"
                  }`}
                >
                  {user.isPro ? t("proStatusActive") : t("proStatusFree")}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                {user.jobTitle} · {user.employerName}
              </p>

              {/* Profile Completeness Meter */}
              <div className="mt-2.5 flex items-center gap-2.5">
                <div className="w-36 sm:w-44 h-1.5 rounded-full bg-slate-200 dark:bg-[#0B0F17] overflow-hidden">
                  <div
                    className="h-full bg-[#38B28B] rounded-full transition-all duration-300"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-[#94A3B8] tabular-nums">
                  {locale === "pl"
                    ? `Kompletność akt: ${completeness}%`
                    : locale === "ro"
                    ? `Profil complet: ${completeness}%`
                    : `Dossier completeness: ${completeness}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Right Quick Actions: Theme Switcher + Voice + PRO */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Accessible Theme Switcher in Profile Header */}
            <button
              onClick={toggleThemeMode}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1A243B] hover:bg-slate-200/80 dark:hover:bg-[#1E2942] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-[#F1F5F9] text-xs font-semibold transition-all whitespace-nowrap shrink-0"
              title={
                themeMode === "dark"
                  ? "Przełącz na jasny motyw o wysokim kontraście"
                  : "Przełącz na ciemny motyw Chancery Slate"
              }
            >
              {themeMode === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-[#D97724]" />
                  <span>
                    {locale === "pl"
                      ? "Tryb Dzienny (Jasny)"
                      : locale === "ro"
                      ? "Mod Zi (Luminos)"
                      : "Daylight Mode (Light)"}
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#1D6852]" />
                  <span>
                    {locale === "pl"
                      ? "Tryb Nocny (Ciemny)"
                      : locale === "ro"
                      ? "Mod Noapte (Întunecat)"
                      : "Chancery Dark Mode"}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsVoicePreferencesModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1A243B] hover:bg-slate-200/80 dark:hover:bg-[#1E2942] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-[#F1F5F9] text-xs font-semibold transition-all whitespace-nowrap shrink-0"
            >
              <Volume2 className="w-4 h-4 text-[#38B28B]" />
              <span>
                {locale === "pl"
                  ? "Głos Elona"
                  : locale === "ro"
                  ? "Vocea lui Elon"
                  : "Elon Voice"}
              </span>
            </button>

            {!user.isPro && (
              <button
                onClick={() => setIsPaywallModalOpen(true)}
                className="flex items-center gap-2 bg-[#D97724] hover:bg-[#C2651A] text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap shrink-0"
              >
                <Crown className="w-4 h-4" />
                {t("upgradePro")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Segregated Sub-Navigation Tabs (4 Logical Sections) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-200/70 dark:bg-[#131B2E] p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10">
        <button
          onClick={() => setProfileSubTab("details")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            profileSubTab === "details"
              ? "bg-[#1D6852] text-white shadow-xs"
              : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>{t("tabDetails")}</span>
        </button>

        <button
          onClick={() => setProfileSubTab("docs")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            profileSubTab === "docs"
              ? "bg-[#1D6852] text-white shadow-xs"
              : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileCheck className="w-4 h-4 shrink-0" />
          <span>{t("tabDocs")}</span>
          <span className="px-1.5 py-0.2 rounded bg-black/15 text-[10px] tabular-nums">
            {documents.length}
          </span>
        </button>

        <button
          onClick={() => setProfileSubTab("notes")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            profileSubTab === "notes"
              ? "bg-[#1D6852] text-white shadow-xs"
              : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <StickyNote className="w-4 h-4 shrink-0" />
          <span>{t("tabNotes")}</span>
          <span className="px-1.5 py-0.2 rounded bg-black/15 text-[10px] tabular-nums">
            {notes.length}
          </span>
        </button>

        <button
          onClick={() => setProfileSubTab("settings")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            profileSubTab === "settings"
              ? "bg-[#1D6852] text-white shadow-xs"
              : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span>
            {locale === "pl"
              ? "Wygląd i Ustawienia"
              : locale === "ro"
              ? "Temă & Setări"
              : "Theme & Settings"}
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: DETAILS & EMPLOYMENT CONTRACT */}
      {profileSubTab === "details" && (
        <form onSubmit={handleSaveDetails} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Section A: Personal & Correspondence Data */}
            <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="w-8 h-8 rounded-lg bg-[#1D6852]/15 border border-[#38B28B]/30 flex items-center justify-center text-[#1D6852] dark:text-[#38B28B]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                    {locale === "pl"
                      ? "1. Dane osobowe i korespondencyjne"
                      : locale === "ro"
                      ? "1. Date personale și de corespondență"
                      : "1. Personal & Correspondence Details"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                    {locale === "pl"
                      ? "Używane automatycznie w nagłówkach pism prawnych UK"
                      : "Automatically inserted into formal UK legal correspondence"}
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5">
                    {t("fullNameLabel")}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#38B28B]" />
                      {t("emailLabel")}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#38B28B]" />
                      {locale === "pl" ? "Telefon brytyjski (UK)" : "UK Phone Number"}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+44 7700 900412"
                      className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#38B28B]" />
                    {locale === "pl"
                      ? "Adres zamieszkania w UK (z kodem pocztowym)"
                      : "UK Home Address (with Postcode)"}
                  </label>
                  <input
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    placeholder="np. 24 Highfield Road, Dartford, DA1 2JS"
                    className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                  />
                </div>
              </div>
            </div>

            {/* Section B: UK Employer & Contract Terms */}
            <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#D97724]/15 border border-[#D97724]/30 flex items-center justify-center text-[#D97724]">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                      {locale === "pl"
                        ? "2. Pracodawca i warunki zatrudnienia"
                        : locale === "ro"
                        ? "2. Angajator și contract de muncă"
                        : "2. UK Employer & Contract Terms"}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                      {locale === "pl"
                        ? "Dane z rejestru Companies House oraz stawki"
                        : "Companies House registry & statutory pay parameters"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEmployerLookupModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1D6852] dark:text-[#38B28B] bg-[#1D6852]/15 hover:bg-[#1D6852]/25 px-2.5 py-1.5 rounded-lg border border-[#38B28B]/30 transition-colors whitespace-nowrap shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  {t("lookupEmployerBtn")}
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5">
                      {t("employerNameLabel")}
                    </label>
                    <input
                      type="text"
                      value={employerName}
                      onChange={(e) => setEmployerName(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5">
                      {t("companyNumLabel")}
                    </label>
                    <input
                      type="text"
                      value={companyNumber}
                      onChange={(e) => setCompanyNumber(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5">
                    {t("employerAddrLabel")}
                  </label>
                  <input
                    type="text"
                    value={employerAddress}
                    onChange={(e) => setEmployerAddress(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5">
                      {t("jobTitleLabel")}
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5">
                      {t("hourlyRateLabel")}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm tabular-nums text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5">
                      {t("hoursWeekLabel")}
                    </label>
                    <input
                      type="number"
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm tabular-nums text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5">
                      {t("startDateLabel")}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5">
                      {t("contractTypeLabel")}
                    </label>
                    <select
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value as ContractType)}
                      className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                    >
                      <option value="permanent">Full-time / Permanent</option>
                      <option value="zero_hours">Zero-hours Contract</option>
                      <option value="agency">Agency Worker</option>
                      <option value="fixed_term">Fixed-term Contract</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto bg-[#1D6852] hover:bg-[#258066] text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-xs"
            >
              {t("saveProfileBtn")}
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: DOCUMENTS & AI CONTENT AUTO-CLASSIFICATION */}
      {profileSubTab === "docs" && (
        <div className="space-y-4">
          {/* Upload & Camera Detection Dropzone Card */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOverDocs(true);
            }}
            onDragLeave={() => setIsDragOverDocs(false)}
            onDrop={handleDocsDrop}
            className={`bg-white dark:bg-[#131B2E] border-2 rounded-2xl p-5 transition-all space-y-4 ${
              isDragOverDocs
                ? "border-[#38B28B] bg-[#1D6852]/10 shadow-[0_0_24px_rgba(56,178,139,0.2)]"
                : "border-slate-200/80 dark:border-white/10"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900 dark:text-[#F1F5F9] flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-[#D97724]" />
                  {t("docsHeading")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-2xl leading-relaxed">
                  {locale === "pl"
                    ? "Wgraj plik z urządzenia (PDF, skan, zdjęcie, DOCX, TXT) lub zeskanuj aparatem — system przeanalizuje treść dokumentu i automatycznie przypisze kategorię (np. PDF Paystub, Employment Contract, Letter to HR)."
                    : locale === "ro"
                    ? "Încarcă un fișier (PDF, imagine, DOCX, TXT) sau scanează cu camera — conținutul va fi analizat și etichetat automat (ex: PDF Paystub, Employment Contract, Letter to HR)."
                    : "Upload from your device (PDF, image, DOCX, TXT) or scan with your camera — content analysis automatically detects the document type and assigns category tags (e.g. PDF Paystub, Employment Contract, Letter to HR)."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*,.txt,.md,.doc,.docx,.csv,.rtf,.eml"
                  multiple
                  onChange={handleSystemFileSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={isAnalyzingUpload}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-[#1D6852] hover:bg-[#258066] disabled:opacity-50 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>
                    {locale === "pl"
                      ? "Wgraj plik z systemu"
                      : locale === "ro"
                      ? "Încarcă din sistem"
                      : "Upload System File"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isAnalyzingUpload}
                  onClick={() => setIsCameraModalOpen(true)}
                  className="flex items-center gap-1.5 bg-[#D97724] hover:bg-[#c56a1c] disabled:opacity-50 text-black text-xs font-extrabold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>
                    {locale === "pl"
                      ? "Skanuj aparatem"
                      : locale === "ro"
                      ? "Scanează cu camera"
                      : "Scan via Camera"}
                  </span>
                </button>
              </div>
            </div>

            {/* Drag-and-Drop Hint Strip */}
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#0B0F17]/60 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#38B28B] shrink-0" />
                <span>
                  {locale === "pl"
                    ? "Przeciągnij i upuść pliki tutaj · Obsługiwane: PDF, JPG, PNG, WEBP, DOCX, TXT, CSV"
                    : locale === "ro"
                    ? "Trage și plasează fișierele aici · Formate: PDF, JPG, PNG, WEBP, DOCX, TXT"
                    : "Drag & drop files here · Supported: PDF, JPG, PNG, WEBP, DOCX, TXT, CSV"}
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#38B28B] font-semibold">
                {locale === "pl" ? "Auto-detekcja treści aktywna" : "Content Auto-Tagging Active"}
              </span>
            </div>

            {/* Live Scanning Progress Banner */}
            {isAnalyzingUpload && (
              <div className="rounded-xl bg-[#1D6852]/15 border border-[#38B28B]/40 p-3 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-[#38B28B] animate-spin shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {locale === "pl"
                      ? `Analiza treści i wykrywanie typu: ${analyzingFileName}`
                      : locale === "ro"
                      ? `Se analizează conținutul: ${analyzingFileName}`
                      : `Analyzing content & detecting file type: ${analyzingFileName}`}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-[#94A3B8]">
                    {locale === "pl"
                      ? "Sprawdzanie sygnatur binarnych, słów kluczowych UK oraz struktury dokumentu..."
                      : "Inspecting binary headers, text structure, and UK employment keywords..."}
                  </div>
                </div>
              </div>
            )}

            {/* Optional Notice when Fallback Content Heuristic was used */}
            {uploadNotice && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/35 p-3 flex items-start justify-between gap-2 text-xs text-amber-800 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97724]" />
                  <span>{uploadNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadNotice(null)}
                  className="p-0.5 hover:opacity-75 shrink-0 cursor-pointer"
                  aria-label="Dismiss notice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Category Tag Filter Bar */}
          {documents.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap px-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mr-1">
                <Filter className="w-3 h-3 text-[#38B28B]" />
                {locale === "pl" ? "Kategorie:" : locale === "ro" ? "Categorii:" : "Categories:"}
              </span>

              <button
                type="button"
                onClick={() => setSelectedDocTagFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  selectedDocTagFilter === "ALL"
                    ? "bg-[#1D6852] text-white border-[#38B28B]"
                    : "bg-white dark:bg-[#131B2E] text-slate-600 dark:text-[#94A3B8] border-slate-200 dark:border-white/10 hover:border-[#38B28B]/40"
                }`}
              >
                {locale === "pl" ? "Wszystkie" : locale === "ro" ? "Toate" : "All"} ({documents.length})
              </button>

              {ALL_DOCUMENT_CATEGORY_TAGS.filter((tag) => (docTagCounts[tag] || 0) > 0).map((tag) => {
                const isSelected = selectedDocTagFilter === tag;
                const style = DOCUMENT_TAG_STYLES[tag];
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedDocTagFilter((prev) => (prev === tag ? "ALL" : tag))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#1D6852] text-white border-[#38B28B]"
                        : "bg-white dark:bg-[#131B2E] text-slate-700 dark:text-[#CBD5E1] border-slate-200 dark:border-white/10 hover:border-[#38B28B]/40"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${style.dotClass}`} />
                    <span>{tag}</span>
                    <span className="font-mono text-[10px] opacity-80">({docTagCounts[tag]})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Documents List */}
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-8 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-[#F1F5F9]">
                  {selectedDocTagFilter === "ALL"
                    ? t("noDocs")
                    : locale === "pl"
                    ? `Brak dokumentów w kategorii „${selectedDocTagFilter}”`
                    : `No documents tagged "${selectedDocTagFilter}"`}
                </p>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-md mx-auto">
                  {t("noDocsSub")}
                </p>
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const resolvedTag: DocumentCategoryTag =
                  doc.categoryTag || getDefaultCategoryTagForType(doc.type, doc.mimeType);
                const tagStyle =
                  DOCUMENT_TAG_STYLES[resolvedTag] || DOCUMENT_TAG_STYLES["Workplace Document"];
                const meta = doc.detectionMeta;

                return (
                  <div
                    key={doc.id}
                    className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Document Icon or Camera/Image Thumbnail */}
                        {doc.previewDataUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImageDoc({ name: doc.name, url: doc.previewDataUrl! })
                            }
                            className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#38B28B]/40 shrink-0 group cursor-pointer"
                            aria-label={`Preview ${doc.name}`}
                          >
                            <img
                              src={doc.previewDataUrl}
                              alt={doc.name}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </span>
                          </button>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 flex items-center justify-center text-[#1D6852] dark:text-[#38B28B] shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          {/* Auto-Assigned Category Tag + Source + Format Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-extrabold ${tagStyle.badgeClass}`}
                            >
                              <Tag className="w-3 h-3 shrink-0" />
                              <span>{resolvedTag}</span>
                            </span>

                            {meta?.detectedFileFormat && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 font-mono text-[10px] font-bold text-slate-600 dark:text-[#94A3B8]">
                                {meta.detectedFileFormat}
                              </span>
                            )}

                            {doc.uploadSource && doc.uploadSource !== "sample" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 text-[10px] font-semibold text-slate-600 dark:text-[#CBD5E1]">
                                {doc.uploadSource === "camera" ? (
                                  <>
                                    <Camera className="w-3 h-3 text-[#D97724]" />
                                    <span>{locale === "pl" ? "Kamera" : "Camera"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-3 h-3 text-[#38B28B]" />
                                    <span>{locale === "pl" ? "Plik" : "System"}</span>
                                  </>
                                )}
                              </span>
                            )}

                            {meta && (
                              <span className="font-mono text-[10px] font-bold text-[#38B28B] tabular-nums">
                                {meta.confidence}%{" "}
                                {meta.analysisMethod === "ai_multimodal"
                                  ? "AI Vision"
                                  : meta.analysisMethod === "ai_text"
                                  ? "AI Content"
                                  : "Content Scan"}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9] break-all">
                            {doc.name}
                          </h4>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5 tabular-nums flex-wrap">
                            <span>{doc.fileSize}</span>
                            <span>·</span>
                            <span>{doc.uploadDate}</span>
                            {meta?.contentSummary && (
                              <>
                                <span>·</span>
                                <span className="text-slate-700 dark:text-[#CBD5E1]">
                                  {meta.contentSummary}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Detected Content Signals + Manual Category Override */}
                          <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                            {meta && meta.detectedSignals.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {meta.detectedSignals.map((sig, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B0F17]/80 border border-slate-200 dark:border-white/10 text-[10px] font-medium text-slate-600 dark:text-[#94A3B8]"
                                  >
                                    {sig}
                                  </span>
                                ))}
                              </div>
                            )}

                            <label className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-[#94A3B8]">
                              <span>{locale === "pl" ? "Tag:" : "Category:"}</span>
                              <select
                                value={resolvedTag}
                                onChange={(e) =>
                                  updateDocumentCategoryTag(
                                    doc.id,
                                    e.target.value as DocumentCategoryTag
                                  )
                                }
                                aria-label={`Category tag for ${doc.name}`}
                                className="bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/15 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B] cursor-pointer"
                              >
                                {ALL_DOCUMENT_CATEGORY_TAGS.map((tagOption) => (
                                  <option key={tagOption} value={tagOption}>
                                    {tagOption}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!doc.auditResult && (
                          <button
                            type="button"
                            onClick={() => runDocumentAudit(doc.id)}
                            className="flex items-center gap-1.5 bg-[#D97724] hover:bg-[#C2651A] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t("runAuditBtn")}</span>
                            <span className="sm:hidden">Audit</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeDocument(doc.id)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-[#0B0F17]/60 text-slate-500 dark:text-[#94A3B8] hover:text-red-500 transition-colors cursor-pointer"
                          aria-label="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* AI Audit Report Drawer */}
                    {doc.auditResult && (
                      <div className="bg-slate-50 dark:bg-[#0B0F17]/90 border border-slate-200/80 dark:border-white/10 rounded-xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-white/10">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#1D6852] dark:text-[#38B28B] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {t("auditResultTitle")}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 dark:text-[#94A3B8] tabular-nums">
                            Wyliczona stawka:{" "}
                            <strong className="text-slate-900 dark:text-white">
                              £{(doc.auditResult.calculatedHourly ?? user.hourlyRate).toFixed(2)}/h
                            </strong>{" "}
                            · {doc.auditResult.holidayPayStatus}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-[#F1F5F9]">
                          {doc.auditResult.summary}
                        </p>

                        <div className="space-y-2">
                          {doc.auditResult.items.map((item, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                                item.severity === "error"
                                  ? "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-200"
                                  : item.severity === "warning"
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
                                  : "bg-[#1D6852]/15 border-[#38B28B]/30 text-slate-800 dark:text-[#F1F5F9]"
                              }`}
                            >
                              {item.severity === "error" ? (
                                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              ) : item.severity === "warning" ? (
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-[#38B28B] shrink-0 mt-0.5" />
                              )}
                              <div>
                                <div className="font-bold">{item.issue}</div>
                                <div className="text-[11px] opacity-90 mt-0.5">
                                  {item.recommendation}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: WORKPLACE EVIDENCE DIARY (NOTES) */}
      {profileSubTab === "notes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 5 cols: Add New Incident / Evidence Note */}
          <form
            onSubmit={handleCreateNote}
            className="lg:col-span-5 bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 space-y-3.5 self-start"
          >
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-[#F1F5F9]">
                {t("notesHeading")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                {t("notesSub")}
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder={t("noteTitlePlaceholder")}
                className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#38B28B]"
              />
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
              >
                <option value="Godziny i Grafik">Godziny i Grafik</option>
                <option value="Wypłata i Potrącenia">Wypłata i Potrącenia</option>
                <option value="Rozmowa z przełożonym">Rozmowa z przełożonym</option>
                <option value="Wypadek / BHP">Wypadek / BHP</option>
                <option value="Dyskryminacja / Mobbing">Dyskryminacja / Mobbing</option>
              </select>

              <textarea
                rows={4}
                value={noteDesc}
                onChange={(e) => setNoteDesc(e.target.value)}
                placeholder={t("noteDescPlaceholder")}
                className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#38B28B] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 bg-[#D97724] hover:bg-[#C2651A] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("addNoteBtn")}
            </button>
          </form>

          {/* Right 7 cols: Chronological Evidence Entries */}
          <div className="lg:col-span-7 space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 flex items-start justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#1D6852]/15 text-[#1D6852] dark:text-[#38B28B] border border-[#38B28B]/25">
                      {note.category}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3 h-3" />
                      {note.date}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9]">
                    {note.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                    {note.description}
                  </p>
                </div>

                <button
                  onClick={() => removeNote(note.id)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-[#0B0F17]/60 text-slate-500 dark:text-[#94A3B8] hover:text-red-500 transition-colors shrink-0"
                  aria-label="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: APPEARANCE (THEME SWITCHER) & VOICE PREFERENCES */}
      {profileSubTab === "settings" && (
        <div className="space-y-5">
          {/* Theme Switcher Card */}
          <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F1F5F9]">
                  {locale === "pl"
                    ? "Motyw kolorystyczny i czytelność"
                    : locale === "ro"
                    ? "Temă de culoare și lizibilitate"
                    : "Display Theme & Readability"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  {locale === "pl"
                    ? "Przełączaj pomiędzy stonowanym trybem ciemnym (Chancery Slate) a jasnym trybem wysokiego kontrastu na dzień."
                    : "Toggle between the toned-down Chancery Slate dark theme and high-contrast daylight mode."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => setThemeMode("dark")}
                className={`text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
                  themeMode === "dark"
                    ? "border-[#38B28B] bg-[#1D6852]/10"
                    : "border-slate-200 dark:border-white/10 hover:border-[#38B28B]/50"
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-[#0B0F17] border border-white/15 flex items-center justify-center text-[#38B28B] shrink-0">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9]">
                      {locale === "pl"
                        ? "Ciemny (Chancery Legal Slate)"
                        : "Dark (Chancery Legal Slate)"}
                    </span>
                    {themeMode === "dark" && (
                      <CheckCircle2 className="w-4 h-4 text-[#38B28B] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
                    {locale === "pl"
                      ? "Stonowany grafit (#0B0F17) z szałwiową zielenią (#38B28B) i ciepłą ochrą (#D97724). Nie męczy wzroku wieczorem."
                      : "Subdued slate (#0B0F17) with legal sage (#38B28B) and warm ochre (#D97724). Easy on the eyes."}
                  </p>
                </div>
              </button>

              {/* High-Contrast Light Mode Option */}
              <button
                type="button"
                onClick={() => setThemeMode("light")}
                className={`text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
                  themeMode === "light"
                    ? "border-[#1D6852] bg-[#1D6852]/10"
                    : "border-slate-200 dark:border-white/10 hover:border-[#38B28B]/50"
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-[#F4F6F9] border border-slate-300 flex items-center justify-center text-[#D97724] shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9]">
                      {locale === "pl"
                        ? "Jasny (Wysoki Kontrast w Dzień)"
                        : "High-Contrast Daylight Mode"}
                    </span>
                    {themeMode === "light" && (
                      <CheckCircle2 className="w-4 h-4 text-[#1D6852] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
                    {locale === "pl"
                      ? "Jasne tło pergaminowe (#F4F6F9) i głęboki atramentowy tekst (#0F172A) dla maksymalnej czytelności w ciągu dnia."
                      : "Crisp daylight parchment (#F4F6F9) and deep ink typography (#0F172A) for outdoor and daytime reading."}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Voice Preferences & Audio Summary Card */}
          <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#1D6852]/15 border border-[#38B28B]/30 flex items-center justify-center text-[#38B28B] shrink-0">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9]">
                  {locale === "pl"
                    ? "Preferencje Głosu Elona (Synteza Mowy)"
                    : "Elon Voice Preferences (TTS)"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  {voiceConfig.preset === "young_professional"
                    ? locale === "pl"
                      ? "Aktywny profil: Młody Profesjonalista (~28 lat, naturalny męski baryton)"
                      : "Active preset: Young Professional Male (~28 y/o, warm baritone)"
                    : locale === "pl"
                    ? "Aktywny profil: Standardowy Asystent AI"
                    : "Active preset: Standard AI Assistant"}{" "}
                  · Pitch: {voiceConfig.pitch.toFixed(2)} · Tempo: {voiceConfig.speed.toFixed(2)}x
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsVoicePreferencesModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#1D6852] hover:bg-[#258066] text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
            >
              {locale === "pl" ? "Konfiguruj głos Elona" : "Configure Voice"}
            </button>
          </div>
        </div>
      )}

      {/* Camera Document Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCaptureBlob={(blob, name) => {
          void processUploadedFileOrBlob(blob, "camera", name);
        }}
      />

      {/* Image Thumbnail Preview Modal */}
      {previewImageDoc && (
        <div
          className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImageDoc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-2xl w-full bg-[#131B2E] border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#0B2038] border-b border-white/10 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white truncate">{previewImageDoc.name}</span>
              <button
                type="button"
                onClick={() => setPreviewImageDoc(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-[#EF4444] text-white cursor-pointer"
                aria-label="Close image preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-black flex items-center justify-center max-h-[75vh]">
              <img
                src={previewImageDoc.url}
                alt={previewImageDoc.name}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
