// components/chat/ChatWindow.js — chat thread (MentorBridge styling)

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const ChatWindow = ({ otherUser, onClose, variant = "page" }) => {
  const { user } = useAuth();
  const {
    setActiveChat,
    messages,
    sendMessage,
    emitTyping,
    emitStopTyping,
    typingUsers,
    onlineUsers,
  } = useChat();

  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const otherUserIdStr = String(otherUser._id);

  useEffect(() => {
    setActiveChat(otherUser);
  }, [otherUser, setActiveChat]);

  useEffect(() => {
    const hasUnreadMessages = messages.some((msg) => {
      const senderIdStr =
        typeof msg.senderId === "object" ? String(msg.senderId._id) : String(msg.senderId);
      return senderIdStr === otherUserIdStr && !msg.isRead;
    });

    if (hasUnreadMessages) {
      const markAsRead = async () => {
        try {
          await api.put(`/chat/messages/mark-read/${otherUserIdStr}`);
        } catch {
          /* non-blocking */
        }
      };
      markAsRead();
    }
  }, [messages, otherUserIdStr]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      emitTyping(otherUserIdStr);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitStopTyping(otherUserIdStr);
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim()) return;

    sendMessage(otherUserIdStr, messageInput);

    setMessageInput("");
    setIsTyping(false);

    emitStopTyping(otherUserIdStr);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const isUserOnline = onlineUsers.has(otherUserIdStr);
  const isUserTyping = typingUsers.has(otherUserIdStr);
  const initial = otherUser.name?.charAt(0)?.toUpperCase() || "?";

  const shellClass =
    variant === "panel"
      ? "flex h-full min-h-0 flex-1 flex-col bg-[#f5f5f7]"
      : "flex h-screen min-h-0 flex-col bg-[#f5f5f7]";

  return (
    <div className={shellClass}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] bg-white px-4 py-3.5 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1d1d1f] text-[15px] font-semibold text-white ring-2 ring-[#f5f5f7]">
              {initial}
            </div>
            {isUserOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#34c759]" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-semibold text-[#1d1d1f]">{otherUser.name}</h2>
            <p className="text-[12px] font-medium text-neutral-500">
              {isUserTyping ? (
                <span className="text-[#0071e3]">Typing…</span>
              ) : isUserOnline ? (
                <span className="text-[#34c759]">Active now</span>
              ) : (
                <span>Offline</span>
              )}
            </p>
          </div>
        </div>
        {variant !== "panel" && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
            aria-label="Close chat"
          >
            ✕
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-[20px] border border-dashed border-black/[0.08] bg-white/60 px-6 py-10 text-center">
            <p className="text-[15px] font-medium text-[#1d1d1f]">Start the conversation</p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-neutral-500">
              Send a quick hello or share what you’d like help with—messages stay between you two.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const senderIdStr =
              typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
            const isOwnMessage = String(senderIdStr) === String(user.id);

            return (
              <div
                key={msg._id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[20px] px-4 py-2.5 shadow-sm sm:max-w-[75%] ${
                    isOwnMessage
                      ? "rounded-br-md bg-gradient-to-br from-[#0071e3] to-[#005bbf] text-white"
                      : "rounded-bl-md border border-black/[0.06] bg-white text-[#1d1d1f]"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{msg.message}</p>
                  <p
                    className={`mt-1.5 text-[11px] font-medium tabular-nums ${
                      isOwnMessage ? "text-white/70" : "text-neutral-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {isUserTyping && (
          <div className="flex justify-start pl-1">
            <div className="flex items-center gap-1.5 rounded-2xl border border-black/[0.06] bg-white px-4 py-2.5 shadow-sm">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="shrink-0 border-t border-black/[0.06] bg-white p-3 sm:p-4"
      >
        <div className="flex items-end gap-2 rounded-[22px] border border-black/[0.08] bg-[#f5f5f7] p-1.5 pl-4 shadow-inner focus-within:border-[#0071e3]/35 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0071e3]/15">
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder="Message…"
            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[15px] text-[#1d1d1f] outline-none placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="shrink-0 rounded-full bg-[#0071e3] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
