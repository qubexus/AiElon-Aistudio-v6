import React from "react";
import { useApp } from "../context/AppContext";
import { CheckCircle2, WifiOff } from "lucide-react";

export const Toast: React.FC = () => {
  const { toastMessage, isOnline } = useApp();

  if (!toastMessage) return null;

  const isOfflineAlert = !isOnline;

  return (
    <div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] sm:w-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-white shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 ${
        isOfflineAlert
          ? "bg-[#1A1215] border-[#EF4444]/60"
          : "bg-[#0B6E4F] border-[#2EE59D]/40"
      }`}
      role="status"
      aria-live="polite"
    >
      {isOfflineAlert ? (
        <WifiOff className="w-4.5 h-4.5 text-[#EF4444] shrink-0" />
      ) : (
        <CheckCircle2 className="w-4.5 h-4.5 text-[#2EE59D] shrink-0" />
      )}
      <span className="text-xs font-bold tracking-tight leading-snug">
        {toastMessage}
      </span>
    </div>
  );
};

