// models/ChatMessage.js
// Stores messages between connected users (students and alumni)

const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema(
  {
    // The person sending the message
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The person receiving the message
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The actual message content
    message: {
      type: String,
      required: [true, "Please provide a message"],
      trim: true,
    },

    // To track if message has been read by receiver
    isRead: {
      type: Boolean,
      default: false,
    },

    // When the receiver read the message
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  },
);

// Index for faster queries (finding messages between two users)
ChatMessageSchema.index({ senderId: 1, receiverId: 1 });
ChatMessageSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
