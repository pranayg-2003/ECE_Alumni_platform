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
        className="fixed inset-0 top-14 z-[60] bg-slate-900/40 backdrop-blur-[1px] md:bg-slate-900/20"
        onClick={handleClosePanel}
      />

      <aside
        className="fixed right-0 top-14 z-[70] flex h-[calc(100vh-3.5rem)] w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-300/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby="messages-panel-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2
              id="messages-panel-title"
              className="text-lg font-bold text-slate-900"
            >
              Messages
            </h2>
            {unreadCount > 0 && !selectedUser && (
              <p className="text-xs font-semibold text-indigo-600">
                {unreadCount} unread
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClosePanel}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {!selectedUser ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <ChatList onSelectChat={handleSelectChat} />
            </div>
          ) : loadingThread ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <button
                type="button"
                onClick={handleBackToList}
                className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-slate-50"
              >
                ← Back to inbox
              </button>
              <div className="min-h-0 flex-1">
                <ChatWindow
                  otherUser={selectedUser}
                  onClose={handleBackToList}
                  variant="panel"
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default MessagesPanel;
