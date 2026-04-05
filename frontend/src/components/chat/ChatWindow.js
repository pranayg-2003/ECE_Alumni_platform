// components/chat/ChatWindow.js — chat thread (MentorBridge styling)

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import api, { uploadPostMedia } from "../../utils/api";
import { toastApiError } from "../../utils/toast";

const MessageBody = ({ msg, isOwnMessage }) => {
  const atts = Array.isArray(msg.attachments) ? msg.attachments : [];
  const link = (msg.linkUrl || "").trim();
  const text = (msg.message || "").trim();

  return (
    <>
      {text ? (
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</p>
      ) : null}
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-2 block break-all text-[14px] font-medium underline ${
            isOwnMessage ? "text-white/95" : "text-[#0071e3]"
          }`}
        >
          {link}
        </a>
      ) : null}
      {atts.length > 0 && (
        <div className={`mt-2 space-y-2 ${text || link ? "pt-1" : ""}`}>
          {atts.map((a, i) =>
            a.kind === "image" ? (
              <a
                key={`${a.url}-${i}`}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-none border border-black/10 bg-black/[0.03]"
              >
                <img
                  src={a.url}
                  alt={a.name || "Image"}
                  className="max-h-56 w-full object-cover"
                  loading="lazy"
                />
              </a>
            ) : (
              <a
                key={`${a.url}-${i}`}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 rounded-none border px-3 py-2 text-[14px] font-medium ${
                  isOwnMessage
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-black/[0.1] bg-[#f5f5f7] text-[#1d1d1f]"
                }`}
              >
                <span aria-hidden>📎</span>
                <span className="min-w-0 truncate">{a.name || "Document"}</span>
              </a>
            ),
          )}
        </div>
      )}
    </>
  );
};

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
  const [linkUrlDraft, setLinkUrlDraft] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileImgRef = useRef(null);
  const fileDocRef = useRef(null);

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

  const addPendingFiles = (fileList) => {
    const arr = Array.from(fileList || []).filter(Boolean);
    setPendingFiles((prev) => {
      const next = [...prev];
      for (const file of arr) {
        if (next.length >= 6) break;
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
        next.push({ file, preview });
      }
      return next;
    });
  };

  const removePendingAt = (index) => {
    setPendingFiles((prev) => {
      const row = prev[index];
      if (row?.preview) URL.revokeObjectURL(row.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = messageInput.trim();
    const link = linkUrlDraft.trim();
    if (!text && pendingFiles.length === 0 && !link) return;

    setUploading(true);
    emitStopTyping(otherUserIdStr);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);

    try {
      let attachments = [];
      if (pendingFiles.length > 0) {
        const up = await uploadPostMedia(pendingFiles.map((p) => p.file));
        if (!up.success || !Array.isArray(up.data)) {
          throw new Error(up.message || "Upload failed.");
        }
        attachments = up.data.map((x) => ({
          url: x.url,
          kind: x.resourceType === "image" ? "image" : "file",
          name: x.originalName || "attachment",
        }));
      }

      await sendMessage(otherUserIdStr, text, { attachments, linkUrl: link });

      setMessageInput("");
      setLinkUrlDraft("");
      setShowLink(false);
      pendingFiles.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview);
      });
      setPendingFiles([]);
    } catch (err) {
      toastApiError(err, "Could not send message.");
    } finally {
      setUploading(false);
    }
  };

  const isUserOnline = onlineUsers.has(otherUserIdStr);
  const isUserTyping = typingUsers.has(otherUserIdStr);
  const initial = otherUser.name?.charAt(0)?.toUpperCase() || "?";

  const canSend =
    (messageInput.trim() || pendingFiles.length > 0 || linkUrlDraft.trim()) && !uploading;

  const shellClass =
    variant === "panel"
      ? "flex h-full min-h-0 flex-1 flex-col bg-[#f5f5f7]"
      : "flex h-screen min-h-0 flex-col bg-[#f5f5f7]";

  return (
    <div className={shellClass}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] bg-white px-4 py-3.5 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-none bg-[#1d1d1f] text-[15px] font-semibold text-white ring-2 ring-[#f5f5f7]">
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
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-none border border-dashed border-black/[0.08] bg-white/60 px-6 py-10 text-center">
            <p className="text-[15px] font-medium text-[#1d1d1f]">Start the conversation</p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-neutral-500">
              Send text, add a link, or attach photos and documents (PDF, docs, etc.).
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
                  className={`max-w-[85%] rounded-none border px-4 py-2.5 shadow-sm sm:max-w-[75%] ${
                    isOwnMessage
                      ? "border-[#005bbf] bg-gradient-to-br from-[#0071e3] to-[#005bbf] text-white"
                      : "border-black/[0.12] bg-white text-[#1d1d1f]"
                  }`}
                >
                  <MessageBody msg={msg} isOwnMessage={isOwnMessage} />
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
            <div className="flex items-center gap-1.5 rounded-none border border-black/[0.06] bg-white px-4 py-2.5 shadow-sm">
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
        <input
          ref={fileImgRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addPendingFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={fileDocRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            addPendingFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {pendingFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {pendingFiles.map((p, i) => (
              <div
                key={`${p.file.name}-${i}`}
                className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-none border border-black/[0.1] bg-[#f5f5f7] text-[11px] text-neutral-600"
              >
                {p.preview ? (
                  <img src={p.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="px-1 text-center leading-tight">📄 {p.file.name.slice(0, 8)}…</span>
                )}
                <button
                  type="button"
                  onClick={() => removePendingAt(i)}
                  className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-[#1d1d1f]/80 text-[12px] text-white"
                  aria-label="Remove attachment"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {showLink && (
          <div className="mb-3">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Link (https://…)
            </label>
            <input
              type="url"
              value={linkUrlDraft}
              onChange={(e) => setLinkUrlDraft(e.target.value)}
              placeholder="https://github.com/… or portfolio URL"
              className="mt-1 w-full rounded-none border border-black/[0.1] bg-[#fafafa] px-3 py-2 text-[14px] text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
            />
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => fileImgRef.current?.click()}
            disabled={uploading || pendingFiles.length >= 6}
            className="rounded-none border border-black/[0.1] bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f] hover:bg-[#ebebed] disabled:opacity-40"
          >
            Photo
          </button>
          <button
            type="button"
            onClick={() => fileDocRef.current?.click()}
            disabled={uploading || pendingFiles.length >= 6}
            className="rounded-none border border-black/[0.1] bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f] hover:bg-[#ebebed] disabled:opacity-40"
          >
            Document
          </button>
          <button
            type="button"
            onClick={() => setShowLink((v) => !v)}
            className={`rounded-none border px-3 py-1.5 text-[12px] font-semibold ${
              showLink
                ? "border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]"
                : "border-black/[0.1] bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ebebed]"
            }`}
          >
            Link
          </button>
        </div>

        <div className="flex items-end gap-2 rounded-none border border-black/[0.08] bg-[#f5f5f7] p-1.5 pl-4 shadow-inner focus-within:border-[#0071e3]/35 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0071e3]/15">
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder="Message…"
            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[15px] text-[#1d1d1f] outline-none placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="shrink-0 rounded-none bg-[#0071e3] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {uploading ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
