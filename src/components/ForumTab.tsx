import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  ThumbsUp,
  MessageCircle,
  Plus,
  Send,
  UserCheck,
  Search,
  TrendingUp,
  Clock,
} from "lucide-react";

export const ForumTab: React.FC = () => {
  const {
    forumPosts,
    upvoteForumPost,
    addForumComment,
    setIsNewPostModalOpen,
    locale,
    t,
  } = useApp();

  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"popular" | "recent">("popular");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const tags = ["All", "Magazyn", "Gastronomia", "Budowa", "Opieka", "Inne"];

  const filteredPosts = useMemo(() => {
    return forumPosts
      .filter((p) => {
        if (selectedTag !== "All" && p.tag !== selectedTag) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            p.content.toLowerCase().includes(q) ||
            p.author.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "popular") return b.upvotes - a.upvotes;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [forumPosts, selectedTag, searchQuery, sortBy]);

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId] || "";
    if (!text.trim()) return;
    addForumComment(postId, text.trim());
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-[#F1F5F9]">
            {t("forumHeading")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] mt-0.5">
            {t("forumSub")}
          </p>
        </div>

        <button
          onClick={() => setIsNewPostModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#1D6852] hover:bg-[#258066] text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t("newPostBtn")}
        </button>
      </div>

      {/* Segregated Filter, Search & Sort Toolbar */}
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Sector Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedTag === tag
                    ? "bg-[#1D6852] text-white"
                    : "bg-slate-100 dark:bg-[#0B0F17] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tag === "All" ? t("filterAll") : tag}
              </button>
            ))}
          </div>

          {/* Sort & Search */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-100 dark:bg-[#0B0F17] p-1 rounded-xl border border-slate-200/80 dark:border-white/10">
              <button
                onClick={() => setSortBy("popular")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  sortBy === "popular"
                    ? "bg-[#1D6852] text-white"
                    : "text-slate-600 dark:text-[#94A3B8]"
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>{locale === "pl" ? "Popularne" : "Popular"}</span>
              </button>
              <button
                onClick={() => setSortBy("recent")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  sortBy === "recent"
                    ? "bg-[#1D6852] text-white"
                    : "text-slate-600 dark:text-[#94A3B8]"
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{locale === "pl" ? "Najnowsze" : "Recent"}</span>
              </button>
            </div>

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === "pl" ? "Szukaj wątku..." : "Search posts..."}
                className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#38B28B]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Forum Posts List */}
      <div className="space-y-3.5">
        {filteredPosts.map((post) => {
          const isCommentsOpen = openCommentsId === post.id;

          return (
            <div
              key={post.id}
              className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 transition-all hover:border-[#38B28B]/30"
            >
              {/* Meta Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1D6852]/15 border border-[#38B28B]/30 flex items-center justify-center text-[#1D6852] dark:text-[#38B28B] font-bold text-xs">
                    {post.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-[#F1F5F9]">
                        {post.author}
                      </span>
                      <UserCheck className="w-3.5 h-3.5 text-[#38B28B]" />
                    </div>
                    <span className="block text-[10px] text-slate-500 dark:text-[#94A3B8]">
                      {post.authorRole}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#D97724]/15 text-[#D97724] border border-[#D97724]/30">
                  {post.tag}
                </span>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F1F5F9] leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={() => upvoteForumPost(post.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all tabular-nums ${
                    post.userUpvoted
                      ? "bg-[#1D6852] text-white"
                      : "bg-slate-100 dark:bg-[#0B0F17]/70 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{post.upvotes}</span>
                </button>

                <button
                  onClick={() =>
                    setOpenCommentsId(isCommentsOpen ? null : post.id)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#0B0F17]/70 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10 transition-colors tabular-nums"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#D97724]" />
                  <span>
                    {post.comments.length} {t("commentsCount")}
                  </span>
                </button>
              </div>

              {/* Comments Drawer */}
              {isCommentsOpen && (
                <div className="pt-3 mt-2 border-t border-slate-200/80 dark:border-white/10 space-y-2.5">
                  {post.comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-50 dark:bg-[#0B0F17]/70 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#94A3B8]">
                        <span className="font-bold text-[#1D6852] dark:text-[#38B28B]">
                          {c.author}
                        </span>
                        <span>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-800 dark:text-[#F1F5F9]">{c.text}</p>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddComment(post.id);
                      }}
                      placeholder={t("addCommentPlaceholder")}
                      className="flex-1 bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#38B28B]"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="px-3.5 py-2 rounded-xl bg-[#D97724] hover:bg-[#C2651A] text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {t("replyBtn")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
