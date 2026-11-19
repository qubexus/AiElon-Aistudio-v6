import React, { useState, useRef, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { WorkplaceCase } from "../types";
import {
  Camera,
  Image as ImageIcon,
  FolderOpen,
  FileText,
  Receipt,
  Mail,
  FileSpreadsheet,
  StickyNote,
  FileArchive,
  Plus,
  Share2,
  Pencil,
  FolderInput,
  Trash2,
  Eye,
  X,
  Check,
  MoreVertical,
} from "lucide-react";

import {
  CaseBoxCategoryId,
  CaseBoxDocumentItem,
  CASE_BOX_DOCS_UPDATED_EVENT,
  buildDefaultBoxItemsForCase,
  readAllStoredBoxDocs,
  writeAllStoredBoxDocs,
  suggestBoxForFile,
} from "../utils/caseBoxStorage";

export type { CaseBoxCategoryId, CaseBoxDocumentItem };

interface BoxMetaConfig {
  id: CaseBoxCategoryId;
  accent: "green" | "orange";
  labelEn: string;
  labelPl: string;
  labelRo: string;
  icon: React.ReactNode;
}

export const CaseDocumentBoxesSection: React.FC<{
  caseItem: WorkplaceCase;
}> = ({ caseItem }) => {
  const { locale, documents, sentLetters, showToast, addCaseNote } = useApp();

  const tr = (en: string, pl: string, ro: string) =>
    locale === "pl" ? pl : locale === "ro" ? ro : en;

  const boxConfigs: BoxMetaConfig[] = useMemo(
    () => [
      {
        id: "contracts",
        accent: "green",
        labelEn: "Contracts",
        labelPl: "Umowy",
        labelRo: "Contracte",
        icon: <FileText className="w-4 h-4" strokeWidth={1.8} />,
      },
      {
        id: "payslips",
        accent: "orange",
        labelEn: "Payslips",
        labelPl: "Paski wypłaty",
        labelRo: "Fluturași de salariu",
        icon: <Receipt className="w-4 h-4" strokeWidth={1.8} />,
      },
      {
        id: "letters",
        accent: "green",
        labelEn: "Letters",
        labelPl: "Pisma",
        labelRo: "Scrisori",
        icon: <Mail className="w-4 h-4" strokeWidth={1.8} />,
      },
      {
        id: "evidence",
        accent: "orange",
        labelEn: "Evidence (photos)",
        labelPl: "Dowody (zdjęcia)",
        labelRo: "Dovezi (foto)",
        icon: <ImageIcon className="w-4 h-4" strokeWidth={1.8} />,
      },
      {
        id: "notes",
        accent: "green",
        labelEn: "Notes",
        labelPl: "Notatki",
        labelRo: "Notițe",
        icon: <StickyNote className="w-4 h-4" strokeWidth={1.8} />,
      },
      {
        id: "other",
        accent: "orange",
        labelEn: "Other (PDF)",
        labelPl: "Inne (PDF)",
        labelRo: "Altele (PDF)",
        icon: <FileArchive className="w-4 h-4" strokeWidth={1.8} />,
      },
    ],
    []
  );

  const [boxDocs, setBoxDocs] = useState<CaseBoxDocumentItem[]>(() => {
    const stored = readAllStoredBoxDocs();
    if (stored.some((i) => i.caseId === caseItem.id)) {
      return stored;
    }
    const seeded = [...stored, ...buildDefaultBoxItemsForCase(caseItem, documents, sentLetters)];
    writeAllStoredBoxDocs(seeded);
    return seeded;
  });

  useEffect(() => {
    setBoxDocs((prev) => {
      if (prev.some((i) => i.caseId === caseItem.id)) return prev;
      const defaults = buildDefaultBoxItemsForCase(caseItem, documents, sentLetters);
      if (defaults.length === 0) return prev;
      const seeded = [...prev, ...defaults];
      writeAllStoredBoxDocs(seeded);
      return seeded;
    });
  }, [caseItem, documents, sentLetters]);

  useEffect(() => {
    const handleExternalUpdate = () => {
      setBoxDocs(readAllStoredBoxDocs());
    };
    window.addEventListener(CASE_BOX_DOCS_UPDATED_EVENT, handleExternalUpdate);
    return () => {
      window.removeEventListener(CASE_BOX_DOCS_UPDATED_EVENT, handleExternalUpdate);
    };
  }, []);

  const saveBoxDocs = (updater: (prev: CaseBoxDocumentItem[]) => CaseBoxDocumentItem[]) => {
    setBoxDocs((prev) => {
      const next = updater(prev);
      writeAllStoredBoxDocs(next);
      return next;
    });
  };

  const [openBoxId, setOpenBoxId] = useState<CaseBoxCategoryId | null>(null);
  const [previewDoc, setPreviewDoc] = useState<CaseBoxDocumentItem | null>(null);
  const [activeDocMenuId, setActiveDocMenuId] = useState<string | null>(null);
  const [renamingDoc, setRenamingDoc] = useState<CaseBoxDocumentItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [movingDoc, setMovingDoc] = useState<CaseBoxDocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<CaseBoxDocumentItem | null>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  // Proposal state after adding a photo / file / note
  const [pendingUploadItem, setPendingUploadItem] = useState<{
    name: string;
    size: string;
    kind: "pdf" | "image" | "note";
    suggestedBoxId: CaseBoxCategoryId;
    previewText?: string;
    thumbnailDataUrl?: string;
  } | null>(null);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const caseBoxDocs = useMemo(
    () => boxDocs.filter((d) => d.caseId === caseItem.id),
    [boxDocs, caseItem.id]
  );

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    source: "camera" | "gallery" | "files"
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const suggestedBoxId = suggestBoxForFile(file.name, file.type || "", source);
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    const isImg = file.type.startsWith("image/") || source === "camera" || source === "gallery";

    if (isImg) {
      const reader = new FileReader();
      reader.onload = () => {
        setPendingUploadItem({
          name: file.name,
          size: sizeLabel,
          kind: "image",
          suggestedBoxId,
          thumbnailDataUrl: typeof reader.result === "string" ? reader.result : undefined,
          previewText: `Image attachment (${file.name}, ${sizeLabel})`,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setPendingUploadItem({
        name: file.name,
        size: sizeLabel,
        kind: "pdf",
        suggestedBoxId,
        previewText: `File attachment: ${file.name} (${sizeLabel})`,
      });
    }
    setIsFabMenuOpen(false);
  };

  const confirmPendingUpload = (chosenBoxId: CaseBoxCategoryId) => {
    if (!pendingUploadItem) return;
    const today = new Date().toISOString().slice(0, 10);
    const newItem: CaseBoxDocumentItem = {
      id: `boxitem_${Date.now()}`,
      caseId: caseItem.id,
      boxId: chosenBoxId,
      name: pendingUploadItem.name,
      size: pendingUploadItem.size,
      date: today,
      kind: pendingUploadItem.kind,
      previewText: pendingUploadItem.previewText,
      thumbnailDataUrl: pendingUploadItem.thumbnailDataUrl,
    };
    saveBoxDocs((prev) => [newItem, ...prev]);
    setOpenBoxId(chosenBoxId);
    setPendingUploadItem(null);
    const targetBox = boxConfigs.find((b) => b.id === chosenBoxId);
    const boxName = targetBox
      ? tr(targetBox.labelEn, targetBox.labelPl, targetBox.labelRo)
      : chosenBoxId;
    showToast(
      tr(
        `Saved to box: ${boxName}`,
        `Zapisano w pudełku: ${boxName}`,
        `Salvat în cutia: ${boxName}`
      )
    );
  };

  const getBoxLabel = (box: BoxMetaConfig) =>
    tr(box.labelEn, box.labelPl, box.labelRo);

  return (
    <div className="relative space-y-4">
      {/* Hidden File Inputs for Camera / Gallery / Files */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileInput(e, "camera")}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileInput(e, "gallery")}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,image/*"
        onChange={(e) => handleFileInput(e, "files")}
        className="hidden"
      />

      {/* ATTACHMENTS SECTION ABOVE BOXES: 3 Tiles in a Row (Camera, Gallery, Files), ~72px height */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] dark:text-[#F1F5F9]">
            {tr("Attachments", "Załączniki", "Atașamente")}
          </h4>
          <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
            {tr("Quick add to boxes", "Szybkie dodawanie do pudełek", "Adăugare rapidă în cutii")}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            {
              id: "camera",
              accent: "green" as const,
              label: tr("Camera", "Kamera", "Cameră"),
              icon: <Camera className="w-4.5 h-4.5" strokeWidth={1.8} />,
              onClick: () => cameraInputRef.current?.click(),
            },
            {
              id: "gallery",
              accent: "orange" as const,
              label: tr("Gallery", "Galeria", "Galerie"),
              icon: <ImageIcon className="w-4.5 h-4.5" strokeWidth={1.8} />,
              onClick: () => galleryInputRef.current?.click(),
            },
            {
              id: "files",
              accent: "green" as const,
              label: tr("Files", "Pliki", "Fișiere"),
              icon: <FolderOpen className="w-4.5 h-4.5" strokeWidth={1.8} />,
              onClick: () => fileInputRef.current?.click(),
            },
          ].map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={tile.onClick}
              className="group h-[72px] rounded-[16px] bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] overflow-hidden flex flex-col justify-between text-left transition-all hover:border-[#2E6F57] dark:hover:border-[#52B798] shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:shadow-none cursor-pointer"
            >
              {/* Carton-style top lid strip */}
              <div
                className={`w-full h-[10px] shrink-0 transition-transform duration-200 ${
                  tile.accent === "green"
                    ? "bg-[#2E6F57]/25 dark:bg-[#52B798]/25 border-b border-[#2E6F57]/30 dark:border-[#52B798]/30"
                    : "bg-[#F59E42]/25 dark:bg-[#FBB063]/25 border-b border-[#F59E42]/30 dark:border-[#FBB063]/30"
                }`}
              />
              <div className="flex-1 px-3 flex items-center justify-center gap-2">
                <span
                  className={
                    tile.accent === "green"
                      ? "text-[#2E6F57] dark:text-[#52B798]"
                      : "text-[#F59E42] dark:text-[#FBB063]"
                  }
                >
                  {tile.icon}
                </span>
                <span className="text-xs font-bold text-[#1E293B] dark:text-[#F1F5F9] truncate">
                  {tile.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Proposed Box Selection Banner after Choosing Photo / File */}
      {pendingUploadItem && (
        <div className="rounded-[16px] bg-white dark:bg-[#1E2732] border-2 border-[#2E6F57] dark:border-[#52B798] p-3.5 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E6F57] dark:text-[#52B798] block">
                {tr("Suggested Box", "Proponowane pudełko", "Cutie propusă")}
              </span>
              <p className="text-xs font-bold text-[#1E293B] dark:text-[#F1F5F9] truncate">
                {pendingUploadItem.name} ({pendingUploadItem.size})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingUploadItem(null)}
              className="p-1 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {boxConfigs.map((b) => {
              const isSuggested = b.id === pendingUploadItem.suggestedBoxId;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => confirmPendingUpload(b.id)}
                  className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                    isSuggested
                      ? "bg-[#2E6F57] dark:bg-[#52B798] border-[#2E6F57] dark:border-[#52B798] text-white dark:text-[#141B23]"
                      : "bg-[#F8FAFC] dark:bg-[#141B23] border-[#E2E8F0] dark:border-[#2C3847] text-[#1E293B] dark:text-[#F1F5F9] hover:border-[#2E6F57] dark:hover:border-[#52B798]"
                  }`}
                >
                  <span className="truncate">{getBoxLabel(b)}</span>
                  {isSuggested && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6 DOCUMENT CARTON BOXES: 2-Column Grid, 12px Gap */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] dark:text-[#F1F5F9]">
            {tr("Case Document Boxes", "Dokumenty w pudełkach", "Documente în cutii")}
          </h4>
          <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
            {tr(
              "Tap box to open • Hold document for options",
              "Dotknij pudełka, by otworzyć • Przytrzymaj dokument",
              "Atinge cutia • Ține apăsat pe document"
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-[12px]">
          {boxConfigs.map((box) => {
            const itemsInBox = caseBoxDocs.filter((d) => d.boxId === box.id);
            const count = itemsInBox.length;
            const isEmpty = count === 0;
            const isBoxOpen = openBoxId === box.id;
            const lastModifiedDate = itemsInBox[0]?.date || "—";
            const isGreen = box.accent === "green";

            return (
              <div
                key={box.id}
                className={`rounded-[16px] bg-white dark:bg-[#1E2732] transition-all overflow-hidden ${
                  isBoxOpen ? "col-span-2" : "col-span-1"
                } ${
                  isEmpty
                    ? "border border-dashed border-[#E2E8F0] dark:border-[#2C3847]"
                    : isBoxOpen
                    ? isGreen
                      ? "border border-[#2E6F57] dark:border-[#52B798] shadow-sm"
                      : "border border-[#F59E42] dark:border-[#FBB063] shadow-sm"
                    : "border border-[#E2E8F0] dark:border-[#2C3847] shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:shadow-none"
                }`}
              >
                {/* Carton Header Button with 14px Top Lid that tilts on open (200ms) */}
                <button
                  type="button"
                  onClick={() => setOpenBoxId(isBoxOpen ? null : box.id)}
                  className="w-full text-left focus:outline-none cursor-pointer group"
                >
                  {/* 14px Carton Lid Strip */}
                  <div
                    className={`w-full h-[14px] transition-all duration-200 origin-top-left ${
                      isBoxOpen ? "-translate-y-[2px] -rotate-[1.2deg] brightness-110" : ""
                    } ${
                      isGreen
                        ? "bg-[#2E6F57]/25 dark:bg-[#52B798]/25 border-b border-[#2E6F57]/35 dark:border-[#52B798]/35"
                        : "bg-[#F59E42]/25 dark:bg-[#FBB063]/25 border-b border-[#F59E42]/35 dark:border-[#FBB063]/35"
                    }`}
                  />

                  {/* Carton Body */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                          isGreen
                            ? "bg-[#2E6F57]/10 dark:bg-[#52B798]/15 border-[#2E6F57]/30 dark:border-[#52B798]/35 text-[#2E6F57] dark:text-[#52B798]"
                            : "bg-[#F59E42]/10 dark:bg-[#FBB063]/15 border-[#F59E42]/30 dark:border-[#FBB063]/35 text-[#F59E42] dark:text-[#FBB063]"
                        }`}
                      >
                        {box.icon}
                      </span>

                      {/* Orange Circle Document Counter (DM Mono) */}
                      <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#F59E42] text-white dark:bg-[#FBB063] dark:text-[#141B23] font-mono text-[11px] font-bold flex items-center justify-center tabular-nums">
                        {count}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#1E293B] dark:text-[#F1F5F9] truncate">
                        {getBoxLabel(box)}
                      </div>
                      <div className="font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate">
                        {isEmpty
                          ? tr("Empty", "Pusto", "Gol")
                          : lastModifiedDate}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Document List inside the Opened Box */}
                {isBoxOpen && (
                  <div className="px-3 pb-3 pt-2 border-t border-[#E2E8F0] dark:border-[#2C3847] bg-[#F8FAFC] dark:bg-[#141B23]/60 space-y-2">
                    {isEmpty ? (
                      <div className="py-4 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {tr(
                          "Empty — use Attachments or '+' to add a document to this box.",
                          "Pusto — użyj Załączników lub przycisku '+', aby dodać dokument.",
                          "Gol — folosește Atașamente sau '+' pentru a adăuga un document."
                        )}
                      </div>
                    ) : (
                      itemsInBox.map((doc) => {
                        const isMenuOpen = activeDocMenuId === doc.id;
                        return (
                          <div
                            key={doc.id}
                            onPointerDown={() => {
                              if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                              }
                              longPressTimerRef.current = setTimeout(() => {
                                setActiveDocMenuId(doc.id);
                              }, 420);
                            }}
                            onPointerUp={() => {
                              if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                              }
                            }}
                            onPointerLeave={() => {
                              if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setActiveDocMenuId(isMenuOpen ? null : doc.id);
                            }}
                            className="relative rounded-xl bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] p-2.5 flex items-center justify-between gap-2.5"
                          >
                            {/* Document Row: Tap opens Preview */}
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                            >
                              {doc.thumbnailDataUrl ? (
                                <img
                                  src={doc.thumbnailDataUrl}
                                  alt={doc.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-[#E2E8F0] dark:border-[#2C3847] shrink-0"
                                />
                              ) : (
                                <span
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                                    isGreen
                                      ? "bg-[#2E6F57]/10 dark:bg-[#52B798]/15 border-[#2E6F57]/25 text-[#2E6F57] dark:text-[#52B798]"
                                      : "bg-[#F59E42]/10 dark:bg-[#FBB063]/15 border-[#F59E42]/25 text-[#F59E42] dark:text-[#FBB063]"
                                  }`}
                                >
                                  {doc.kind === "image" ? (
                                    <ImageIcon className="w-4 h-4" />
                                  ) : doc.kind === "note" ? (
                                    <StickyNote className="w-4 h-4" />
                                  ) : (
                                    <FileSpreadsheet className="w-4 h-4" />
                                  )}
                                </span>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-[#1E293B] dark:text-[#F1F5F9] truncate">
                                  {doc.name}
                                </div>
                                <div className="font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2 mt-0.5">
                                  <span>{doc.size}</span>
                                  <span>•</span>
                                  <span>{doc.date}</span>
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#2E6F57] dark:hover:text-[#52B798] cursor-pointer"
                                title={tr("Preview", "Podgląd", "Previzualizare")}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveDocMenuId(isMenuOpen ? null : doc.id)
                                }
                                className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-white cursor-pointer"
                                title={tr("Options", "Opcje", "Opțiuni")}
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Long-Press / Context Menu: Share / Rename / Move to another box / Delete */}
                            {isMenuOpen && (
                              <div className="absolute right-2 top-11 z-30 w-52 rounded-xl bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] shadow-xl p-1.5 space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDocMenuId(null);
                                    if (navigator.share) {
                                      navigator
                                        .share({
                                          title: doc.name,
                                          text: doc.previewText || doc.name,
                                        })
                                        .catch(() => {});
                                    } else {
                                      navigator.clipboard?.writeText(
                                        `${doc.name}\n${doc.previewText || ""}`
                                      );
                                      showToast(
                                        tr(
                                          "Document link/details copied to share",
                                          "Skopiowano dokument do udostępnienia",
                                          "Copiat pentru distribuire"
                                        )
                                      );
                                    }
                                  }}
                                  className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-[#1E293B] dark:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#141B23] flex items-center gap-2 cursor-pointer"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-[#2E6F57] dark:text-[#52B798]" />
                                  <span>{tr("Share", "Udostępnij", "Distribuie")}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDocMenuId(null);
                                    setRenamingDoc(doc);
                                    setRenameValue(doc.name);
                                  }}
                                  className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-[#1E293B] dark:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#141B23] flex items-center gap-2 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-[#F59E42] dark:text-[#FBB063]" />
                                  <span>{tr("Rename", "Zmień nazwę", "Redenumește")}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDocMenuId(null);
                                    setMovingDoc(doc);
                                  }}
                                  className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-[#1E293B] dark:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#141B23] flex items-center gap-2 cursor-pointer"
                                >
                                  <FolderInput className="w-3.5 h-3.5 text-[#2E6F57] dark:text-[#52B798]" />
                                  <span>
                                    {tr(
                                      "Move to another box",
                                      "Przenieś do innego pudełka",
                                      "Mută în altă cutie"
                                    )}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDocMenuId(null);
                                    setDeletingDoc(doc);
                                  }}
                                  className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-[#F87171] hover:bg-[#F87171]/10 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-[#F87171]" />
                                  <span>{tr("Delete", "Usuń", "Șterge")}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating '+' Button in the Bottom-Right Corner of the Case View */}
      <div className="flex justify-end pt-1">
        <div className="relative">
          {isFabMenuOpen && (
            <div className="absolute right-0 bottom-13 z-30 w-56 rounded-[16px] bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] shadow-xl p-1.5 space-y-1">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-[#1E293B] dark:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#141B23] flex items-center gap-2.5 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#2E6F57] dark:text-[#52B798]" />
                <span>{tr("Take photo", "Zrób zdjęcie", "Fă o fotografie")}</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-[#1E293B] dark:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#141B23] flex items-center gap-2.5 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-[#F59E42] dark:text-[#FBB063]" />
                <span>
                  {tr("Choose from gallery", "Wybierz z galerii", "Alege din galerie")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-[#1E293B] dark:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#141B23] flex items-center gap-2.5 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-[#2E6F57] dark:text-[#52B798]" />
                <span>{tr("Add file", "Dodaj plik", "Adaugă fișier")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFabMenuOpen(false);
                  setIsNewNoteModalOpen(true);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-[#1E293B] dark:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#141B23] flex items-center gap-2.5 cursor-pointer"
              >
                <StickyNote className="w-4 h-4 text-[#F59E42] dark:text-[#FBB063]" />
                <span>{tr("New note", "Nowa notatka", "Notiță nouă")}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsFabMenuOpen((prev) => !prev)}
            aria-label={tr("Add document or note", "Dodaj dokument lub notatkę", "Adaugă document sau notiță")}
            className="w-11 h-11 rounded-full bg-[#2E6F57] dark:bg-[#52B798] text-white dark:text-[#141B23] shadow-md hover:brightness-105 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className={`w-5 h-5 transition-transform ${isFabMenuOpen ? "rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="w-full max-w-lg rounded-[16px] bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#2C3847] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#1E293B] dark:text-[#F1F5F9] truncate">
                  {previewDoc.name}
                </h4>
                <p className="font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  {previewDoc.size} • {previewDoc.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[65vh] overflow-y-auto space-y-3">
              {previewDoc.thumbnailDataUrl && (
                <img
                  src={previewDoc.thumbnailDataUrl}
                  alt={previewDoc.name}
                  className="w-full max-h-72 object-contain rounded-xl border border-[#E2E8F0] dark:border-[#2C3847]"
                />
              )}
              <pre className="text-xs font-sans whitespace-pre-wrap text-[#1E293B] dark:text-[#F1F5F9] bg-[#F8FAFC] dark:bg-[#141B23] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#2C3847]">
                {previewDoc.previewText || previewDoc.name}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renamingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[16px] bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] p-4 space-y-3 shadow-2xl">
            <h4 className="text-sm font-bold text-[#1E293B] dark:text-[#F1F5F9]">
              {tr("Rename document", "Zmień nazwę dokumentu", "Redenumește documentul")}
            </h4>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] px-3 py-2 text-xs text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none focus:border-[#2E6F57] dark:focus:border-[#52B798]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingDoc(null)}
                className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#2C3847] text-xs font-bold text-[#64748B] dark:text-[#94A3B8] cursor-pointer"
              >
                {tr("Cancel", "Anuluj", "Anulează")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (renameValue.trim()) {
                    const today = new Date().toISOString().slice(0, 10);
                    saveBoxDocs((prev) =>
                      prev.map((d) =>
                        d.id === renamingDoc.id
                          ? { ...d, name: renameValue.trim(), date: today }
                          : d
                      )
                    );
                  }
                  setRenamingDoc(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#2E6F57] dark:bg-[#52B798] text-white dark:text-[#141B23] text-xs font-bold cursor-pointer"
              >
                {tr("Save", "Zapisz", "Salvează")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Another Box Modal */}
      {movingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[16px] bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] p-4 space-y-3 shadow-2xl">
            <h4 className="text-sm font-bold text-[#1E293B] dark:text-[#F1F5F9]">
              {tr(
                "Move to another box",
                "Przenieś do innego pudełka",
                "Mută în altă cutie"
              )}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {boxConfigs.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    saveBoxDocs((prev) =>
                      prev.map((d) =>
                        d.id === movingDoc.id ? { ...d, boxId: b.id, date: today } : d
                      )
                    );
                    setOpenBoxId(b.id);
                    setMovingDoc(null);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left cursor-pointer ${
                    movingDoc.boxId === b.id
                      ? "bg-[#2E6F57] dark:bg-[#52B798] border-[#2E6F57] dark:border-[#52B798] text-white dark:text-[#141B23]"
                      : "bg-[#F8FAFC] dark:bg-[#141B23] border-[#E2E8F0] dark:border-[#2C3847] text-[#1E293B] dark:text-[#F1F5F9]"
                  }`}
                >
                  {getBoxLabel(b)}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMovingDoc(null)}
                className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#2C3847] text-xs font-bold text-[#64748B] dark:text-[#94A3B8] cursor-pointer"
              >
                {tr("Cancel", "Anuluj", "Anulează")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[16px] bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] p-4 space-y-3 shadow-2xl">
            <h4 className="text-sm font-bold text-[#1E293B] dark:text-[#F1F5F9]">
              {tr(
                "Confirm document deletion",
                "Potwierdź usunięcie dokumentu",
                "Confirmă ștergerea documentului"
              )}
            </h4>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {tr(
                `Are you sure you want to delete "${deletingDoc.name}"?`,
                `Czy na pewno chcesz usunąć „${deletingDoc.name}”?`,
                `Sigur vrei să ștergi „${deletingDoc.name}”?`
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#2C3847] text-xs font-bold text-[#64748B] dark:text-[#94A3B8] cursor-pointer"
              >
                {tr("Cancel", "Anuluj", "Anulează")}
              </button>
              <button
                type="button"
                onClick={() => {
                  saveBoxDocs((prev) => prev.filter((d) => d.id !== deletingDoc.id));
                  setDeletingDoc(null);
                  showToast(
                    tr("Document deleted", "Usunięto dokument", "Document șters")
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-[#F87171] text-[#141B23] text-xs font-bold cursor-pointer"
              >
                {tr("Delete", "Usuń", "Șterge")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Note Modal triggered from '+' button */}
      {isNewNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[16px] bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] p-4 space-y-3 shadow-2xl">
            <h4 className="text-sm font-bold text-[#1E293B] dark:text-[#F1F5F9]">
              {tr("New note", "Nowa notatka", "Notiță nouă")}
            </h4>
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder={tr("Note title...", "Tytuł notatki...", "Titlul notiței...")}
              className="w-full rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] px-3 py-2 text-xs text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none focus:border-[#2E6F57] dark:focus:border-[#52B798]"
            />
            <textarea
              rows={3}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder={tr("Write note details...", "Treść notatki...", "Detalii notiță...")}
              className="w-full rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] px-3 py-2 text-xs text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none focus:border-[#2E6F57] dark:focus:border-[#52B798]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewNoteModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#2C3847] text-xs font-bold text-[#64748B] dark:text-[#94A3B8] cursor-pointer"
              >
                {tr("Cancel", "Anuluj", "Anulează")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const title = newNoteTitle.trim() || tr("Case Note", "Notatka do sprawy", "Notiță caz");
                  const body = newNoteContent.trim() || title;
                  addCaseNote(caseItem.id, `${title}: ${body}`);
                  setIsNewNoteModalOpen(false);
                  setNewNoteTitle("");
                  setNewNoteContent("");
                  setPendingUploadItem({
                    name: title,
                    size: "4 KB",
                    kind: "note",
                    suggestedBoxId: "notes",
                    previewText: body,
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-[#2E6F57] dark:bg-[#52B798] text-white dark:text-[#141B23] text-xs font-bold cursor-pointer"
              >
                {tr("Add", "Dodaj", "Adaugă")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
