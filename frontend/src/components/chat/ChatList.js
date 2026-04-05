// components/chat/ChatList.js — conversation list (MentorBridge styling)

import React, { useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import api from "../../utils/api";
import { toastApiError } from "../../utils/toast";

const ChatList = ({ onSelectChat }) => {
  const { conversations, setConversations, onlineUsers } = useChat();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get("/chat/conversations");
        if (response.data.success) {
          setConversations(response.data.data);
        }
      } catch (error) {
        toastApiError(error, "Could not load conversations.");
      }
    };

    fetchConversations();
  }, [setConversations]);

  if (conversations.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-none border border-dashed border-black/[0.1] bg-white/80 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-none bg-gradient-to-br from-[#1d1d1f] to-[#0071e3]/80 text-2xl shadow-md">
          💬
        </div>
        <p className="mt-4 text-[16px] font-semibold text-[#1d1d1f]">No conversations yet</p>
        <p className="mt-2 max-w-[260px] text-[14px] leading-relaxed text-neutral-500">
          When a student and mentor connect, threads appear here for quick, private chat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherUserIdStr = String(conversation.otherUser._id);
        const isOnline = onlineUsers.has(otherUserIdStr);
        const hasUnread = conversation.unreadCount > 0;
        const initial = conversation.otherUser.name?.charAt(0)?.toUpperCase() || "?";

        return (
          <button
            key={conversation.connectionId}
            type="button"
            onClick={() => onSelectChat(conversation.otherUser)}
            className={`group w-full rounded-none border text-left transition ${
              hasUnread
                ? "border-[#0071e3]/25 bg-white shadow-[0_8px_30px_rgba(0,113,227,0.12)] ring-1 ring-[#0071e3]/15"
                : "border-black/[0.06] bg-white/90 hover:border-black/[0.1] hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            }`}
          >
            <div className="flex items-center gap-3 p-3.5 sm:p-4">
              <div className="relative shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-none bg-[#1d1d1f] text-[15px] font-semibold text-white shadow-inner ring-2 ring-white">
                  {initial}
                </div>
                {isOnline && (
                  <span
                    className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-[#34c759] shadow-sm"
                    title="Online"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-[15px] font-semibold text-[#1d1d1f]">
                    {conversation.otherUser.name}
                  </h3>
                  {hasUnread && (
                    <span className="shrink-0 rounded-full bg-[#0071e3] px-2 py-0.5 text-[11px] font-bold text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-0.5 truncate text-[13px] leading-snug ${
                    hasUnread ? "font-medium text-neutral-700" : "text-neutral-500"
                  }`}
                >
                  {conversation.lastMessage || "No messages yet — say hello"}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ChatList;
