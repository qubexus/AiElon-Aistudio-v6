import React from "react";
import { useApp } from "../context/AppContext";
import { X, Bell, CheckCircle } from "lucide-react";

export const MessagesModal: React.FC = () => {
  const {
    isMessagesModalOpen,
    setIsMessagesModalOpen,
    broadcastMessages,
    markMessagesRead
  } = useApp();

  if (!isMessagesModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#131B2E] border border-white/15 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1D6852] flex items-center justify-center text-[#38B28B]">
              <Bell className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-extrabold text-white">
              Wiadomości & Komunikaty
            </h2>
          </div>

          <button
            onClick={() => {
              markMessagesRead();
              setIsMessagesModalOpen(false);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {broadcastMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-2xl border transition-all ${
                msg.unread
                  ? "bg-[#1A243B] border-[#D97724]/40 shadow-md"
                  : "bg-[#1A243B]/50 border-white/5"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#38B28B] font-bold">
                  {msg.date}
                </span>
                {msg.unread && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#D97724] text-black font-extrabold text-[9px]">
                    NOWE
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{msg.title}</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {msg.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              markMessagesRead();
              setIsMessagesModalOpen(false);
            }}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#94A3B8] hover:text-white transition-colors"
          >
            Oznacz jako przeczytane i zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
