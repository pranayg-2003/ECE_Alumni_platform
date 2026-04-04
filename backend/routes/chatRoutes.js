// routes/chatRoutes.js
// Routes for chat operations

const express = require("express");
const router = express.Router();
const {
  getMessages,
  saveMessage,
  getConversations,
  markMessagesAsRead,
  getUnreadCount,
} = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Get all conversations for current user
router.get("/conversations", getConversations);

// Get messages between two users
router.get("/messages/:otherUserId", getMessages);

// Save a new message
router.post("/messages", saveMessage);

// Mark messages as read
router.put("/messages/mark-read/:otherUserId", markMessagesAsRead);

// Get unread message count
router.get("/unread-count", getUnreadCount);

module.exports = router;
