import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { NavigationTabs } from "./components/NavigationTabs";
import { ChatTab } from "./components/ChatTab";
import { CasesTab } from "./components/CasesTab";
import { TemplatesTab } from "./components/TemplatesTab";
import { ForumTab } from "./components/ForumTab";
import { ProfileTab } from "./components/ProfileTab";
import { NewCaseModal } from "./components/NewCaseModal";
import { NewPostModal } from "./components/NewPostModal";
import { EmployerLookupModal } from "./components/EmployerLookupModal";
import { PaywallModal } from "./components/PaywallModal";
import { MenuDrawer } from "./components/MenuDrawer";
import { AdminModal } from "./components/AdminModal";
import { MessagesModal } from "./components/MessagesModal";
import { SentLettersModal } from "./components/SentLettersModal";
import { VoicePreferencesModal } from "./components/VoicePreferencesModal";
import { LegalDictionaryModal } from "./components/LegalDictionaryModal";
import { QuickSearchModal } from "./components/QuickSearchModal";
import { TermsPrivacyModal } from "./components/TermsPrivacyModal";
import { RegisterModal } from "./components/RegisterModal";
import { Toast } from "./components/Toast";

const AppContent: React.FC = () => {
  const { activeTab, lastNonChatTab, t } = useApp();
  const backgroundTab = activeTab === "chat" ? lastNonChatTab : activeTab;

  return (
    <div className="min-h-screen pb-28 sm:pb-32 bg-[#F8FAFC] dark:bg-[#141B23] text-[#1E293B] dark:text-[#F1F5F9] flex flex-col font-sans selection:bg-[#2E6F57] selection:text-white transition-colors duration-200">
      {/* Top gradient banner above header (80px / 88px tablet + safe-area-top), dark side on right */}
      <div className="top-ad-banner-strip" aria-hidden="true">
        <div className="top-ad-banner-col">
          <span className="top-ad-banner-title">{t("topBannerTitle")}</span>
          <span className="top-ad-banner-rule" />
          <span className="top-ad-banner-line">{t("topBannerLine")}</span>
        </div>
      </div>

      {/* Top Header */}
      <Header />

      {/* Main Content Area (non-chat views live here cleanly underneath full-screen chat) */}
      <main className="flex-1 w-full mx-auto max-w-5xl">
        {backgroundTab === "cases" && <CasesTab />}
        {backgroundTab === "templates" && <TemplatesTab />}
        {backgroundTab === "forum" && <ForumTab />}
        {backgroundTab === "profile" && <ProfileTab />}
      </main>

      {/* Bottom Navigation */}
      <NavigationTabs />

      {/* Full-Screen Chat View covering header & bottom bar */}
      {activeTab === "chat" && <ChatTab />}

      {/* Modals & Overlays */}
      <NewCaseModal />
      <NewPostModal />
      <EmployerLookupModal />
      <PaywallModal />
      <MenuDrawer />
      <AdminModal />
      <MessagesModal />
      <SentLettersModal />
      <VoicePreferencesModal />
      <LegalDictionaryModal />
      <QuickSearchModal />
      <TermsPrivacyModal />
      <RegisterModal />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
