import React, { useState, useEffect, useCallback } from "react";
import { useChat } from "../../context/ChatContext";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import api from "../../utils/api";
import { toastApiError } from "../../utils/toast";

const MessagesPanel = () => {
  const {
    messagesPanelOpen,
    closeMessagesPanel,
    setActiveChat,
    setConversations,
    unreadCount,
    setUnreadCount,
    pendingChatUser,
    setPendingChatUser,
  } = useChat();
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);

  const handleClosePanel = useCallback(() => {
    setSelectedUser(null);
    setActiveChat(null);
    closeMessagesPanel();
  }, [closeMessagesPanel, setActiveChat]);

  useEffect(() => {
    if (!messagesPanelOpen) {
      setSelectedUser(null);
      setActiveChat(null);
    }
  }, [messagesPanelOpen, setActiveChat]);

  useEffect(() => {
    if (!messagesPanelOpen || !pendingChatUser) return;
    setSelectedUser(pendingChatUser);
    setActiveChat(pendingChatUser);
    setPendingChatUser(null);
  }, [messagesPanelOpen, pendingChatUser, setActiveChat, setPendingChatUser]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && messagesPanelOpen) handleClosePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [messagesPanelOpen, handleClosePanel]);

  const handleSelectChat = async (user) => {
    setLoadingThread(true);
    setSelectedUser(user);
    try {
      await api.put(`/chat/messages/mark-read/${user._id}`);
      const unreadRes = await api.get("/chat/unread-count");
      if (unreadRes.data.success) {
        setUnreadCount(unreadRes.data.unreadCount);
      }
      const convRes = await api.get("/chat/conversations");
      if (convRes.data.success) {
        setConversations(convRes.data.data);
      }
    } catch (err) {
      toastApiError(err, "Could not update conversation.");
    } finally {
      setLoadingThread(false);
    }
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setActiveChat(null);
  };

  if (!messagesPanelOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close messages"
        className="fixed inset-x-0 bottom-0 top-14 z-[60] bg-[#1d1d1f]/45 backdrop-blur-md md:bg-[#1d1d1f]/25"
        onClick={handleClosePanel}
      />

      <aside
        className="font-apple fixed right-0 top-14 z-[70] flex h-[calc(100dvh-3.5rem)] w-full max-w-[420px] flex-col overflow-hidden rounded-none border-l border-black/[0.08] bg-[#f5f5f7] shadow-[0_0_0_1px_rgba(0,0,0,0.04),-24px_0_80px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="messages-panel-title"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-black/[0.06] bg-gradient-to-br from-[#1d1d1f] via-[#252528] to-[#0071e3]/85 px-5 py-4 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <h2 id="messages-panel-title" className="text-[18px] font-semibold tracking-tight">
                Messages
              </h2>
              {unreadCount > 0 && !selectedUser && (
                <p className="mt-0.5 text-[12px] font-medium text-white/80">
                  {unreadCount} unread conversation{unreadCount === 1 ? "" : "s"}
                </p>
              )}
              {!selectedUser && unreadCount === 0 && (
                <p className="mt-0.5 text-[12px] text-white/65">MentorBridge inbox</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClosePanel}
              className="flex h-10 w-10 items-center justify-center rounded-none bg-white/10 text-xl leading-none text-white transition hover:bg-white/20"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f5f5f7]">
          {!selectedUser ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              <ChatList onSelectChat={handleSelectChat} />
            </div>
          ) : loadingThread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent" />
              <p className="text-[13px] font-medium text-neutral-500">Opening thread…</p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col bg-white">
              <button
                type="button"
                onClick={handleBackToList}
                className="flex shrink-0 items-center gap-2 border-b border-black/[0.06] bg-[#fafafa] px-4 py-3 text-[14px] font-semibold text-[#0071e3] transition hover:bg-[#f0f0f2]"
              >
                <span className="text-lg leading-none" aria-hidden>
                  ←
                </span>
                Inbox
              </button>
              <div className="min-h-0 flex-1">
                <ChatWindow otherUser={selectedUser} onClose={handleBackToList} variant="panel" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default MessagesPanel;
