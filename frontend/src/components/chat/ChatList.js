// components/chat/ChatList.js
// List of all active conversations

import React, { useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { toastApiError } from "../../utils/toast";

const ChatList = ({ onSelectChat }) => {
  const { user } = useAuth();
  const { conversations, setConversations, onlineUsers } = useChat();

  // Fetch conversations on component mount
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
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherUserIdStr = String(conversation.otherUser._id);
        const isOnline = onlineUsers.has(otherUserIdStr);
        const hasUnread = conversation.unreadCount > 0;

        return (
          <div
            key={conversation.connectionId}
            onClick={() => onSelectChat(conversation.otherUser)}
            className={`p-3 rounded-lg cursor-pointer transition ${
              hasUnread
                ? "bg-blue-50 border-l-4 border-blue-500"
                : "hover:bg-gray-100"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {conversation.otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">
                    {conversation.otherUser.name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage || "No messages yet"}
                  </p>
                </div>
              </div>

              {conversation.unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;
