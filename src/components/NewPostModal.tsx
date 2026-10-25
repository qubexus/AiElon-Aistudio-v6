import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { X, MessageSquarePlus } from "lucide-react";

export const NewPostModal: React.FC = () => {
  const { isNewPostModalOpen, setIsNewPostModalOpen, addForumPost, t } = useApp();

  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Magazyn");
  const [content, setContent] = useState("");

  if (!isNewPostModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addForumPost(title.trim(), content.trim(), tag);
    setIsNewPostModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0F2C4D] border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2EE59D] flex items-center justify-center text-black">
              <MessageSquarePlus className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-extrabold text-white">
              {t("newPost")}
            </h2>
          </div>

          <button
            onClick={() => setIsNewPostModalOpen(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {t("postTitleLabel")}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Czy agencja może potrącić za testy narkotykowe?"
              className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {t("postTagLabel")}
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
            >
              <option value="Magazyn">Magazyn i logistyka</option>
              <option value="Opieka / NHS">Opieka / NHS</option>
              <option value="Budownictwo">Budownictwo</option>
              <option value="Gastronomia">Gastronomia</option>
              <option value="Agencja">Agencja pracy</option>
              <option value="Biuro">Biuro</option>
              <option value="Ogólne">Ogólne</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {t("postContentLabel")}
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Podziel się swoją historią, pytaniem lub poradą dla innych pracowników..."
              className="w-full bg-[#12304F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewPostModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#BACADA] hover:text-white"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-extrabold text-xs shadow-md hover:opacity-95 transition-opacity"
            >
              {t("publishPost")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
