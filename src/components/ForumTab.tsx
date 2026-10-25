import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { ForumPost } from "../types";
import {
  Users,
  Plus,
  ThumbsUp,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  Send,
  Sparkles,
  Bot
} from "lucide-react";

export const ForumTab: React.FC = () => {
  const {
    forumPosts,
    t,
    setIsNewPostModalOpen,
    upvoteForumPost,
    addForumComment,
    user
  } = useApp();

  const [selectedTag, setSelectedTag] = useState<string>("Wszystkie");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [commentInput, setCommentInput] = useState("");

  const tags = [
    "Wszystkie",
    "Magazyn",
    "Opieka / NHS",
    "Budownictwo",
    "Gastronomia",
    "Agencja",
    "Ogólne"
  ];

  const filteredPosts = forumPosts.filter(
    (p) => selectedTag === "Wszystkie" || p.tag.toLowerCase().includes(selectedTag.toLowerCase())
  );

  const handleSendComment = (postId: string) => {
    if (!commentInput.trim()) return;
    addForumComment(postId, commentInput.trim());
    setCommentInput("");
    const updated = forumPosts.find((p) => p.id === postId);
    if (updated) setSelectedPost(updated);
  };

  // Post Detail View with Comments
  if (selectedPost) {
    const current = forumPosts.find((p) => p.id === selectedPost.id) || selectedPost;

    return (
      <div className="max-w-3xl mx-auto px-4 py-4 pb-24">
        <button
          onClick={() => setSelectedPost(null)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#BACADA] hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Wróć do dyskusji</span>
        </button>

        <div className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF6A00]/20 text-[#FF6A00] border border-[#FF6A00]/30">
              {current.tag}
            </span>
            <span className="text-xs text-[#BACADA]">
              {new Date(current.createdAt).toLocaleDateString("en-GB")}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-3">
            {current.title}
          </h1>

          <div className="flex items-center gap-2 text-xs text-[#BACADA] mb-4 pb-3 border-b border-white/10">
            <div className="w-6 h-6 rounded-full bg-[#12304F] border border-white/20 flex items-center justify-center font-bold text-[10px] text-white">
              {current.author.charAt(0)}
            </div>
            <span className="font-semibold text-white">{current.author}</span>
            {current.authorRole && (
              <>
                <span>•</span>
                <span className="text-[#2EE59D]">{current.authorRole}</span>
              </>
            )}
          </div>

          <p className="text-sm text-[#F4F8FB] leading-relaxed whitespace-pre-wrap mb-5">
            {current.content}
          </p>

          <button
            onClick={() => upvoteForumPost(current.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              current.userUpvoted
                ? "bg-[#2EE59D]/20 text-[#2EE59D] border-[#2EE59D]/40"
                : "bg-[#12304F] text-[#BACADA] border-white/10 hover:text-white"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{current.upvotes} {t("upvote")}</span>
          </button>
        </div>

        {/* Comments Section */}
        <div className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#FF6A00]" />
            <span>{t("comments")} ({current.comments?.length || 0})</span>
          </h3>

          {/* New comment input */}
          <div className="flex items-center gap-2 mb-6 bg-[#12304F] p-2 rounded-xl border border-white/10">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendComment(current.id)}
              placeholder={t("addComment")}
              className="flex-1 bg-transparent border-0 text-xs text-white placeholder-[#BACADA]/60 focus:outline-none px-2"
            />
            <button
              onClick={() => handleSendComment(current.id)}
              disabled={!commentInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 text-white font-bold text-xs disabled:opacity-40 transition-colors"
            >
              {t("postComment")}
            </button>
          </div>

          {/* Comments list */}
          <div className="space-y-3">
            {current.comments && current.comments.length > 0 ? (
              current.comments.map((comment) => {
                const isElon = comment.author.includes("Elon");
                return (
                  <div
                    key={comment.id}
                    className={`p-3.5 rounded-xl border ${
                      isElon
                        ? "bg-[#0B6E4F]/20 border-[#2EE59D]/30"
                        : "bg-[#12304F]/60 border-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1.5">
                        {isElon ? (
                          <span className="flex items-center gap-1 font-bold text-[#2EE59D]">
                            <Bot className="w-3.5 h-3.5" />
                            {comment.author}
                          </span>
                        ) : (
                          <span className="font-semibold text-white">{comment.author}</span>
                        )}
                      </div>
                      <span className="text-[#BACADA]">
                        {new Date(comment.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <p className="text-xs text-[#F4F8FB] leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#BACADA] italic py-2">
                Brak komentarzy. Bądź pierwszą osobą, która odpowie!
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Forum Main Feed
  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF6A00]" />
            {t("forumTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-[#BACADA] mt-0.5">
            {t("forumSub")}
          </p>
        </div>

        <button
          onClick={() => setIsNewPostModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-extrabold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("newPost")}</span>
        </button>
      </div>

      {/* Filter Tags */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shrink-0 ${
              selectedTag === tag
                ? "bg-[#FF6A00] text-black border-[#FF6A00]"
                : "bg-[#0F2C4D] text-[#BACADA] border-white/10 hover:text-white"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-3.5">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="group p-5 rounded-2xl bg-[#0F2C4D] hover:bg-[#12304F] border border-white/10 hover:border-[#FF6A00]/40 transition-all cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF6A00]/20 text-[#FF6A00] border border-[#FF6A00]/30">
                {post.tag}
              </span>

              <span className="text-[11px] text-[#BACADA]">
                {new Date(post.createdAt).toLocaleDateString("en-GB")}
              </span>
            </div>

            <h3 className="text-base font-bold text-white group-hover:text-[#FF6A00] transition-colors mb-2">
              {post.title}
            </h3>

            <p className="text-xs text-[#BACADA] line-clamp-2 leading-relaxed mb-4">
              {post.content}
            </p>

            <div className="flex items-center justify-between text-xs text-[#BACADA] pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{post.author}</span>
                {post.authorRole && (
                  <>
                    <span>•</span>
                    <span className="text-[#2EE59D] hidden sm:inline">{post.authorRole}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    upvoteForumPost(post.id);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${
                    post.userUpvoted ? "text-[#2EE59D]" : "text-[#BACADA] hover:text-white"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{post.upvotes}</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs text-[#BACADA]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
