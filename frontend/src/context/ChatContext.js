// context/ChatContext.js
// State management for chat functionality

import React, { createContext, useState, useCallback, useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "../utils/api";
import { toastApiError } from "../utils/toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeChat, setActiveChat] = useState(null); // Currently open chat
  const [messages, setMessages] = useState([]); // Messages in active chat
  const [conversations, setConversations] = useState([]); // List of all conversations
  const [typingUsers, setTypingUsers] = useState(new Set()); // Users currently typing
  const [unreadCount, setUnreadCount] = useState(0); // Total unread messages
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // Users currently online
  const [messagesPanelOpen, setMessagesPanelOpen] = useState(false);
  /** When set with `openMessagesWithUser`, MessagesPanel opens directly to this peer. */
  const [pendingChatUser, setPendingChatUser] = useState(null);

  const openMessagesPanel = useCallback(() => setMessagesPanelOpen(true), []);
  const closeMessagesPanel = useCallback(() => setMessagesPanelOpen(false), []);
  const toggleMessagesPanel = useCallback(
    () => setMessagesPanelOpen((v) => !v),
    [],
  );

  const openMessagesWithUser = useCallback((peer) => {
    if (!peer || !peer._id) return;
    setPendingChatUser(peer);
    setMessagesPanelOpen(true);
  }, []);

  // Unread badge (students & alumni)
  useEffect(() => {
    if (!user || user.role === "admin") return;

    const fetchUnreadCount = async () => {
      try {
        const response = await api.get("/chat/unread-count");
        if (response.data.success) {
          setUnreadCount(response.data.unreadCount);
        }
      } catch {
        /* Polling: avoid toasting repeatedly */
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 25000);
    return () => clearInterval(interval);
  }, [user, setUnreadCount]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io(
      process.env.REACT_APP_API_URL || "http://localhost:5000",
      {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      },
    );

    newSocket.on("connect", () => {
      console.log("✅ Connected to server");
      // Send user ID to server for tracking
      newSocket.emit("user_connected", user.id);
    });

    // User online/offline status updates
    newSocket.on("user_online", (data) => {
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
    });

    newSocket.on("user_offline", (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    // Typing indicators
    newSocket.on("user_typing", (data) => {
      setTypingUsers((prev) => new Set([...prev, data.senderId]));
    });

    newSocket.on("user_stop_typing", (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.senderId);
        return newSet;
      });
    });

    // Message read receipts
    newSocket.on("message_read_receipt", (data) => {
      const { receiverId } = data;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiverId === receiverId ? { ...msg, isRead: true } : msg,
        ),
      );
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Receive messages in real-time
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = async (data) => {
      const {
        senderId,
        receiverId,
        message,
        timestamp,
        attachments,
        linkUrl,
        _id,
        createdAt,
      } = data;

      if (activeChat && String(activeChat._id) === String(senderId)) {
        setMessages((prev) => {
          if (_id && prev.some((m) => String(m._id) === String(_id))) return prev;
          return [
            ...prev,
            {
              _id: _id || Math.random(),
              senderId,
              receiverId,
              message: message || "",
              attachments: Array.isArray(attachments) ? attachments : [],
              linkUrl: linkUrl || "",
              createdAt: createdAt || timestamp,
              isRead: false,
            },
          ];
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, activeChat]);

  // Load messages when activeChat changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChat || !user) {
        setMessages([]);
        return;
      }

      try {
        const response = await api.get(`/chat/messages/${activeChat._id}`);
        if (response.data.success) {
          setMessages(response.data.data);
        }
      } catch (error) {
        toastApiError(error, "Could not load messages.");
      }
    };

    loadMessages();
  }, [activeChat, user]);

  // Send a message (text, optional attachments from upload, optional link)
  const sendMessage = useCallback(
    async (receiverId, messageText, extras = {}) => {
      if (!socket || !user) return;

      const { attachments = [], linkUrl: extraLink = "" } = extras;
      const text = (messageText || "").trim();
      const link = (extraLink || "").trim();

      if (!text && (!attachments || attachments.length === 0) && !link) return;

      try {
        const response = await api.post("/chat/messages", {
          receiverId,
          message: text,
          attachments,
          linkUrl: link,
        });

        if (!response.data?.success || !response.data.data) {
          throw new Error(response.data?.message || "Failed to save message.");
        }

        const saved = response.data.data;

        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(saved._id))) return prev;
          return [...prev, saved];
        });

        socket.emit("send_message", {
          _id: saved._id,
          senderId: user.id,
          receiverId,
          message: saved.message || "",
          attachments: saved.attachments || [],
          linkUrl: saved.linkUrl || "",
          createdAt: saved.createdAt,
        });
      } catch (error) {
        toastApiError(error, "Message could not be sent.");
      }
    },
    [socket, user],
  );

  // Emit typing indicator
  const emitTyping = useCallback(
    (receiverId) => {
      if (!socket || !user) return;
      socket.emit("typing", {
        senderId: user.id,
        receiverId,
      });
    },
    [socket, user],
  );

  // Emit stop typing indicator
  const emitStopTyping = useCallback(
    (receiverId) => {
      if (!socket || !user) return;
      socket.emit("stop_typing", {
        senderId: user.id,
        receiverId,
      });
    },
    [socket, user],
  );

  // Mark messages as read
  const markAsRead = useCallback(
    (receiverId) => {
      if (!socket || !user) return;
      socket.emit("message_read", {
        senderId: user.id,
        receiverId,
      });
    },
    [socket, user],
  );

  const value = {
    socket,
    activeChat,
    setActiveChat,
    messages,
    setMessages,
    conversations,
    setConversations,
    typingUsers,
    unreadCount,
    setUnreadCount,
    onlineUsers,
    sendMessage,
    emitTyping,
    emitStopTyping,
    markAsRead,
    messagesPanelOpen,
    openMessagesPanel,
    closeMessagesPanel,
    toggleMessagesPanel,
    pendingChatUser,
    setPendingChatUser,
    openMessagesWithUser,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
