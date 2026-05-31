// Visiting /chat opens the messages side panel and returns to the feed.

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";

const ChatDashboard = () => {
  const navigate = useNavigate();
  const { openMessagesPanel } = useChat();

  useEffect(() => {
    openMessagesPanel();
    navigate("/feed", { replace: true });
  }, [openMessagesPanel, navigate]);

  return (
    <div className="dashboard-apple-bg flex min-h-screen items-center justify-center font-sans text-sm text-gray-500">
      Opening messages…
    </div>
  );
};

export default ChatDashboard;
