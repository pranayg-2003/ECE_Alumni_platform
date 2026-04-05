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

    // Text (optional if attachments or link are present)
    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 4000,
    },

    /** Shared files (images + documents from upload) */
    attachments: {
      type: [
        {
          url: { type: String, required: true, trim: true },
          kind: { type: String, enum: ["image", "file"], default: "file" },
          name: { type: String, default: "", trim: true, maxlength: 240 },
        },
      ],
      default: [],
    },

    /** Optional highlighted URL (https only) */
    linkUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
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
