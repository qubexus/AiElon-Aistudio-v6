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
  SavedLetterDraft
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

interface AppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
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

  // Global reset
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
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

  const queuedMessagesCount = chatMessages.filter(
    (m) => m.role === "user" && (m.status === "queued" || m.status === "sending")
  ).length;

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

  // Watch networkStatus transitions for restoration alerts and queue flushing
  useEffect(() => {
    const prev = prevNetworkStatusRef.current;
    if (prev !== "online" && networkStatus === "online" && !isSimulatedOffline) {
      const hasQueued = chatMessages.some((m) => m.role === "user" && m.status === "queued");
      if (hasQueued) {
        showToast(getTranslation("netRestoredWithQueueToast", locale));
        retryQueuedMessages();
      } else {
        showToast(getTranslation("netRestoredToast", locale));
      }
    }
    prevNetworkStatusRef.current = networkStatus;
  }, [networkStatus, isSimulatedOffline, chatMessages, locale, showToast, retryQueuedMessages]);

  const updateUser = (updates: Partial<UserProfile>) => {
    setUserState((prev) => {
      const next = { ...prev, ...updates };
      storage.saveUserProfile(next);
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

  const clearChatMessages = () => {
    const initial: ChatMessage[] = [
      {
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: getTranslation("elonGreeting", locale),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent"
      }
    ];
    setChatMessagesState(initial);
    storage.saveChatHistory(initial);
    setChatDraft("");
    setActiveCaseId(null);
    showToast(t("clearChat"));
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
    showToast(t("caseSavedToast"));
  };

  const markMessagesRead = () => {
    const updated = broadcastMessages.map((m) => ({ ...m, unread: false }));
    setBroadcastMessagesState(updated);
    storage.saveBroadcastMessages(updated);
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

