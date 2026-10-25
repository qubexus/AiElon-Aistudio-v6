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
  SentLetter,
  SentLetterCategoryTag,
  BroadcastMessage,
  NetworkStatus,
  SavedLetterDraft,
  RecentUnsavedChat,
  AdminManagedUser,
  PromoCodeItem,
  MarketingPopupConfig,
  AdminChatDeliveryLog,
  PendingSyncAction,
  OfflineSettingsConfig
} from "../types";
import {
  defaultTemplates,
  extractProfileUpdatesFromChat,
  buildPersonalizedEnglishLetterForChat,
  classifySentLetter,
} from "../data/legalTemplates";
import * as storage from "../services/storageService";
import { askElonAI, askElonAIStream } from "../services/geminiService";
import { getTranslation } from "../i18n/translations";

export type TabType = "chat" | "cases" | "templates" | "forum" | "profile";
export type ProfileSubTab = "details" | "docs" | "notes";

interface AppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  profileSubTab: ProfileSubTab;
  setProfileSubTab: (subTab: ProfileSubTab) => void;
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
  startChatAboutCase: (caseItem: WorkplaceCase) => void;

  // Templates
  templates: LegalTemplate[];
  activeTemplateId: string | null;
  setActiveTemplateId: (id: string | null) => void;
  sentLetters: SentLetter[];
  saveSentLetter: (letter: Omit<SentLetter, "id" | "date">, silent?: boolean) => void;
  removeSentLetter: (id: string) => void;
  toggleSentLetterTag: (id: string, tag: SentLetterCategoryTag) => void;

  // Forum
  forumPosts: ForumPost[];
  addForumPost: (title: string, content: string, tag: string) => void;
  upvoteForumPost: (postId: string) => void;
  addForumComment: (postId: string, commentText: string) => void;

  // Documents
  documents: UserDocument[];
  addDocument: (doc: Omit<UserDocument, "id" | "uploadDate">) => void;
  removeDocument: (id: string) => void;
  runDocumentAudit: (id: string) => void;

  // Notes
  notes: WorkplaceNote[];
  addNote: (title: string, description: string, category: string) => void;
  removeNote: (id: string) => void;

  // Chat
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  sendChatMessage: (text: string) => Promise<void>;
  clearChatMessages: () => void;
  saveCurrentChatAsCase: () => void;
  recentUnsavedChats: RecentUnsavedChat[];
  activeUnsavedChatId: string;
  restoreUnsavedChat: (id: string) => void;
  removeUnsavedChat: (id: string) => void;
  saveUnsavedChatAsCase: (id: string) => void;

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

  // Global reset
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>("details");
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
  const [chatMessages, setChatMessagesState] = useState<ChatMessage[]>(() => {
    const saved = storage.loadChatHistory();
    if (saved.length > 0) return saved;
    return [
      {
        id: "msg_init",
        role: "assistant",
        text: getTranslation("elonGreeting", locale),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent"
      }
    ];
  });
  const [recentUnsavedChats, setRecentUnsavedChatsState] = useState<RecentUnsavedChat[]>(
    storage.loadRecentUnsavedChats
  );
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
  const [chatDraft, setChatDraftState] = useState<string>(storage.loadChatDraft);
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

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    storage.saveLocale(l);
  };

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

  const updateUser = (updates: Partial<UserProfile>) => {
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

  const addForumPost = (title: string, content: string, tag: string) => {
    const newPost: ForumPost = {
      id: `post_${Date.now()}`,
      author: user.fullName || "Worker_UK",
      authorRole: `${user.jobTitle || "Worker"} · ask Elon`,
      title,
      content,
      tag,
      upvotes: 1,
      userUpvoted: true,
      createdAt: new Date().toISOString(),
      comments: []
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

  const addDocument = (doc: Omit<UserDocument, "id" | "uploadDate">) => {
    const newDoc: UserDocument = {
      ...doc,
      id: `doc_${Date.now()}`,
      uploadDate: new Date().toISOString().slice(0, 10)
    };
    const updated = [newDoc, ...documents];
    setDocumentsState(updated);
    storage.saveDocuments(updated);
    showToast(t("uploadDoc") + " - " + newDoc.name);
  };

  const removeDocument = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocumentsState(updated);
    storage.saveDocuments(updated);
  };

  const runDocumentAudit = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;

    // Simulate smart AI inspection
    const auditRes = {
      valid: false,
      summary: "AI Audit ukończony. Sprawdzono stawkę National Living Wage, potrącenia oraz holiday pay.",
      calculatedHourly: 12.45,
      holidayPayStatus: "Naliczone poprawnie (12.07%)",
      minimumWageCompliance: true,
      items: [
        {
          issue: "Potrącenie za uniform lub sprzęt ochronny",
          severity: "error" as const,
          recommendation: "Zgodnie z s.9 Health & Safety at Work Act 1974, pracodawca nie może potrącać z pensji kosztów wymaganego PPE."
        },
        {
          issue: "Sprawdź kalkulację nadgodzin w okresie rozliczeniowym",
          severity: "warning" as const,
          recommendation: "Zgłoś brakujące godziny korzystając z szablonu Section 13 ERA 1996 w zakładce Pisma."
        }
      ]
    };

    const updated = documents.map((d) => (d.id === id ? { ...d, auditResult: auditRes } : d));
    setDocumentsState(updated);
    storage.saveDocuments(updated);
    showToast("Audyt AI dokumentu zakończony!");
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

  const sendChatMessage = async (text: string) => {
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

      // 1. Automatically extract any personal/workplace details the user provided in chat and update UserProfile
      const profileUpdates = extractProfileUpdatesFromChat(userMsg.text, reply);
      let effectiveUser = user;
      if (Object.keys(profileUpdates).length > 0) {
        effectiveUser = { ...user, ...profileUpdates };
        updateUser(profileUpdates);
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

    // 2. Start a fresh session and greet only with a short question asking about further questions
    const nextSessionId = `unsaved_${Date.now()}`;
    setActiveUnsavedChatId(nextSessionId);
    isCurrentChatSavedAsCaseRef.current = false;

    const resetPromptMsg: ChatMessage[] = [
      {
        id: `msg_reset_${Date.now()}`,
        role: "assistant",
        text: getTranslation("elonResetPrompt", locale),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent"
      }
    ];
    setChatMessagesState(resetPromptMsg);
    storage.saveChatHistory(resetPromptMsg);
    setChatDraft("");
    setActiveCaseId(null);
    showToast(t("clearChat"));
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

  const resetAll = () => {
    storage.resetAllData();
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        profileSubTab,
        setProfileSubTab,
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
        removeDocument,
        runDocumentAudit,
        notes,
        addNote,
        removeNote,
        chatMessages,
        isChatLoading,
        sendChatMessage,
        clearChatMessages,
        saveCurrentChatAsCase,
        recentUnsavedChats,
        activeUnsavedChatId,
        restoreUnsavedChat,
        removeUnsavedChat,
        saveUnsavedChatAsCase,
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


