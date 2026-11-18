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
import { Toast } from "./components/Toast";

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div
      className={`${
        activeTab === "chat"
          ? "app-chat-shell"
          : "min-h-screen pb-28 sm:pb-32"
      } bg-[#F4F6F9] dark:bg-[#0B0F17] text-[#0F172A] dark:text-[#F1F5F9] flex flex-col font-sans selection:bg-[#1D6852] selection:text-white transition-colors duration-200`}
    >
      {/* Top Header */}
      <Header />

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full mx-auto ${
          activeTab === "chat"
            ? "max-w-7xl min-h-0 overflow-hidden flex flex-col"
            : "max-w-5xl"
        }`}
      >
        {activeTab === "chat" && <ChatTab />}
        {activeTab === "cases" && <CasesTab />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "forum" && <ForumTab />}
        {activeTab === "profile" && <ProfileTab />}
      </main>

      {/* Bottom Navigation */}
      <NavigationTabs />

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
