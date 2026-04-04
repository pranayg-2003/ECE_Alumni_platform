// components/chat/ChatWindow.js
// The main chat interface where messages are displayed and user can type

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const ChatWindow = ({ otherUser, onClose, variant = "page" }) => {
  const { user } = useAuth();
  const {
    activeChat,
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

  // Convert otherUser._id to string for consistent comparisons
  const otherUserIdStr = String(otherUser._id);

  // Set active chat when component opens
  useEffect(() => {
    setActiveChat(otherUser);
  }, [otherUser, setActiveChat]);

  // Mark messages as read in real-time when new messages arrive
  useEffect(() => {
    const hasUnreadMessages = messages.some(
      (msg) => {
        const senderIdStr = typeof msg.senderId === "object" 
          ? String(msg.senderId._id) 
          : String(msg.senderId);
        return senderIdStr === otherUserIdStr && !msg.isRead;
      }
    );

    if (hasUnreadMessages) {
      const markAsRead = async () => {
        try {
          await api.put(`/chat/messages/mark-read/${otherUserIdStr}`);
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      };
      markAsRead();
    }
  }, [messages, otherUserIdStr]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    // Emit typing indicator
    if (!isTyping) {
      setIsTyping(true);
      emitTyping(otherUserIdStr);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitStopTyping(otherUserIdStr);
    }, 1000);
  };

  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim()) return;

    // Send the message
    sendMessage(otherUserIdStr, messageInput);

    // Clear input
    setMessageInput("");
    setIsTyping(false);

    // Stop typing indicator
    emitStopTyping(otherUserIdStr);

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const isUserOnline = onlineUsers.has(otherUserIdStr);
  const isUserTyping = typingUsers.has(otherUserIdStr);

  const shellClass =
    variant === "panel"
      ? "flex h-full min-h-0 flex-1 flex-col bg-white"
      : "flex h-screen flex-col bg-white";

  return (
    <div className={shellClass}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {otherUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{otherUser.name}</h2>
            <p className="text-sm text-gray-500">
              {isUserOnline ? (
                <span className="text-green-500">● Online</span>
              ) : (
                <span className="text-gray-400">● Offline</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Messages Area */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            // Handle both object and string senderId (from API population)
            const senderIdStr =
              typeof msg.senderId === "object"
                ? msg.senderId._id
                : msg.senderId;
            const isOwnMessage = String(senderIdStr) === String(user.id);

            return (
              <div
                key={msg._id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? "text-blue-100" : "text-gray-500"
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

        {/* Typing indicator */}
        {isUserTyping && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-200 p-4 flex gap-2"
      >
        <input
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 border-gray-300 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!messageInput.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-full font-semibold transition"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
