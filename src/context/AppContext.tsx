import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import {
  Locale,
  UserProfile,
  WorkplaceCase,
  LegalTemplate,
  ForumPost,
  UserDocument,
  WorkplaceNote,
  ChatMessage,
  CasePinnedItem,
  SentLetter,
  SentLetterCategoryTag,
  BroadcastMessage,
  NetworkStatus,
  SavedLetterDraft,
  RecentUnsavedChat,
  ChatSessionTag,
  AdminManagedUser,
  PromoCodeItem,
  MarketingPopupConfig,
  AdminChatDeliveryLog,
  PendingSyncAction,
  OfflineSettingsConfig,
  ElonVoiceConfig,
  ThemeMode,
  RobotActivityState,
  DocumentCategoryTag
} from "../types";
import { mapCategoryTagToDocType, getDefaultCategoryTagForType } from "../utils/documentClassifier";
import {
  defaultTemplates,
  extractProfileUpdatesFromChat,
  buildPersonalizedEnglishLetterForChat,
  stripEmbeddedEnglishLetter,
  classifySentLetter,
} from "../data/legalTemplates";
import * as storage from "../services/storageService";
import { askElonAI, askElonAIStream } from "../services/geminiService";
import { getTranslation } from "../i18n/translations";
import { analyzeAiResponseSentiment } from "../components/AskElonShieldLogo";

export type TabType = "chat" | "cases" | "templates" | "forum" | "profile";
export type ProfileSubTab = "details" | "docs" | "notes" | "settings";

interface AppContextType {
  activeTab: TabType;
  lastNonChatTab: TabType;
  setActiveTab: (tab: TabType) => void;
  closeChat: () => void;
  profileSubTab: ProfileSubTab;
  setProfileSubTab: (subTab: ProfileSubTab) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  robotState: RobotActivityState;
  aiResponseSentiment: "happy" | "concerned" | null;
  setIsElonSpeaking: (speaking: boolean) => void;
  setIsUserDictating: (dictating: boolean) => void;
  triggerRobotReaction: (state?: RobotActivityState, durationMs?: number) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;

  // Connectivity & Active Workflow Protection
  networkStatus: NetworkStatus;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  setIsSimulatedOffline: (simulated: boolean) => void;
  lastOnlineAt: string;
  checkConnectionNow: () => Promise<boolean>;
  isLetterDrafting: boolean;
  setIsLetterDrafting: (drafting: boolean) => void;
  chatDraft: string;
  setChatDraft: (draft: string) => void;
  savedLetterDraft: SavedLetterDraft | null;
  saveCurrentLetterDraft: (draft: SavedLetterDraft | null) => void;
  queuedMessagesCount: number;
  retryQueuedMessages: () => Promise<void>;
  offlineSettings: OfflineSettingsConfig;
  updateOfflineSettings: (updates: Partial<OfflineSettingsConfig>) => void;
  pendingSyncActions: PendingSyncAction[];
  removePendingSyncAction: (id: string) => void;
  removeQueuedChatMessage: (messageId: string) => void;
  syncPendingActionsNow: () => Promise<void>;
  enqueueSampleOfflineAction: () => void;

  // Cases
  cases: WorkplaceCase[];
  activeCaseId: string | null;
  setActiveCaseId: (id: string | null) => void;
  addCase: (newCase: Omit<WorkplaceCase, "id" | "createdAt" | "updatedAt" | "notes">) => string;
  updateCaseStatus: (id: string, status: "open" | "resolved") => void;
  addCaseNote: (caseId: string, noteText: string) => void;
  pinChatMessageToCase: (msgId: string, targetCaseId?: string) => WorkplaceCase | null;
  removeCasePinnedItem: (caseId: string, pinnedItemId: string) => void;
  startChatAboutCase: (caseItem: WorkplaceCase) => void;

  // Templates
  templates: LegalTemplate[];
  activeTemplateId: string | null;
  setActiveTemplateId: (id: string | null) => void;
  sentLetters: SentLetter[];
  saveSentLetter: (letter: Omit<SentLetter, "id" | "date">, silent?: boolean) => void;
  removeSentLetter: (id: string) => void;
  toggleSentLetterTag: (id: string, tag: SentLetterCategoryTag) => void;

  // Q&A (dawniej Forum)
  forumPosts: ForumPost[];
  addForumPost: (
    title: string,
    content: string,
    tag: string,
    extra?: {
      whereToGo?: string;
      whatToSelect?: string[];
      whatYouGet?: string;
      statuteOrFeatureBadge?: string;
    }
  ) => void;
  upvoteForumPost: (postId: string) => void;
  addForumComment: (postId: string, commentText: string) => void;

  // Documents
  documents: UserDocument[];
  addDocument: (doc: Omit<UserDocument, "id" | "uploadDate">) => UserDocument;
  updateDocumentCategoryTag: (id: string, categoryTag: DocumentCategoryTag) => void;
  removeDocument: (id: string) => void;
  runDocumentAudit: (id: string) => void;

  // Notes
  notes: WorkplaceNote[];
  addNote: (title: string, description: string, category: string) => void;
  removeNote: (id: string) => void;

  // Chat
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  sendChatMessage: (text: string, attachedDocIds?: string[]) => Promise<void>;
  clearChatMessages: () => void;
  deleteChatMessage: (msgId: string) => void;
  toggleFlagChatMessage: (msgId: string) => boolean;
  saveCurrentChatAsCase: () => void;
  recentUnsavedChats: RecentUnsavedChat[];
  activeUnsavedChatId: string;
  restoreUnsavedChat: (id: string) => void;
  removeUnsavedChat: (id: string) => void;
  saveUnsavedChatAsCase: (id: string) => void;
  toggleUnsavedChatTag: (id: string, tag: ChatSessionTag) => void;
  toggleArchiveUnsavedChat: (id: string) => void;

  // Modals & Drawers
  isNewCaseModalOpen: boolean;
  setIsNewCaseModalOpen: (open: boolean) => void;
  isNewPostModalOpen: boolean;
  setIsNewPostModalOpen: (open: boolean) => void;
  isEmployerLookupModalOpen: boolean;
  setIsEmployerLookupModalOpen: (open: boolean) => void;
  isPaywallModalOpen: boolean;
  setIsPaywallModalOpen: (open: boolean) => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  isMenuDrawerOpen: boolean;
  setIsMenuDrawerOpen: (open: boolean) => void;
  isMessagesModalOpen: boolean;
  setIsMessagesModalOpen: (open: boolean) => void;
  isSentLettersModalOpen: boolean;
  setIsSentLettersModalOpen: (open: boolean) => void;
  isVoicePreferencesModalOpen: boolean;
  setIsVoicePreferencesModalOpen: (open: boolean) => void;
  isLegalDictionaryModalOpen: boolean;
  setIsLegalDictionaryModalOpen: (open: boolean) => void;
  isQuickSearchModalOpen: boolean;
  setIsQuickSearchModalOpen: (open: boolean) => void;
  isTermsPrivacyModalOpen: boolean;
  setIsTermsPrivacyModalOpen: (open: boolean) => void;
  isRegisterModalOpen: boolean;
  setIsRegisterModalOpen: (open: boolean) => void;
  voiceConfig: ElonVoiceConfig;
  updateVoiceConfig: (updates: Partial<ElonVoiceConfig>) => void;

  // Notifications / Toast
  broadcastMessages: BroadcastMessage[];
  markMessagesRead: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Admin Hub & Marketing
  adminUsers: AdminManagedUser[];
  updateAdminUser: (userId: string, updates: Partial<AdminManagedUser>) => void;
  resetAdminUserPassword: (userId: string) => {
    token: string;
    resetLink: string;
    tempPassword: string;
    email: string;
  };
  promoCodes: PromoCodeItem[];
  addPromoCode: (item: Omit<PromoCodeItem, "id" | "usedCount" | "createdAt">) => void;
  removePromoCode: (id: string) => void;
  validatePromoCode: (codeStr: string) => {
    valid: boolean;
    promo?: PromoCodeItem;
    discountedPrice?: number;
    errorReason?: string;
  };
  redeemPromoCode: (codeStr: string) => {
    valid: boolean;
    promo?: PromoCodeItem;
    discountedPrice?: number;
    errorReason?: string;
  };
  marketingPopupConfig: MarketingPopupConfig;
  updateMarketingPopupConfig: (updates: Partial<MarketingPopupConfig>) => void;
  isMarketingPopupVisible: boolean;
  setIsMarketingPopupVisible: (visible: boolean) => void;
  adminChatDeliveryLogs: AdminChatDeliveryLog[];
  sendAdminSystemChatMessage: (payload: {
    targetType: "broadcast" | "direct";
    targetUserId?: string;
    title: string;
    message: string;
  }) => void;

  // Global reset & clean logout
  logoutAndClearDevice: () => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabState] = useState<TabType>("chat");
  const [lastNonChatTab, setLastNonChatTab] = useState<TabType>("cases");
  const setActiveTab = useCallback((tab: TabType) => {
    if (tab !== "chat") {
      setLastNonChatTab(tab);
    }
    setActiveTabState(tab);
  }, []);
  const closeChat = useCallback(() => {
    setActiveTabState(lastNonChatTab);
  }, [lastNonChatTab]);
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>("details");
  const [themeMode, setThemeModeState] = useState<ThemeMode>(storage.loadThemeMode);
  const [isElonSpeaking, setIsElonSpeaking] = useState<boolean>(false);
  const [isUserDictating, setIsUserDictating] = useState<boolean>(false);
  const [transientRobotState, setTransientRobotState] = useState<RobotActivityState | null>(null);
  const [aiResponseSentiment, setAiResponseSentiment] = useState<"happy" | "concerned" | null>(null);
  const transientRobotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locale, setLocaleState] = useState<Locale>(storage.loadLocale);
  const [user, setUserState] = useState<UserProfile>(storage.loadUserProfile);
  const [cases, setCasesState] = useState<WorkplaceCase[]>(storage.loadCases);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [templates] = useState<LegalTemplate[]>(defaultTemplates);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [sentLetters, setSentLettersState] = useState<SentLetter[]>(storage.loadSentLetters);
  const [forumPosts, setForumPostsState] = useState<ForumPost[]>(storage.loadForumPosts);
  const [documents, setDocumentsState] = useState<UserDocument[]>(storage.loadDocuments);
  const [notes, setNotesState] = useState<WorkplaceNote[]>(storage.loadNotes);
  const [recentUnsavedChats, setRecentUnsavedChatsState] = useState<RecentUnsavedChat[]>(() => {
    const loadedUnsaved = storage.loadRecentUnsavedChats();
    const priorChat = storage.loadChatHistory();
    const hasPriorUserMessages = priorChat.some(
      (m) => m.role === "user" && m.text.trim().length > 0
    );
    if (hasPriorUserMessages) {
      const archived = storage.upsertRecentUnsavedChat(
        loadedUnsaved,
        `unsaved_prev_${Date.now()}`,
        priorChat
      );
      storage.saveChatHistory([]);
      return archived;
    }
    return loadedUnsaved;
  });
  const [chatMessages, setChatMessagesState] = useState<ChatMessage[]>(() => {
    const freshGreeting: ChatMessage[] = [
      {
        id: "msg_init",
        role: "assistant",
        text: getTranslation("elonGreeting", locale),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent"
      }
    ];
    storage.saveChatHistory([]);
    return freshGreeting;
  });
  const [activeUnsavedChatId, setActiveUnsavedChatId] = useState<string>(
    () => `unsaved_${Date.now()}`
  );
  const isCurrentChatSavedAsCaseRef = useRef<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [broadcastMessages, setBroadcastMessagesState] = useState<BroadcastMessage[]>(storage.loadBroadcastMessages);

  // Connectivity & Draft Persistence State
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() =>
    typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online"
  );
  const [isSimulatedOffline, setIsSimulatedOfflineState] = useState<boolean>(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
  const [isLetterDrafting, setIsLetterDrafting] = useState<boolean>(false);
  const [chatDraft, setChatDraftState] = useState<string>(() => {
    storage.saveChatDraft("");
    return "";
  });
  const [savedLetterDraft, setSavedLetterDraftState] = useState<SavedLetterDraft | null>(storage.loadLetterDraft);

  // Offline Settings & Pending Actions Queue State
  const [offlineSettings, setOfflineSettingsState] = useState<OfflineSettingsConfig>(() => {
    try {
      const raw = localStorage.getItem("ask_elon_offline_settings");
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      backgroundSyncEnabled: true,
      autoCacheTemplatesAndLetters: true,
      syncOnMeteredConnection: true,
      lastSyncedAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  });

  const [pendingSyncActions, setPendingSyncActionsState] = useState<PendingSyncAction[]>(() => {
    try {
      const raw = localStorage.getItem("ask_elon_pending_sync_actions");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: "sync_init_1",
        type: "letter_save",
        title: "Kopia zapasowa pisma: Unpaid Holiday Pay (Reg. 14 WTR 1998)",
        subtitle: "Pisma Elona · Chmura dokumentów (4,1 GB / 5 GB)",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "queued",
      },
      {
        id: "sync_init_2",
        type: "note_save",
        title: "Synchronizacja dowodu: Notatka ze spotkania z HR",
        subtitle: "Notatnik i dowody · Szyfrowana kopia offline",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "queued",
      },
    ];
  });

  const savePendingSyncActions = useCallback((items: PendingSyncAction[]) => {
    setPendingSyncActionsState(items);
    try {
      localStorage.setItem("ask_elon_pending_sync_actions", JSON.stringify(items));
    } catch {}
  }, []);

  const appendPendingSyncAction = useCallback(
    (action: Omit<PendingSyncAction, "id" | "createdAt" | "status">) => {
      setPendingSyncActionsState((prev) => {
        const created: PendingSyncAction = {
          ...action,
          id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "queued",
        };
        const next = [created, ...prev];
        try {
          localStorage.setItem("ask_elon_pending_sync_actions", JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  // Modals
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isEmployerLookupModalOpen, setIsEmployerLookupModalOpen] = useState(false);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [isSentLettersModalOpen, setIsSentLettersModalOpen] = useState(false);
  const [isVoicePreferencesModalOpen, setIsVoicePreferencesModalOpen] = useState(false);
  const [isLegalDictionaryModalOpen, setIsLegalDictionaryModalOpen] = useState(false);
  const [isQuickSearchModalOpen, setIsQuickSearchModalOpen] = useState(false);
  const [isTermsPrivacyModalOpen, setIsTermsPrivacyModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [voiceConfig, setVoiceConfigState] = useState<ElonVoiceConfig>(() => storage.loadVoiceConfig());

  const updateVoiceConfig = useCallback((updates: Partial<ElonVoiceConfig>) => {
    setVoiceConfigState((prev) => {
      const next = { ...prev, ...updates };
      storage.saveVoiceConfig(next);
      return next;
    });
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin Hub & Marketing State
  const [adminUsers, setAdminUsersState] = useState<AdminManagedUser[]>(storage.loadAdminUsers);
  const [promoCodes, setPromoCodesState] = useState<PromoCodeItem[]>(storage.loadPromoCodes);
  const [marketingPopupConfig, setMarketingPopupConfigState] = useState<MarketingPopupConfig>(
    storage.loadMarketingPopupConfig
  );
  const [isMarketingPopupVisible, setIsMarketingPopupVisible] = useState<boolean>(() => {
    const cfg = storage.loadMarketingPopupConfig();
    return Boolean(cfg.isActive);
  });
  const [adminChatDeliveryLogs, setAdminChatDeliveryLogsState] = useState<AdminChatDeliveryLog[]>(
    storage.loadAdminChatDeliveryLogs
  );

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushingQueueRef = useRef<boolean>(false);
  const prevNetworkStatusRef = useRef<NetworkStatus>(networkStatus);

  const t = useCallback((key: string) => getTranslation(key, locale), [locale]);

  const triggerRobotReaction = useCallback(
    (state: RobotActivityState = "success", durationMs: number = 2200) => {
      if (transientRobotTimerRef.current) {
        clearTimeout(transientRobotTimerRef.current);
      }
      setTransientRobotState(state);
      transientRobotTimerRef.current = setTimeout(() => {
        setTransientRobotState(null);
      }, durationMs);
    },
    []
  );

  const showToast = useCallback(
    (msg: string) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToastMessage(msg);
      triggerRobotReaction("happy", 2800);
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null);
      }, 4500);
    },
    [triggerRobotReaction]
  );

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    storage.saveLocale(l);
    setChatMessagesState((prev) => {
      if (prev.length === 1 && prev[0]?.id === "msg_init") {
        return [{ ...prev[0], text: getTranslation("elonGreeting", l) }];
      }
      return prev;
    });
    triggerRobotReaction("success", 1600);
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.toggle("dark", themeMode === "dark");
      root.classList.toggle("light-theme", themeMode === "light");
      root.setAttribute("data-theme", themeMode);
      root.style.colorScheme = themeMode;
    }
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    storage.saveThemeMode(mode);
    triggerRobotReaction("success", 1800);
  }, [triggerRobotReaction]);

  const toggleThemeMode = useCallback(() => {
    setThemeModeState((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      storage.saveThemeMode(next);
      return next;
    });
    triggerRobotReaction("success", 1800);
  }, [triggerRobotReaction]);

  // Listen to global keyboard input across any form or chat composer so the robot reacts to typing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
        triggerRobotReaction("typing", 1400);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown, { passive: true });
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [triggerRobotReaction]);

  const robotState: RobotActivityState = (() => {
    if (isUserDictating) return "listening";
    if (isElonSpeaking) return "speaking";
    if (isChatLoading) return "thinking";
    if (transientRobotState) return transientRobotState;
    if (chatDraft.trim().length > 0 || isLetterDrafting) return "typing";
    if (aiResponseSentiment) return aiResponseSentiment;
    return "idle";
  })();

  const setChatDraft = useCallback((draft: string) => {
    setChatDraftState(draft);
    storage.saveChatDraft(draft);
  }, []);

  const saveCurrentLetterDraft = useCallback((draft: SavedLetterDraft | null) => {
    setSavedLetterDraftState(draft);
    storage.saveLetterDraft(draft);
  }, []);

  const queuedChatMessagesCount = chatMessages.filter(
    (m) => m.role === "user" && (m.status === "queued" || m.status === "sending")
  ).length;

  const queuedMessagesCount = queuedChatMessagesCount + pendingSyncActions.length;

  const isOnline = networkStatus === "online" && !isSimulatedOffline;

  // Trigger contextual alert when transitioning from online to offline
  const notifyConnectionLost = useCallback(() => {
    const inActiveChat =
      activeTab === "chat" &&
      (chatDraft.trim().length > 0 || isChatLoading || chatMessages.length > 1);
    const inActiveLetterDrafting =
      (activeTab === "templates" && isLetterDrafting) || savedLetterDraft !== null;

    if (activeTab === "templates" && isLetterDrafting) {
      showToast(getTranslation("netLostDuringLetterToast", locale));
    } else if (inActiveChat) {
      showToast(getTranslation("netLostDuringChatToast", locale));
    } else if (inActiveLetterDrafting) {
      showToast(getTranslation("netLostDuringLetterToast", locale));
    } else {
      showToast(getTranslation("netLostGeneralToast", locale));
    }
  }, [activeTab, chatDraft, isChatLoading, chatMessages.length, isLetterDrafting, savedLetterDraft, locale, showToast]);

  // Probe server connectivity via /api/health
  const checkConnectionNow = useCallback(async (): Promise<boolean> => {
    if (isSimulatedOffline) {
      setNetworkStatus("offline");
      return false;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setNetworkStatus("offline");
      return false;
    }

    setNetworkStatus((prev) => (prev === "offline" ? "reconnecting" : prev));

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        setNetworkStatus("online");
        setLastOnlineAt(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
        return true;
      }
      setNetworkStatus("offline");
      return false;
    } catch {
      setNetworkStatus("offline");
      return false;
    }
  }, [isSimulatedOffline]);

  // Toggle simulated offline mode (for testing mid-chat or mid-letter connection loss)
  const setIsSimulatedOffline = useCallback(
    (simulated: boolean) => {
      setIsSimulatedOfflineState(simulated);
      if (simulated) {
        setNetworkStatus("offline");
        notifyConnectionLost();
      } else {
        setNetworkStatus("reconnecting");
        setTimeout(() => {
          if (typeof navigator === "undefined" || navigator.onLine) {
            setNetworkStatus("online");
            setLastOnlineAt(
              new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            );
          } else {
            setNetworkStatus("offline");
          }
        }, 450);
      }
    },
    [notifyConnectionLost]
  );

  // Listen to browser online/offline events + periodic heartbeat
  useEffect(() => {
    const handleOffline = () => {
      setNetworkStatus("offline");
      notifyConnectionLost();
    };

    const handleOnline = () => {
      if (!isSimulatedOffline) {
        setNetworkStatus("reconnecting");
        checkConnectionNow();
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    const interval = setInterval(() => {
      if (!isSimulatedOffline) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          if (prevNetworkStatusRef.current === "online") {
            setNetworkStatus("offline");
            notifyConnectionLost();
          }
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, [isSimulatedOffline, checkConnectionNow, notifyConnectionLost]);

  // Flush queued chat messages when connection returns to online
  const retryQueuedMessages = useCallback(async () => {
    if (isFlushingQueueRef.current) return;
    const queuedList = chatMessages.filter((m) => m.role === "user" && m.status === "queued");
    if (queuedList.length === 0) return;

    isFlushingQueueRef.current = true;
    setIsChatLoading(true);

    try {
      let workingChat = chatMessages.map((m) =>
        m.role === "user" && m.status === "queued" ? { ...m, status: "sending" as const } : m
      );
      setChatMessagesState(workingChat);

      for (const queuedMsg of queuedList) {
        const assistantId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const assistantTimestamp = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const reply = await askElonAIStream(
          queuedMsg.text,
          workingChat,
          locale,
          {
            name: user.fullName,
            email: user.email,
            phone: user.phone,
            homeAddress: user.homeAddress,
            employer: user.employerName,
            companyNumber: user.companyNumber,
            employerAddress: user.employerAddress,
            jobTitle: user.jobTitle,
            startDate: user.startDate,
            hourlyRate: user.hourlyRate,
            hoursPerWeek: user.hoursPerWeek,
            contractType: user.contractType,
            accountId: user.accountId,
          },
          (partialText) => {
            const streamingMsg: ChatMessage = {
              id: assistantId,
              role: "assistant",
              text: partialText,
              timestamp: assistantTimestamp,
              threadId: queuedMsg.threadId,
              status: "sent",
            };
            const currentWithStream = [
              ...workingChat.map((m) =>
                m.id === queuedMsg.id ? { ...m, status: "sent" as const } : m
              ),
              streamingMsg,
            ];
            setChatMessagesState(currentWithStream);
          }
        );

        const assistantMsg: ChatMessage = {
          id: assistantId,
          role: "assistant",
          text: reply,
          timestamp: assistantTimestamp,
          threadId: queuedMsg.threadId,
          status: "sent",
        };

        workingChat = workingChat.map((m) =>
          m.id === queuedMsg.id ? { ...m, status: "sent" as const } : m
        );
        workingChat = [...workingChat, assistantMsg];
        setChatMessagesState(workingChat);
        storage.saveChatHistory(workingChat);
      }
    } finally {
      setIsChatLoading(false);
      isFlushingQueueRef.current = false;
    }
  }, [chatMessages, locale, user.fullName, user.employerName, user.jobTitle, user.hourlyRate]);

  // Remove a single pending sync action from the queue
  const removePendingSyncAction = useCallback(
    (id: string) => {
      setPendingSyncActionsState((prev) => {
        const next = prev.filter((item) => item.id !== id);
        try {
          localStorage.setItem("ask_elon_pending_sync_actions", JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(
        locale === "pl"
          ? "Usunięto operację z kolejki synchronizacji."
          : locale === "ro"
          ? "Acțiune eliminată din coada de sincronizare."
          : "Removed action from sync queue."
      );
    },
    [locale, showToast]
  );

  // Remove a single queued chat message
  const removeQueuedChatMessage = useCallback(
    (messageId: string) => {
      setChatMessagesState((prev) => {
        const next = prev.filter((m) => m.id !== messageId);
        storage.saveChatHistory(next);
        return next;
      });
      showToast(
        locale === "pl"
          ? "Usunięto oczekującą wiadomość z kolejki."
          : locale === "ro"
          ? "Mesaj în așteptare eliminat din coadă."
          : "Removed queued chat message."
      );
    },
    [locale, showToast]
  );

  // Flush both queued chat messages and pendingSyncActions
  const syncPendingActionsNow = useCallback(async () => {
    if (isSimulatedOffline) {
      setIsSimulatedOfflineState(false);
      setNetworkStatus("online");
    }

    const connected = isSimulatedOffline ? true : await checkConnectionNow();
    if (!connected) {
      showToast(
        locale === "pl"
          ? "Brak połączenia. Akcje pozostają bezpiecznie w kolejce do czasu powrotu sieci."
          : locale === "ro"
          ? "Fără conexiune. Acțiunile rămân în coadă până la revenirea rețelei."
          : "Offline. Actions remain safely queued until connection is restored."
      );
      return;
    }

    // Mark pending actions as syncing briefly
    if (pendingSyncActions.length > 0) {
      setPendingSyncActionsState((prev) =>
        prev.map((item) => ({ ...item, status: "syncing" as const }))
      );
    }

    await retryQueuedMessages();

    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    savePendingSyncActions([]);
    setOfflineSettingsState((prev) => {
      const next = { ...prev, lastSyncedAt: nowTime };
      try {
        localStorage.setItem("ask_elon_offline_settings", JSON.stringify(next));
      } catch {}
      return next;
    });

    showToast(
      locale === "pl"
        ? "Zsynchronizowano wszystkie oczekujące operacje z chmurą ask Elon!"
        : locale === "ro"
        ? "Toate acțiunile în așteptare au fost sincronizate!"
        : "All pending actions synced successfully!"
    );
  }, [
    isSimulatedOffline,
    checkConnectionNow,
    pendingSyncActions.length,
    retryQueuedMessages,
    savePendingSyncActions,
    locale,
    showToast,
  ]);

  const updateOfflineSettings = useCallback(
    (updates: Partial<OfflineSettingsConfig>) => {
      setOfflineSettingsState((prev) => {
        const next: OfflineSettingsConfig = { ...prev, ...updates };
        try {
          localStorage.setItem("ask_elon_offline_settings", JSON.stringify(next));
        } catch {}
        return next;
      });

      if (updates.backgroundSyncEnabled !== undefined) {
        showToast(
          updates.backgroundSyncEnabled
            ? locale === "pl"
              ? "Synchronizacja w tle włączona — kolejka wyśle się automatycznie po odzyskaniu sieci."
              : locale === "ro"
              ? "Sincronizare în fundal activată."
              : "Background sync enabled — queued actions will auto-sync when online."
            : locale === "pl"
            ? "Synchronizacja w tle wstrzymana — operacje czekają w kolejce na ręczne zatwierdzenie."
            : locale === "ro"
            ? "Sincronizare în fundal întreruptă."
            : "Background sync paused — actions will stay queued until manually synced."
        );
      }
    },
    [locale, showToast]
  );

  // Enqueue a realistic offline action so user can test queue management in MenuDrawer
  const enqueueSampleOfflineAction = useCallback(() => {
    const sampleOptions: Omit<PendingSyncAction, "id" | "createdAt" | "status">[] = [
      {
        type: "letter_save",
        title: `Pismo do HR: Section 13 ERA 1996 (${user.employerName || "UK Employer"})`,
        subtitle: "Pisma Elona · Oczekuje na wysyłkę po przywróceniu połączenia",
      },
      {
        type: "case_create",
        title: `Aktualizacja akt sprawy: Niewypłacone nadgodziny i urlop`,
        subtitle: "Sprawy · Zapisano lokalnie w pamięci urządzenia",
      },
      {
        type: "note_save",
        title: "Notatka służbowa: Potwierdzenie godzin zmiany z przełożonym",
        subtitle: "Notatnik i dowody · Oczekuje na synchronizację w tle",
      },
      {
        type: "profile_sync",
        title: `Aktualizacja danych pracodawcy (${user.employerName || "Warehouse UK"})`,
        subtitle: "Profil użytkownika · Gotowe do synchronizacji",
      },
    ];
    const picked = sampleOptions[pendingSyncActions.length % sampleOptions.length];
    appendPendingSyncAction(picked);
    showToast(
      locale === "pl"
        ? "Dodano operację do kolejki oczekującej na synchronizację!"
        : locale === "ro"
        ? "Acțiune adăugată în coada de sincronizare!"
        : "Added action to pending sync queue!"
    );
  }, [appendPendingSyncAction, pendingSyncActions.length, user.employerName, locale, showToast]);

  // Watch networkStatus transitions for restoration alerts and automatic queue flushing
  useEffect(() => {
    const prev = prevNetworkStatusRef.current;
    if (prev !== "online" && networkStatus === "online" && !isSimulatedOffline) {
      const hasQueuedChat = chatMessages.some((m) => m.role === "user" && m.status === "queued");
      const hasPendingActions = pendingSyncActions.length > 0;

      if (hasQueuedChat || hasPendingActions) {
        if (offlineSettings.backgroundSyncEnabled) {
          showToast(getTranslation("netRestoredWithQueueToast", locale));
          retryQueuedMessages();
          const nowTime = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          savePendingSyncActions([]);
          setOfflineSettingsState((prevCfg) => {
            const next = { ...prevCfg, lastSyncedAt: nowTime };
            try {
              localStorage.setItem("ask_elon_offline_settings", JSON.stringify(next));
            } catch {}
            return next;
          });
        } else {
          showToast(
            locale === "pl"
              ? "Połączenie przywrócone. Operacje oczekują w kolejce (Synchronizacja w tle jest wyłączona)."
              : locale === "ro"
              ? "Conexiune restabilită. Acțiunile așteaptă în coadă (Sincronizarea în fundal este oprită)."
              : "Connection restored. Pending actions remain queued (Background Sync is off)."
          );
        }
      } else {
        showToast(getTranslation("netRestoredToast", locale));
      }
    }
    prevNetworkStatusRef.current = networkStatus;
  }, [
    networkStatus,
    isSimulatedOffline,
    chatMessages,
    pendingSyncActions.length,
    offlineSettings.backgroundSyncEnabled,
    locale,
    showToast,
    retryQueuedMessages,
    savePendingSyncActions,
  ]);

  // Sync user profile from server on mount (if present on server)
  useEffect(() => {
    const accountKey = user.accountId || user.id;
    if (!accountKey || isSimulatedOffline) return;
    let cancelled = false;
    fetch(`/api/profile/${encodeURIComponent(accountKey)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.ok && data.profile) {
          setUserState((prev) => {
            const merged = { ...prev, ...data.profile };
            storage.saveUserProfile(merged);
            return merged;
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const updateUser = (updates: Partial<UserProfile>) => {
    let updatedProfileSnapshot: UserProfile | null = null;
    setUserState((prev) => {
      const next: UserProfile = {
        ...prev,
        ...updates,
        isPro:
          updates.free_access !== undefined
            ? updates.free_access
              ? true
              : updates.isPro ?? prev.isPro
            : updates.isPro ?? prev.isPro,
      };
      updatedProfileSnapshot = next;
      storage.saveUserProfile(next);

      // Sync active user into adminUsers table
      setAdminUsersState((prevUsers) => {
        const updatedList = prevUsers.map((u) =>
          u.id === next.id
            ? {
                ...u,
                ...next,
                city: next.city || u.city || "Dartford, Kent",
                registeredAt: next.registeredAt || u.registeredAt || "2026-03-15",
                free_access: Boolean(next.free_access ?? u.free_access),
                subscriptionStatus: next.free_access
                  ? ("free_access" as const)
                  : next.isPro
                  ? ("active_pro" as const)
                  : ("free" as const),
              }
            : u
        );
        storage.saveAdminUsers(updatedList);
        return updatedList;
      });

      return next;
    });

    if (updatedProfileSnapshot) {
      if (isOnline) {
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProfileSnapshot),
        }).catch(() => {
          appendPendingSyncAction({
            type: "profile_sync",
            title:
              locale === "pl"
                ? "Synchronizacja profilu użytkownika"
                : locale === "ro"
                ? "Sincronizare profil utilizator"
                : "User profile sync",
            subtitle:
              locale === "pl"
                ? "Oczekuje na połączenie z serwerem"
                : "Awaiting server connection",
          });
        });
      } else {
        appendPendingSyncAction({
          type: "profile_sync",
          title:
            locale === "pl"
              ? "Synchronizacja profilu użytkownika"
              : locale === "ro"
              ? "Sincronizare profil utilizator"
              : "User profile sync",
          subtitle:
            locale === "pl"
              ? "Zapisano lokalnie — wyśle się po odzyskaniu sieci"
              : "Saved locally — queued for server sync",
        });
      }
    }
    showToast(t("profileSavedToast"));
  };

  const addCase = (newCaseData: Omit<WorkplaceCase, "id" | "createdAt" | "updatedAt" | "notes">): string => {
    const id = `case_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const created: WorkplaceCase = {
      ...newCaseData,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
      notes: []
    };
    const updated = [created, ...cases];
    setCasesState(updated);
    storage.saveCases(updated);

    // Increment formalCasesCount in analytics
    setAdminUsersState((prevUsers) => {
      const nextList = prevUsers.map((u) =>
        u.id === user.id ? { ...u, formalCasesCount: (u.formalCasesCount || 0) + 1 } : u
      );
      storage.saveAdminUsers(nextList);
      return nextList;
    });

    if (!isOnline || !offlineSettings.backgroundSyncEnabled) {
      appendPendingSyncAction({
        type: "case_create",
        title: `Nowa sprawa: ${created.title}`,
        subtitle: `Sprawy · ${created.employer} (${created.sector})`,
      });
    }

    showToast(t("createCaseBtn") + " - " + created.title);
    return id;
  };

  const updateCaseStatus = (id: string, status: "open" | "resolved") => {
    const updated = cases.map((c) => (c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c));
    setCasesState(updated);
    storage.saveCases(updated);
  };

  const addCaseNote = (caseId: string, noteText: string) => {
    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
    const newNote = {
      id: `cn_${Date.now()}`,
      text: noteText,
      date: nowStr,
      author: user.fullName || "Artur Kowalski"
    };
    const updated = cases.map((c) =>
      c.id === caseId ? { ...c, updatedAt: new Date().toISOString(), notes: [...c.notes, newNote] } : c
    );
    setCasesState(updated);
    storage.saveCases(updated);
    showToast(t("caseNotes"));
  };

  const startChatAboutCase = (caseItem: WorkplaceCase) => {
    setActiveCaseId(caseItem.id);
    setActiveTab("chat");
    const promptText = `Chciałbym porozmawiać o mojej sprawie: "${caseItem.title}" u pracodawcy ${caseItem.employer} (Branża: ${caseItem.sector}). Opis sprawy: ${caseItem.description}`;

    if (!isOnline) {
      const queuedMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "user",
        text: promptText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        threadId: caseItem.id,
        status: "queued"
      };
      const newChat = [...chatMessages, queuedMsg];
      setChatMessagesState(newChat);
      storage.saveChatHistory(newChat);
      showToast(t("netLostDuringChatToast"));
      return;
    }

    const promptMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      threadId: caseItem.id,
      status: "sent"
    };
    const newChat = [...chatMessages, promptMsg];
    setChatMessagesState(newChat);
    storage.saveChatHistory(newChat);

    // Trigger AI reaction with live streaming
    const replyId = `msg_${Date.now() + 1}`;
    const replyTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setIsChatLoading(true);
    askElonAIStream(
      promptMsg.text,
      newChat,
      locale,
      {
        name: user.fullName,
        employer: caseItem.employer,
        jobTitle: user.jobTitle,
        hourlyRate: user.hourlyRate,
      },
      (partialText) => {
        setChatMessagesState([
          ...newChat,
          {
            id: replyId,
            role: "assistant",
            text: partialText,
            timestamp: replyTimestamp,
            threadId: caseItem.id,
            status: "sent",
          },
        ]);
      }
    )
      .then((reply) => {
        const replyMsg: ChatMessage = {
          id: replyId,
          role: "assistant",
          text: reply,
          timestamp: replyTimestamp,
          threadId: caseItem.id,
          status: "sent",
        };
        const finalChat = [...newChat, replyMsg];
        setChatMessagesState(finalChat);
        storage.saveChatHistory(finalChat);
        const detectedSentiment = analyzeAiResponseSentiment(reply, promptMsg.text);
        if (detectedSentiment) {
          setAiResponseSentiment(detectedSentiment);
          triggerRobotReaction(detectedSentiment, 6500);
        }
      })
      .finally(() => setIsChatLoading(false));
  };

  const saveSentLetter = (letterData: Omit<SentLetter, "id" | "date">, silent: boolean = false) => {
    const classified = classifySentLetter(letterData);
    setSentLettersState((prev) => {
      // Avoid duplicate saves if identical content is already at the top
      if (prev.length > 0 && prev[0].content === letterData.content) {
        if (!silent) showToast(t("saveToSent"));
        return prev;
      }
      const newSent: SentLetter = {
        ...letterData,
        id: `sent_${Date.now()}`,
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        primaryTag: classified.primaryTag,
        tags: classified.tags,
        statutoryReference: letterData.statutoryReference || classified.statutoryReference,
      };
      const updated = [newSent, ...prev];
      storage.saveSentLetters(updated);
      return updated;
    });
    if (!isOnline || !offlineSettings.backgroundSyncEnabled) {
      appendPendingSyncAction({
        type: "letter_save",
        title: `Pismo prawne: ${letterData.title}`,
        subtitle: `Pisma Elona · Odbiorca: ${letterData.recipient}`,
      });
    }
    if (!silent) {
      showToast(t("saveToSent"));
    }
  };

  const removeSentLetter = (id: string) => {
    setSentLettersState((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      storage.saveSentLetters(updated);
      return updated;
    });
  };

  const toggleSentLetterTag = (id: string, tag: SentLetterCategoryTag) => {
    setSentLettersState((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        const currentTags = item.tags && item.tags.length > 0 ? [...item.tags] : [item.primaryTag || "Grievance"];
        let nextTags: SentLetterCategoryTag[];
        if (currentTags.includes(tag)) {
          // If clicking an existing secondary tag, promote it to primaryTag; if already primaryTag and >1 tag, remove it
          if (item.primaryTag === tag && currentTags.length > 1) {
            nextTags = currentTags.filter((t) => t !== tag);
          } else {
            nextTags = [tag, ...currentTags.filter((t) => t !== tag)];
          }
        } else {
          nextTags = [item.primaryTag || currentTags[0], ...currentTags.filter((t) => t !== (item.primaryTag || currentTags[0])), tag];
        }
        return {
          ...item,
          primaryTag: nextTags[0],
          tags: nextTags,
        };
      });
      storage.saveSentLetters(updated);
      return updated;
    });
  };

  const addForumPost = (
    title: string,
    content: string,
    tag: string,
    extra?: {
      whereToGo?: string;
      whatToSelect?: string[];
      whatYouGet?: string;
      statuteOrFeatureBadge?: string;
    }
  ) => {
    const newPost: ForumPost = {
      id: `post_${Date.now()}`,
      author: user.fullName || "Worker_UK",
      authorRole: `${user.jobTitle || "Worker"} · ask Elon`,
      title,
      content,
      tag,
      statuteOrFeatureBadge: extra?.statuteOrFeatureBadge,
      whereToGo: extra?.whereToGo,
      whatToSelect: extra?.whatToSelect,
      whatYouGet: extra?.whatYouGet,
      upvotes: 1,
      userUpvoted: true,
      createdAt: new Date().toISOString(),
      comments: [],
    };
    const updated = [newPost, ...forumPosts];
    setForumPostsState(updated);
    storage.saveForumPosts(updated);
    showToast(t("publishPost"));
  };

  const upvoteForumPost = (postId: string) => {
    const updated = forumPosts.map((p) => {
      if (p.id === postId) {
        const isUpvoted = p.userUpvoted;
        return {
          ...p,
          upvotes: isUpvoted ? p.upvotes - 1 : p.upvotes + 1,
          userUpvoted: !isUpvoted
        };
      }
      return p;
    });
    setForumPostsState(updated);
    storage.saveForumPosts(updated);
  };

  const addForumComment = (postId: string, commentText: string) => {
    const newComment = {
      id: `c_${Date.now()}`,
      author: user.fullName || "Artur Kowalski",
      text: commentText,
      createdAt: new Date().toISOString()
    };
    const updated = forumPosts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    setForumPostsState(updated);
    storage.saveForumPosts(updated);
  };

  const addDocument = (doc: Omit<UserDocument, "id" | "uploadDate">): UserDocument => {
    const resolvedTag: DocumentCategoryTag =
      doc.categoryTag || getDefaultCategoryTagForType(doc.type, doc.mimeType);
    const newDoc: UserDocument = {
      ...doc,
      categoryTag: resolvedTag,
      type: doc.type || mapCategoryTagToDocType(resolvedTag),
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      uploadDate: new Date().toISOString().slice(0, 10),
    };
    const updated = [newDoc, ...documents];
    setDocumentsState(updated);
    storage.saveDocuments(updated);
    showToast(`[${resolvedTag}] ${newDoc.name}`);
    return newDoc;
  };

  const updateDocumentCategoryTag = (id: string, categoryTag: DocumentCategoryTag) => {
    const updated = documents.map((d) =>
      d.id === id
        ? {
            ...d,
            categoryTag,
            type: mapCategoryTagToDocType(categoryTag),
            detectionMeta: d.detectionMeta
              ? {
                  ...d.detectionMeta,
                  categoryTag,
                  mappedType: mapCategoryTagToDocType(categoryTag),
                }
              : undefined,
          }
        : d
    );
    setDocumentsState(updated);
    storage.saveDocuments(updated);
    showToast(
      locale === "pl"
        ? `Zmieniono kategorię na: ${categoryTag}`
        : locale === "ro"
        ? `Categorie actualizată: ${categoryTag}`
        : `Updated category tag to: ${categoryTag}`
    );
  };

  const removeDocument = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocumentsState(updated);
    storage.saveDocuments(updated);
  };

  const runDocumentAudit = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;

    const tag = doc.categoryTag || getDefaultCategoryTagForType(doc.type, doc.mimeType);
    const snippet = doc.detectionMeta?.contentSummary
      ? ` (${doc.detectionMeta.contentSummary})`
      : "";

    let auditRes;
    if (tag === "PDF Paystub" || tag === "Image Paystub") {
      auditRes = {
        valid: false,
        summary: `Audyt [${tag}] ukończony${snippet}. Sprawdzono stawkę National Living Wage, potrącenia PPE oraz proporcję holiday pay (12.07%).`,
        calculatedHourly: Math.max(12.21, user.hourlyRate || 12.45),
        holidayPayStatus: "Wymaga weryfikacji (12.07%)",
        minimumWageCompliance: true,
        items: [
          {
            issue: "Weryfikacja potrąceń za odzież roboczą / PPE lub narzędzia",
            severity: "error" as const,
            recommendation:
              "Zgodnie z s.9 Health & Safety at Work etc. Act 1974 oraz s.13 ERA 1996, pracodawca nie może potrącać kosztów wymaganego PPE.",
          },
          {
            issue: "Kontrola nadgodzin, przerw 20-min i stawki nocnej",
            severity: "warning" as const,
            recommendation:
              "W razie brakujących godzin wygeneruj formalne żądanie Section 13 ERA 1996 w zakładce Pisma UK.",
          },
        ],
      };
    } else if (tag === "Employment Contract") {
      auditRes = {
        valid: true,
        summary: `Audyt [${tag}] ukończony${snippet}. Zweryfikowano obowiązkowe klauzule Section 1 Statement (ERA 1996).`,
        calculatedHourly: user.hourlyRate || 12.21,
        holidayPayStatus: "Minimum 5.6 tyg. rocznie",
        minimumWageCompliance: true,
        items: [
          {
            issue: "Okres wypowiedzenia i godziny gwarantowane (Section 1 ERA 1996)",
            severity: "info" as const,
            recommendation:
              "Sprawdź, czy zapis o miejscu pracy, stawce, wypowiedzeniu i procedurze skargowej (ACAS) jest kompletny.",
          },
          {
            issue: "Ewentualne klauzule potrąceń z wynagrodzenia",
            severity: "warning" as const,
            recommendation:
              "Nawet pisemna klauzula potrąceń w umowie nie może obniżyć wypłaty poniżej National Living Wage (poza wyjątkami ustawowymi).",
          },
        ],
      };
    } else if (tag === "Letter to HR" || tag === "Disciplinary / Grievance") {
      auditRes = {
        valid: false,
        summary: `Audyt [${tag}] ukończony${snippet}. Oceniono zgodność proceduralną z ACAS Code of Practice No. 1.`,
        calculatedHourly: user.hourlyRate || 12.21,
        holidayPayStatus: "Termin ACAS: 3 mies. - 1 dzień",
        minimumWageCompliance: true,
        items: [
          {
            issue: "Prawo do osoby towarzyszącej na spotkaniu (Section 10 ERA 1999)",
            severity: "warning" as const,
            recommendation:
              "W pismach dyscyplinarnych i skargowych masz ustawowe prawo zabrać przedstawiciela związku zawodowego lub współpracownika.",
          },
          {
            issue: "Biegnący termin do ACAS Early Conciliation",
            severity: "error" as const,
            recommendation:
              "Pamiętaj o nieprzekraczalnym terminie 3 miesięcy minus 1 dzień od zdarzenia lub daty zwolnienia na zgłoszenie do ACAS.",
          },
        ],
      };
    } else if (tag === "Sick Note / Fit Note") {
      auditRes = {
        valid: true,
        summary: `Audyt [${tag}] ukończony${snippet}. Sprawdzono uprawnienia do Statutory Sick Pay (SSP) i formę SSP1.`,
        calculatedHourly: user.hourlyRate || 12.21,
        holidayPayStatus: "Urlop nadal nalicza się na L4",
        minimumWageCompliance: true,
        items: [
          {
            issue: "Ochrona przed odmową wypłaty chorobowego (Form SSP1)",
            severity: "info" as const,
            recommendation:
              "Jeśli pracodawca odmawia SSP, musi wydać pisemny formularz HMRC SSP1 w ciągu 7 dni. Urlop wypoczynkowy nadal się nalicza.",
          },
        ],
      };
    } else {
      auditRes = {
        valid: true,
        summary: `Audyt [${tag}] ukończony${snippet}. Dokument zarchiwizowany i powiązany z aktami pracownika.`,
        calculatedHourly: user.hourlyRate || 12.21,
        holidayPayStatus: "Zabezpieczono dowód",
        minimumWageCompliance: true,
        items: [
          {
            issue: `Zabezpieczenie materiału dowodowego (${tag})`,
            severity: "info" as const,
            recommendation:
              "Dokument może służyć jako załącznik w procedurze ACAS Grievance lub Subject Access Request (UK GDPR Art. 15).",
          },
        ],
      };
    }

    const updated = documents.map((d) => (d.id === id ? { ...d, auditResult: auditRes } : d));
    setDocumentsState(updated);
    storage.saveDocuments(updated);
    showToast(`Audyt [${tag}] zakończony!`);
  };

  const addNote = (title: string, description: string, category: string) => {
    const newNote: WorkplaceNote = {
      id: `note_${Date.now()}`,
      title,
      description,
      category,
      date: new Date().toISOString().slice(0, 10)
    };
    const updated = [newNote, ...notes];
    setNotesState(updated);
    storage.saveNotes(updated);
    if (!isOnline || !offlineSettings.backgroundSyncEnabled) {
      appendPendingSyncAction({
        type: "note_save",
        title: `Notatka: ${title}`,
        subtitle: `Notatnik i dowody · Kategoria: ${category}`,
      });
    }
    showToast(t("tabNotes") + " - " + title);
  };

  const removeNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotesState(updated);
    storage.saveNotes(updated);
  };

  const sendChatMessage = async (text: string, attachedDocIds?: string[]) => {
    if (!text.trim() || isChatLoading) return;

    // Clear saved composer draft since message is now submitted
    setChatDraft("");

    // If offline or simulated offline, queue the message locally for auto-sync
    if (!isOnline) {
      const queuedUserMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "user",
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        threadId: activeCaseId || undefined,
        status: "queued"
      };
      const updatedOfflineChat = [...chatMessages, queuedUserMsg];
      setChatMessagesState(updatedOfflineChat);
      storage.saveChatHistory(updatedOfflineChat);
      showToast(t("netLostDuringChatToast"));
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      threadId: activeCaseId || undefined,
      status: "sent"
    };
    const newMessages = [...chatMessages, userMsg];
    setChatMessagesState(newMessages);
    storage.saveChatHistory(newMessages);
    setIsChatLoading(true);

    // Increment user dailyQueriesCount and chatQueriesCount in analytics
    setAdminUsersState((prevUsers) => {
      const nextList = prevUsers.map((u) =>
        u.id === user.id
          ? {
              ...u,
              dailyQueriesCount: (u.dailyQueriesCount || 0) + 1,
              chatQueriesCount: (u.chatQueriesCount || 0) + 1,
            }
          : u
      );
      storage.saveAdminUsers(nextList);
      return nextList;
    });

    const assistantId = `msg_${Date.now() + 1}`;
    const assistantTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const resolvedAttachedDocs = (
      attachedDocIds && attachedDocIds.length > 0
        ? documents.filter((d) => attachedDocIds.includes(d.id))
        : []
    ).map((d) => ({
      name: d.name,
      categoryTag: d.categoryTag,
      detectedSignals: d.detectionMeta?.detectedSignals,
      contentSummary: d.detectionMeta?.contentSummary || d.auditResult?.summary,
      extractedTextSnippet: d.detectionMeta?.extractedTextSnippet,
    }));

    try {
      const reply = await askElonAIStream(
        userMsg.text,
        newMessages,
        locale,
        {
          name: user.fullName,
          email: user.email,
          phone: user.phone,
          homeAddress: user.homeAddress,
          employer: user.employerName,
          companyNumber: user.companyNumber,
          employerAddress: user.employerAddress,
          jobTitle: user.jobTitle,
          startDate: user.startDate,
          hourlyRate: user.hourlyRate,
          hoursPerWeek: user.hoursPerWeek,
          contractType: user.contractType,
          accountId: user.accountId,
          attachedDocuments: resolvedAttachedDocs.length > 0 ? resolvedAttachedDocs : undefined,
        },
        (partialText) => {
          // Do not overwrite if user switched to simulated offline mid-stream
          if (isSimulatedOffline || (typeof navigator !== "undefined" && !navigator.onLine)) {
            return;
          }
          setChatMessagesState([
            ...newMessages,
            {
              id: assistantId,
              role: "assistant",
              text: partialText,
              timestamp: assistantTimestamp,
              threadId: activeCaseId || undefined,
              status: "sent",
            },
          ]);
        }
      );

      // Check if user switched to offline while waiting for AI response
      if (isSimulatedOffline || (typeof navigator !== "undefined" && !navigator.onLine)) {
        const queuedFallback = newMessages.map((m) =>
          m.id === userMsg.id ? { ...m, status: "queued" as const } : m
        );
        setChatMessagesState(queuedFallback);
        storage.saveChatHistory(queuedFallback);
        setNetworkStatus("offline");
        showToast(t("netLostDuringChatToast"));
        return;
      }

      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        text: reply,
        timestamp: assistantTimestamp,
        threadId: activeCaseId || undefined,
        status: "sent",
      };
      const finalMessages = [...newMessages, assistantMsg];
      setChatMessagesState(finalMessages);
      storage.saveChatHistory(finalMessages);

      // Evaluate sentiment of the AI's generated response ('happy' vs 'concerned')
      const detectedSentiment = analyzeAiResponseSentiment(reply, userMsg.text);
      if (detectedSentiment) {
        setAiResponseSentiment(detectedSentiment);
        triggerRobotReaction(detectedSentiment, 6500);
      }

      // 1. Automatically extract any personal/workplace details the user provided in chat and update UserProfile
      const profileUpdates = extractProfileUpdatesFromChat(userMsg.text, reply);
      let effectiveUser = user;
      if (Object.keys(profileUpdates).length > 0) {
        effectiveUser = { ...user, ...profileUpdates };
        updateUser(profileUpdates);
        triggerRobotReaction("happy", 4500);
        showToast(
          locale === "pl"
            ? "Elon uzupełnił Twój profil o nowe dane z rozmowy!"
            : locale === "ro"
            ? "Elon a actualizat profilul tău cu datele din conversație!"
            : "Elon updated your profile with details from the chat!"
        );
      }

      // 2. Automatically save the generated 100% completed English document into the Pisma tab (sentLetters)
      const generatedDoc = buildPersonalizedEnglishLetterForChat(
        userMsg.text,
        reply,
        effectiveUser
      );
      saveSentLetter(
        {
          templateId: generatedDoc.templateId,
          title: generatedDoc.titleEn,
          recipient: effectiveUser.employerName || "UK Employer",
          content: generatedDoc.contentEn,
        },
        true
      );
    } catch {
      // Mark message as queued so it retries automatically when connection recovers
      const queuedMessages = newMessages.map((m) =>
        m.id === userMsg.id ? { ...m, status: "queued" as const } : m
      );
      setChatMessagesState(queuedMessages);
      storage.saveChatHistory(queuedMessages);
      setNetworkStatus("offline");
      showToast(t("netLostDuringChatToast"));
    } finally {
      setIsChatLoading(false);
    }
  };

  // Helper to archive a conversation into the 10-recent-unsaved-conversations list
  const archiveConversationToUnsavedHistory = useCallback(
    (sessionId: string, messagesToArchive: ChatMessage[], draftText: string = "") => {
      if (isCurrentChatSavedAsCaseRef.current) return;

      let effectiveMessages = [...messagesToArchive];
      const hasUserMsg = effectiveMessages.some((m) => m.role === "user" && m.text.trim().length > 0);

      // If exiting with an unsent draft and no user messages yet, include the draft as a user message
      if (!hasUserMsg && draftText.trim().length > 0) {
        effectiveMessages.push({
          id: `msg_draft_${Date.now()}`,
          role: "user",
          text: draftText.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "queued",
        });
      }

      if (!effectiveMessages.some((m) => m.role === "user" && m.text.trim().length > 0)) {
        return;
      }

      setRecentUnsavedChatsState((prev) =>
        storage.upsertRecentUnsavedChat(prev, sessionId, effectiveMessages)
      );
    },
    []
  );

  // Live sync: keep active unsaved conversation updated in the 10-item history as messages arrive
  useEffect(() => {
    if (isCurrentChatSavedAsCaseRef.current) return;
    const hasUserMsg = chatMessages.some((m) => m.role === "user" && m.text.trim().length > 0);
    if (!hasUserMsg) return;

    setRecentUnsavedChatsState((prev) =>
      storage.upsertRecentUnsavedChat(prev, activeUnsavedChatId, chatMessages)
    );
  }, [chatMessages, activeUnsavedChatId]);

  // Automatically save unsaved conversation to history upon exiting the app (beforeunload, pagehide, visibilitychange)
  const latestChatRef = useRef({
    sessionId: activeUnsavedChatId,
    messages: chatMessages,
    draft: chatDraft,
  });
  useEffect(() => {
    latestChatRef.current = {
      sessionId: activeUnsavedChatId,
      messages: chatMessages,
      draft: chatDraft,
    };
  }, [activeUnsavedChatId, chatMessages, chatDraft]);

  useEffect(() => {
    const handleAppExitSave = () => {
      try {
        if (isCurrentChatSavedAsCaseRef.current) return;
        const { sessionId, messages, draft } = latestChatRef.current;
        let effectiveMessages = [...messages];
        const hasUserMsg = effectiveMessages.some((m) => m.role === "user" && m.text.trim().length > 0);

        if (!hasUserMsg && draft.trim().length > 0) {
          effectiveMessages.push({
            id: `msg_draft_${Date.now()}`,
            role: "user",
            text: draft.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "queued",
          });
        }

        if (effectiveMessages.some((m) => m.role === "user" && m.text.trim().length > 0)) {
          const currentStored = storage.loadRecentUnsavedChats();
          storage.upsertRecentUnsavedChat(currentStored, sessionId, effectiveMessages);
        }
      } catch {
        // Ignore storage errors during unload/visibilitychange
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleAppExitSave();
      }
    };

    window.addEventListener("beforeunload", handleAppExitSave);
    window.addEventListener("pagehide", handleAppExitSave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleAppExitSave);
      window.removeEventListener("pagehide", handleAppExitSave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const clearChatMessages = () => {
    // 1. Archive current unsaved conversation before resetting
    archiveConversationToUnsavedHistory(activeUnsavedChatId, chatMessages, chatDraft);

    // 2. Start a fresh session with the clean welcome state
    const nextSessionId = `unsaved_${Date.now()}`;
    setActiveUnsavedChatId(nextSessionId);
    isCurrentChatSavedAsCaseRef.current = false;

    const freshWelcomeMsg: ChatMessage[] = [
      {
        id: "msg_init",
        role: "assistant",
        text: getTranslation("elonGreeting", locale),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent"
      }
    ];
    setChatMessagesState(freshWelcomeMsg);
    storage.saveChatHistory([]);
    setChatDraft("");
    setActiveCaseId(null);
    showToast(t("clearChat"));
  };

  const deleteChatMessage = (msgId: string) => {
    setChatMessagesState((prev) => {
      const remaining = prev.filter((m) => m.id !== msgId);
      const hasNonInitMessages = remaining.some((m) => m.id !== "msg_init");
      if (!hasNonInitMessages || remaining.length === 0) {
        const freshWelcomeMsg: ChatMessage[] = [
          {
            id: "msg_init",
            role: "assistant",
            text: getTranslation("elonGreeting", locale),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "sent",
          },
        ];
        storage.saveChatHistory([]);
        return freshWelcomeMsg;
      }
      storage.saveChatHistory(remaining);
      return remaining;
    });
  };

  const toggleFlagChatMessage = (msgId: string): boolean => {
    let nextFlagState = false;
    setChatMessagesState((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== msgId) return m;
        nextFlagState = !m.flaggedAsIncorrect;
        return { ...m, flaggedAsIncorrect: nextFlagState };
      });
      storage.saveChatHistory(updated);
      return updated;
    });
    return nextFlagState;
  };

  const pinChatMessageToCase = (msgId: string, explicitCaseId?: string): WorkplaceCase | null => {
    const targetMsg = chatMessages.find((m) => m.id === msgId);
    if (!targetMsg) return null;

    const extractedText =
      targetMsg.role === "assistant"
        ? stripEmbeddedEnglishLetter(targetMsg.text).trim()
        : targetMsg.text.trim();
    if (!extractedText) return null;

    const nowFormatted = new Date().toISOString().replace("T", " ").slice(0, 16);
    const senderName =
      targetMsg.role === "assistant"
        ? "Elon · AI"
        : user.fullName || (locale === "pl" ? "Pracownik" : "Worker");

    // Resolve target case: explicitCaseId -> message's threadId -> activeCaseId -> first open case -> first case
    const preferredCaseId = explicitCaseId || targetMsg.threadId || activeCaseId;
    let resolvedCase: WorkplaceCase | undefined = preferredCaseId
      ? cases.find((c) => c.id === preferredCaseId)
      : undefined;
    if (!resolvedCase) {
      resolvedCase = cases.find((c) => c.status === "open") || cases[0];
    }

    // If no cases exist at all, create one automatically for this workspace
    if (!resolvedCase) {
      const nowIso = new Date().toISOString();
      const newPinItem: CasePinnedItem = {
        id: `pin_${Date.now()}`,
        messageId: targetMsg.id,
        role: targetMsg.role,
        senderName,
        text: extractedText,
        pinnedAt: nowFormatted,
      };
      const autoCase: WorkplaceCase = {
        id: `case_${Date.now()}`,
        title:
          extractedText.length > 64
            ? `${extractedText.slice(0, 62).trim()}…`
            : extractedText,
        description: extractedText,
        sector: user.industry || "Logistyka / Magazyn",
        employer: user.employerName || "UK Employer",
        status: "open",
        priority: "high",
        createdAt: nowIso,
        updatedAt: nowIso,
        notes: [],
        pinnedItems: [newPinItem],
      };
      const nextCases = [autoCase, ...cases];
      setCasesState(nextCases);
      storage.saveCases(nextCases);
      setActiveCaseId(autoCase.id);
      setChatMessagesState((prev) => {
        const next = prev.map((m) =>
          m.id === msgId ? { ...m, pinnedToCaseId: autoCase.id } : m
        );
        storage.saveChatHistory(next);
        return next;
      });
      return autoCase;
    }

    const targetId = resolvedCase.id;
    const existingPinned = resolvedCase.pinnedItems || [];
    const filteredPinned = existingPinned.filter((p) => p.messageId !== targetMsg.id);
    const newPinnedEntry: CasePinnedItem = {
      id: `pin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      messageId: targetMsg.id,
      role: targetMsg.role,
      senderName,
      text: extractedText,
      pinnedAt: nowFormatted,
    };

    const updatedCase: WorkplaceCase = {
      ...resolvedCase,
      updatedAt: new Date().toISOString(),
      pinnedItems: [newPinnedEntry, ...filteredPinned],
    };

    const updatedCases = cases.map((c) => (c.id === targetId ? updatedCase : c));
    setCasesState(updatedCases);
    storage.saveCases(updatedCases);
    setActiveCaseId(targetId);

    setChatMessagesState((prev) => {
      const next = prev.map((m) =>
        m.id === msgId ? { ...m, pinnedToCaseId: targetId } : m
      );
      storage.saveChatHistory(next);
      return next;
    });

    return updatedCase;
  };

  const removeCasePinnedItem = (caseId: string, pinnedItemId: string) => {
    let removedMsgId: string | null = null;
    const updatedCases = cases.map((c) => {
      if (c.id !== caseId) return c;
      const currentPinned = c.pinnedItems || [];
      const found = currentPinned.find((p) => p.id === pinnedItemId);
      if (found) removedMsgId = found.messageId;
      return {
        ...c,
        updatedAt: new Date().toISOString(),
        pinnedItems: currentPinned.filter((p) => p.id !== pinnedItemId),
      };
    });
    setCasesState(updatedCases);
    storage.saveCases(updatedCases);

    if (removedMsgId) {
      setChatMessagesState((prev) => {
        const next = prev.map((m) =>
          m.id === removedMsgId && m.pinnedToCaseId === caseId
            ? { ...m, pinnedToCaseId: undefined }
            : m
        );
        storage.saveChatHistory(next);
        return next;
      });
    }
  };

  const restoreUnsavedChat = (id: string) => {
    // Save current unsaved chat first if it has user messages
    if (id !== activeUnsavedChatId) {
      archiveConversationToUnsavedHistory(activeUnsavedChatId, chatMessages, chatDraft);
    }
    const target = recentUnsavedChats.find((c) => c.id === id);
    if (!target) return;

    isCurrentChatSavedAsCaseRef.current = false;
    setActiveUnsavedChatId(target.id);
    setChatMessagesState(target.messages);
    storage.saveChatHistory(target.messages);
  };

  const removeUnsavedChat = (id: string) => {
    setRecentUnsavedChatsState((prev) => {
      const next = prev.filter((c) => c.id !== id);
      storage.saveRecentUnsavedChats(next);
      return next;
    });
  };

  const toggleUnsavedChatTag = (id: string, tag: ChatSessionTag) => {
    setRecentUnsavedChatsState((prev) => {
      const exists = prev.some((c) => c.id === id);
      let baseList = prev;
      if (!exists && id === activeUnsavedChatId) {
        const built = storage.buildRecentUnsavedChatEntry(id, chatMessages);
        if (built) {
          baseList = [built, ...prev];
        }
      }
      const next = baseList.map((chat) => {
        if (chat.id !== id) return chat;
        const currentTags = Array.isArray(chat.tags) ? chat.tags : [];
        const hasTag = currentTags.includes(tag);
        const updatedTags = hasTag
          ? currentTags.filter((tItem) => tItem !== tag)
          : [...currentTags, tag];
        return {
          ...chat,
          tags: updatedTags,
        };
      });
      storage.saveRecentUnsavedChats(next);
      return next;
    });
  };

  const toggleArchiveUnsavedChat = (id: string) => {
    let targetArchivedState: boolean | null = null;

    setRecentUnsavedChatsState((prev) => {
      const exists = prev.some((c) => c.id === id);
      let baseList = prev;
      if (!exists && id === activeUnsavedChatId) {
        const built = storage.buildRecentUnsavedChatEntry(id, chatMessages);
        if (built) {
          baseList = [built, ...prev];
        }
      }

      const archivedDateLabel = new Date().toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const next = baseList.map((chat) => {
        if (chat.id !== id) return chat;
        const nextArchived = !Boolean(chat.isArchived);
        targetArchivedState = nextArchived;
        return {
          ...chat,
          isArchived: nextArchived,
          archivedAt: nextArchived ? archivedDateLabel : undefined,
        };
      });
      storage.saveRecentUnsavedChats(next);
      return next;
    });

    // If the user archives the currently open live session, cleanly rotate to a fresh welcome session
    if (id === activeUnsavedChatId && targetArchivedState === true) {
      const nextSessionId = `unsaved_${Date.now()}`;
      setActiveUnsavedChatId(nextSessionId);
      isCurrentChatSavedAsCaseRef.current = false;
      const freshWelcomeMsg: ChatMessage[] = [
        {
          id: "msg_init",
          role: "assistant",
          text: getTranslation("elonGreeting", locale),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "sent",
        },
      ];
      setChatMessagesState(freshWelcomeMsg);
      storage.saveChatHistory([]);
      setChatDraft("");
      setActiveCaseId(null);
    }

    if (targetArchivedState !== null) {
      showToast(
        targetArchivedState
          ? locale === "pl"
            ? "Rozmowa przeniesiona do zakładki Zarchiwizowane."
            : locale === "ro"
            ? "Conversația a fost mutată în Arhivă."
            : "Chat session moved to Archived."
          : locale === "pl"
          ? "Przywrócono rozmowę z archiwum."
          : locale === "ro"
          ? "Conversația a fost restaurată din Arhivă."
          : "Chat session restored from Archived."
      );
    }
  };

  const saveUnsavedChatAsCase = (id: string) => {
    const target = recentUnsavedChats.find((c) => c.id === id);
    if (!target) return;
    const desc = target.messages
      .map((m) => `${m.role === "assistant" ? "Elon" : user.fullName}: ${m.text}`)
      .join("\n\n");
    addCase({
      title: target.title.slice(0, 60),
      description: desc.slice(0, 2000),
      sector: user.industry || "Ogólne",
      employer: user.employerName || "Pracodawca",
      status: "open",
      priority: "medium",
    });
    removeUnsavedChat(id);
    if (id === activeUnsavedChatId) {
      isCurrentChatSavedAsCaseRef.current = true;
    }
    showToast(t("caseSavedToast"));
  };

  const saveCurrentChatAsCase = () => {
    const lastUserMsg = [...chatMessages].reverse().find((m) => m.role === "user");
    const title = lastUserMsg?.text.slice(0, 50) || "Nowa sprawa z czatu z Elonem";
    const desc = chatMessages.map((m) => `${m.role === "assistant" ? "Elon" : user.fullName}: ${m.text}`).join("\n\n");
    addCase({
      title,
      description: desc.slice(0, 2000),
      sector: user.industry || "Ogólne",
      employer: user.employerName || "Pracodawca",
      status: "open",
      priority: "medium"
    });
    // Remove from unsaved history since it is now officially saved as a case
    isCurrentChatSavedAsCaseRef.current = true;
    removeUnsavedChat(activeUnsavedChatId);
    showToast(t("caseSavedToast"));
  };

  const markMessagesRead = () => {
    const updated = broadcastMessages.map((m) => ({ ...m, unread: false }));
    setBroadcastMessagesState(updated);
    storage.saveBroadcastMessages(updated);
  };

  // Admin Hub: Update any user in the database (and sync active user if matching)
  const updateAdminUser = (userId: string, updates: Partial<AdminManagedUser>) => {
    setAdminUsersState((prev) => {
      const nextList = prev.map((u) => {
        if (u.id !== userId) return u;
        const merged: AdminManagedUser = { ...u, ...updates };
        if (updates.free_access !== undefined) {
          merged.free_access = updates.free_access;
          if (updates.free_access) {
            merged.isPro = true;
            merged.subscriptionStatus = "free_access";
          } else if (merged.subscriptionStatus === "free_access") {
            merged.subscriptionStatus = merged.isPro ? "active_pro" : "free";
          }
        }
        if (updates.subscriptionStatus) {
          merged.subscriptionStatus = updates.subscriptionStatus;
          merged.isPro =
            updates.subscriptionStatus === "active_pro" ||
            updates.subscriptionStatus === "free_access";
          merged.free_access = updates.subscriptionStatus === "free_access";
        }
        return merged;
      });
      storage.saveAdminUsers(nextList);

      const updatedActive = nextList.find((u) => u.id === user.id);
      if (updatedActive && userId === user.id) {
        setUserState(updatedActive);
        storage.saveUserProfile(updatedActive);
      }

      return nextList;
    });
    showToast("Zapisano zmiany profilu użytkownika w bazie!");
  };

  // Admin Hub: Generate secure password reset token & link for user
  const resetAdminUserPassword = (userId: string) => {
    const target = adminUsers.find((u) => u.id === userId);
    const email = target?.email || "user@example.co.uk";
    const randA = Math.random().toString(36).slice(2, 6).toUpperCase();
    const randB = Math.random().toString(36).slice(2, 6).toUpperCase();
    const token = `RST-${randA}-${randB}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const tempPassword = `Elon#${randA}${Math.floor(100 + Math.random() * 900)}`;
    const resetLink = `https://ask-elon.co.uk/auth/reset-password?uid=${encodeURIComponent(
      userId
    )}&token=${encodeURIComponent(token)}`;
    const nowStr = new Date().toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    setAdminUsersState((prev) => {
      const nextList = prev.map((u) =>
        u.id === userId
          ? { ...u, lastPasswordResetToken: token, lastPasswordResetAt: nowStr }
          : u
      );
      storage.saveAdminUsers(nextList);
      return nextList;
    });

    showToast(`Wysłano link resetujący hasło na adres: ${email}`);
    return { token, resetLink, tempPassword, email };
  };

  // Admin Hub: Promo Codes Management & Validation
  const addPromoCode = (item: Omit<PromoCodeItem, "id" | "usedCount" | "createdAt">) => {
    const cleanCode = item.code.trim().toUpperCase();
    if (!cleanCode) return;
    const created: PromoCodeItem = {
      ...item,
      id: `promo_${Date.now()}`,
      code: cleanCode,
      usedCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setPromoCodesState((prev) => {
      const filtered = prev.filter((p) => p.code.toUpperCase() !== cleanCode);
      const next = [created, ...filtered];
      storage.savePromoCodes(next);
      return next;
    });
    showToast(`Utworzono kod rabatowy ${cleanCode}!`);
  };

  const removePromoCode = (id: string) => {
    setPromoCodesState((prev) => {
      const next = prev.filter((p) => p.id !== id);
      storage.savePromoCodes(next);
      return next;
    });
    showToast("Usunięto kod promocyjny.");
  };

  const validatePromoCode = useCallback(
    (codeStr: string) => {
      const clean = codeStr.trim().toUpperCase();
      if (!clean) {
        return { valid: false, errorReason: "Wpisz kod promocyjny." };
      }
      const found = promoCodes.find((p) => p.code.toUpperCase() === clean);
      if (!found) {
        return { valid: false, errorReason: t("promoInvalid") };
      }
      const todayISO = new Date().toISOString().slice(0, 10);
      if (found.expiresAt && found.expiresAt < todayISO) {
        return {
          valid: false,
          errorReason: `Kod ${found.code} wygasł dnia ${found.expiresAt}.`,
        };
      }
      const basePrice = 9.99;
      const discountedPrice =
        found.discountType === "percentage"
          ? Math.max(0, Number((basePrice * (1 - found.discountValue / 100)).toFixed(2)))
          : Math.max(0, Number((basePrice - found.discountValue).toFixed(2)));

      return {
        valid: true,
        promo: found,
        discountedPrice,
      };
    },
    [promoCodes, t]
  );

  const redeemPromoCode = (codeStr: string) => {
    const res = validatePromoCode(codeStr);
    if (!res.valid || !res.promo) {
      showToast(res.errorReason || t("promoInvalid"));
      return res;
    }

    setPromoCodesState((prev) => {
      const next = prev.map((p) =>
        p.id === res.promo!.id ? { ...p, usedCount: p.usedCount + 1 } : p
      );
      storage.savePromoCodes(next);
      return next;
    });

    if (res.discountedPrice === 0) {
      updateUser({ isPro: true, free_access: true, subscriptionStatus: "free_access" });
      showToast(t("promoSuccess"));
    } else {
      showToast(
        `Naliczyłem rabat (${res.promo.code})! Nowa cena subskrypcji: £${res.discountedPrice?.toFixed(2)}/mies.`
      );
    }
    return res;
  };

  // Admin Hub: Marketing Pop-up Configurator
  const updateMarketingPopupConfig = (updates: Partial<MarketingPopupConfig>) => {
    setMarketingPopupConfigState((prev) => {
      const next: MarketingPopupConfig = {
        ...prev,
        ...updates,
        updatedAt: new Date().toLocaleString("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      storage.saveMarketingPopupConfig(next);
      return next;
    });
    showToast("Zapisano konfigurację pop-upa marketingowego!");
  };

  // Admin Hub: Broadcast / Direct Chat Message Delivery into Main Chat
  const sendAdminSystemChatMessage = ({
    targetType,
    targetUserId,
    title,
    message,
  }: {
    targetType: "broadcast" | "direct";
    targetUserId?: string;
    title: string;
    message: string;
  }) => {
    const cleanTitle = title.trim() || (targetType === "broadcast" ? "Ogłoszenie systemowe" : "Wiadomość od Administratora");
    const cleanMsg = message.trim();
    if (!cleanMsg) return;

    const targetUser = targetUserId ? adminUsers.find((u) => u.id === targetUserId) : undefined;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nowDateTime = new Date().toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Save to Admin Delivery Logs
    const logItem: AdminChatDeliveryLog = {
      id: `adm_msg_${Date.now()}`,
      targetType,
      targetUserId: targetUser?.id,
      targetUserName:
        targetType === "broadcast"
          ? "Wszyscy użytkownicy (Broadcast)"
          : targetUser?.fullName || "Wybrany użytkownik",
      title: cleanTitle,
      message: cleanMsg,
      sentAt: nowDateTime,
    };
    setAdminChatDeliveryLogsState((prev) => {
      const next = [logItem, ...prev];
      storage.saveAdminChatDeliveryLogs(next);
      return next;
    });

    // 2. Also add to Notifications / Broadcast Inbox
    if (targetType === "broadcast" || targetUserId === user.id) {
      const newBroadcast: BroadcastMessage = {
        id: `bm_${Date.now()}`,
        title: cleanTitle,
        content: cleanMsg,
        date: new Date().toISOString().slice(0, 10),
        unread: true,
      };
      setBroadcastMessagesState((prev) => {
        const next = [newBroadcast, ...prev];
        storage.saveBroadcastMessages(next);
        return next;
      });
    }

    // 3. Deliver directly into the main Chat window if Broadcast OR Direct to current user (or previewing in real time)
    const shouldDeliverToActiveChat =
      targetType === "broadcast" || !targetUserId || targetUserId === user.id || true;

    if (shouldDeliverToActiveChat) {
      const formattedChatText =
        targetType === "broadcast"
          ? `📢 ${cleanTitle.toUpperCase()}\n\n${cleanMsg}`
          : `🛡️ ${cleanTitle.toUpperCase()} (Dla: ${targetUser?.fullName || user.fullName})\n\n${cleanMsg}`;

      const systemChatMsg: ChatMessage = {
        id: `msg_sys_${Date.now()}`,
        role: "assistant",
        text: formattedChatText,
        timestamp: nowTime,
        status: "sent",
        isSystemBroadcast: true,
        systemMessageType: targetType,
        senderLabel:
          targetType === "broadcast"
            ? "SYSTEM BROADCAST · ADMIN HUB"
            : `WIADOMOŚĆ BEZPOŚREDNIA (DIRECT) · ADMIN HUB → ${targetUser?.fullName || user.fullName}`,
      };

      setChatMessagesState((prev) => {
        const next = [...prev, systemChatMsg];
        storage.saveChatHistory(next);
        return next;
      });
    }

    showToast(
      targetType === "broadcast"
        ? "Wysłano komunikat Broadcast na główny czat wszystkich użytkowników!"
        : `Wysłano wiadomość bezpośrednią na czat użytkownika: ${targetUser?.fullName || ""}!`
    );
  };

  const logoutAndClearDevice = () => {
    storage.clearUserSessionOnLogout();
    const blankUser: UserProfile = {
      id: `user_${Date.now()}`,
      accountId: "",
      fullName: "",
      email: "",
      phone: "",
      homeAddress: "",
      employerName: "",
      companyNumber: "",
      employerAddress: "",
      jobTitle: "",
      startDate: new Date().toISOString().slice(0, 10),
      hourlyRate: 0,
      hoursPerWeek: 0,
      contractType: "permanent",
      industry: "",
      isPro: false,
      free_access: false,
      subscriptionStatus: "free",
      role: "user",
      onboarded: false,
    };
    setUserState(blankUser);
    setCasesState([]);
    setDocumentsState([]);
    setNotesState([]);
    setSentLettersState([]);
    setBroadcastMessagesState([]);
    setRecentUnsavedChatsState([]);
    setPendingSyncActionsState([]);
    setChatDraft("");
    saveCurrentLetterDraft(null);
    setActiveCaseId(null);
    isCurrentChatSavedAsCaseRef.current = false;
    setActiveUnsavedChatId(`unsaved_${Date.now()}`);
    setChatMessagesState([
      {
        id: "msg_init",
        role: "assistant",
        text: getTranslation("elonGreeting", locale),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent",
      },
    ]);
    setActiveTab("chat");
    setIsMenuDrawerOpen(false);
    showToast(
      locale === "pl"
        ? "Wylogowano i wyczyszczono dane z tego urządzenia."
        : locale === "ro"
        ? "Deconectat și datele au fost șterse de pe acest dispozitiv."
        : "Logged out and cleared device data."
    );
  };

  const resetAll = () => {
    storage.resetAllData();
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        lastNonChatTab,
        setActiveTab,
        closeChat,
        profileSubTab,
        setProfileSubTab,
        themeMode,
        setThemeMode,
        toggleThemeMode,
        robotState,
        aiResponseSentiment,
        setIsElonSpeaking,
        setIsUserDictating,
        triggerRobotReaction,
        locale,
        setLocale,
        t,
        user,
        updateUser,
        networkStatus,
        isOnline,
        isSimulatedOffline,
        setIsSimulatedOffline,
        lastOnlineAt,
        checkConnectionNow,
        isLetterDrafting,
        setIsLetterDrafting,
        chatDraft,
        setChatDraft,
        savedLetterDraft,
        saveCurrentLetterDraft,
        queuedMessagesCount,
        retryQueuedMessages,
        offlineSettings,
        updateOfflineSettings,
        pendingSyncActions,
        removePendingSyncAction,
        removeQueuedChatMessage,
        syncPendingActionsNow,
        enqueueSampleOfflineAction,
        cases,
        activeCaseId,
        setActiveCaseId,
        addCase,
        updateCaseStatus,
        addCaseNote,
        startChatAboutCase,
        templates,
        activeTemplateId,
        setActiveTemplateId,
        sentLetters,
        saveSentLetter,
        removeSentLetter,
        toggleSentLetterTag,
        forumPosts,
        addForumPost,
        upvoteForumPost,
        addForumComment,
        documents,
        addDocument,
        updateDocumentCategoryTag,
        removeDocument,
        runDocumentAudit,
        notes,
        addNote,
        removeNote,
        chatMessages,
        isChatLoading,
        sendChatMessage,
        clearChatMessages,
        deleteChatMessage,
        toggleFlagChatMessage,
        pinChatMessageToCase,
        removeCasePinnedItem,
        saveCurrentChatAsCase,
        recentUnsavedChats,
        activeUnsavedChatId,
        restoreUnsavedChat,
        removeUnsavedChat,
        saveUnsavedChatAsCase,
        toggleUnsavedChatTag,
        toggleArchiveUnsavedChat,
        isNewCaseModalOpen,
        setIsNewCaseModalOpen,
        isNewPostModalOpen,
        setIsNewPostModalOpen,
        isEmployerLookupModalOpen,
        setIsEmployerLookupModalOpen,
        isPaywallModalOpen,
        setIsPaywallModalOpen,
        isAdminModalOpen,
        setIsAdminModalOpen,
        isMenuDrawerOpen,
        setIsMenuDrawerOpen,
        isMessagesModalOpen,
        setIsMessagesModalOpen,
        isSentLettersModalOpen,
        setIsSentLettersModalOpen,
        isVoicePreferencesModalOpen,
        setIsVoicePreferencesModalOpen,
        isLegalDictionaryModalOpen,
        setIsLegalDictionaryModalOpen,
        isQuickSearchModalOpen,
        setIsQuickSearchModalOpen,
        isTermsPrivacyModalOpen,
        setIsTermsPrivacyModalOpen,
        isRegisterModalOpen,
        setIsRegisterModalOpen,
        voiceConfig,
        updateVoiceConfig,
        broadcastMessages,
        markMessagesRead,
        toastMessage,
        showToast,
        adminUsers,
        updateAdminUser,
        resetAdminUserPassword,
        promoCodes,
        addPromoCode,
        removePromoCode,
        validatePromoCode,
        redeemPromoCode,
        marketingPopupConfig,
        updateMarketingPopupConfig,
        isMarketingPopupVisible,
        setIsMarketingPopupVisible,
        adminChatDeliveryLogs,
        sendAdminSystemChatMessage,
        logoutAndClearDevice,
        resetAll
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}


