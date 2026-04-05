// server.js
// Main entry point for the Express backend server
// This file ties everything together

const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

// Load .env from this file's directory so admin secret and DB URI load even if
// the process was started from another working directory (e.g. repo root).
dotenv.config({ path: path.join(__dirname, ".env") });

// Connect to MongoDB
connectDB();

/** Always allow these; CLIENT_ORIGIN adds more (comma-separated, no trailing slash). */
const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:3000",
  "https://ece-alumni-platform.vercel.app",
  "https://ece-alumni-platform-1j6i5lxw1-pranay-gupta-s-projects.vercel.app",
  "https://ece-alumni-platform-6aei1bzlr-pranay-gupta-s-projects.vercel.app"
];

/**
 * Browser origins allowed for REST + Socket.io.
 * Merges CLIENT_ORIGIN with defaults so production Vercel isn’t dropped if env only lists a preview URL.
 */
function parseClientOrigins() {
  const raw = process.env.CLIENT_ORIGIN;
  const fromEnv =
    raw && String(raw).trim()
      ? String(raw)
          .split(",")
          .map((o) => o.trim().replace(/\/$/, ""))
          .filter(Boolean)
      : [];
  return [...new Set([...DEFAULT_CLIENT_ORIGINS, ...fromEnv])];
}

const allowedOrigins = parseClientOrigins();

// Initialize Express app
const app = express();

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS so the React app (local or Vercel) can call this API
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Parse incoming JSON requests
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROUTES
// ============================================

// Mount auth routes at /api/auth
app.use("/api/auth", require("./routes/authRoutes"));

// Mount user routes at /api/users
app.use("/api/users", require("./routes/userRoutes"));

// Mount chat routes at /api/chat
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/site", require("./routes/siteRoutes"));
app.use("/api/community", require("./routes/communityRoutes"));
app.use("/api/referrals", require("./routes/referralRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Health check route — useful to verify server is running
app.get("/", (req, res) => {
  res.json({
    message: "🎓 Mentorship Platform API is running!",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      chat: "/api/chat",
      posts: "/api/posts",
      upload: "/api/upload",
      community: "/api/community",
      referrals: "/api/referrals",
      admin: "/api/admin",
    },
  });
});

// ============================================
// 404 HANDLER — For unknown routes
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server.",
  });
});

// ============================================
// SOCKET.IO CONNECTION HANDLING
// ============================================

// Store active users: userId -> socket ID
const activeUsers = new Map();

// Store user connections for typing indicators and online status
const userConnections = new Map();

io.on("connection", (socket) => {
  console.log(`✅ New WebSocket connection: ${socket.id}`);

  // When a user connects and sends their userId
  socket.on("user_connected", (userId) => {
    if (!userId) return;

    activeUsers.set(userId, socket.id);
    userConnections.set(socket.id, userId);

    console.log(`📍 User ${userId} is online (socket: ${socket.id})`);

    // Broadcast to all clients that this user is online
    io.emit("user_online", { userId });
  });

  // Handle real-time message sending
  socket.on("send_message", (data) => {
    try {
      const { senderId, receiverId, message, attachments, linkUrl, _id, createdAt } = data || {};

      const text = message != null ? String(message).trim() : "";
      const att = Array.isArray(attachments) ? attachments : [];
      const link = linkUrl != null ? String(linkUrl).trim() : "";
      const hasBody = text.length > 0 || att.length > 0 || link.length > 0;

      if (!senderId || !receiverId || !hasBody) {
        socket.emit("message_error", {
          error: "Missing required fields",
        });
        return;
      }

      const receiverSocketId = activeUsers.get(String(receiverId));

      // If receiver is online, send message in real-time
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", {
          _id,
          senderId,
          receiverId,
          message: text,
          attachments: att,
          linkUrl: link,
          createdAt: createdAt || new Date(),
          timestamp: createdAt || new Date(),
        });
        console.log(`💬 Real-time message: ${senderId} → ${receiverId}`);
      } else {
        console.log(
          `⏱️  User ${receiverId} offline, message will be fetched from DB`,
        );
      }

      // Emit confirmation to sender
      socket.emit("message_sent", { success: true });
    } catch (error) {
      console.error("Error in send_message:", error);
      socket.emit("message_error", {
        error: "Failed to send message",
      });
    }
  });

  // Handle typing indicator
  socket.on("typing", (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = activeUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user_typing", { senderId });
    }
  });

  // Handle stop typing
  socket.on("stop_typing", (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = activeUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user_stop_typing", { senderId });
    }
  });

  // Handle message read receipt
  socket.on("message_read", (data) => {
    const { senderId, receiverId } = data;
    const senderSocketId = activeUsers.get(senderId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("message_read_receipt", { receiverId });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    const userId = userConnections.get(socket.id);

    if (userId) {
      activeUsers.delete(userId);
      userConnections.delete(socket.id);
      console.log(`❌ User ${userId} disconnected`);

      // Broadcast to all that user went offline
      io.emit("user_offline", { userId });
    }
  });

  // Error handling
  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔌 WebSocket (Socket.io) enabled`);
  try {
    const { isSmtpConfigured } = require("./utils/email");
    if (!isSmtpConfigured()) {
      console.warn(
        "⚠️  SMTP_USER / SMTP_PASS not set — forgot-password codes and registration welcome emails will not be sent. Add them in Render → Environment (Gmail App Password).",
      );
    }
  } catch {
    /* ignore */
  }
});

module.exports = { app, io };
