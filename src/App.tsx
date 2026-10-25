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
import { Toast } from "./components/Toast";

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div
      className={`${
        activeTab === "chat" ? "h-[100dvh] overflow-hidden" : "min-h-screen"
      } bg-[#070F1A] text-[#F4F8FB] flex flex-col font-sans selection:bg-[#0B6E4F] selection:text-white pb-16`}
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
