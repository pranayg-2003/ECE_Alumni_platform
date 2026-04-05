// controllers/chatController.js
// Handles chat operations: fetching messages, marking as read, getting conversations

const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const MentorshipRequest = require("../models/MentorshipRequest");
const StudentBlock = require("../models/StudentBlock");

const previewFromMessageDoc = (m) => {
  if (!m) return null;
  const text = (m.message || "").trim();
  const bits = [];
  if (m.linkUrl) bits.push("Link");
  const at = m.attachments || [];
  const imgs = at.filter((x) => x.kind === "image").length;
  const files = at.filter((x) => x.kind === "file").length;
  if (imgs) bits.push(imgs === 1 ? "Photo" : `${imgs} photos`);
  if (files) bits.push(files === 1 ? "File" : `${files} files`);
  if (bits.length && text) return `${text} · ${bits.join(" · ")}`;
  if (bits.length) return bits.join(" · ");
  return text || null;
};

const normalizeChatAttachments = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => a && typeof a.url === "string" && a.url.trim())
    .slice(0, 6)
    .map((a) => ({
      url: a.url.trim().slice(0, 2000),
      kind: a.kind === "image" ? "image" : "file",
      name: String(a.name || "").trim().slice(0, 240),
    }));
};

const sanitizeLinkUrl = (raw) => {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "";
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.href.slice(0, 2000);
  } catch {
    return "";
  }
};

// @desc Get all messages between two users
// @route GET /api/chat/messages/:otherUserId
// @access Private
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { otherUserId } = req.params;

    // Verify that users are connected (mentorship accepted)
    const connection = await MentorshipRequest.findOne({
      $or: [
        { studentId: userId, alumniId: otherUserId },
        { studentId: otherUserId, alumniId: userId },
      ],
      status: "accepted",
    });

    if (!connection) {
      return res.status(403).json({
        success: false,
        message: "You can only chat with connected mentors/students",
      });
    }

    const alumniId = connection.alumniId.toString();
    const studentId = connection.studentId.toString();
    const blocked = await StudentBlock.findOne({ alumniId, studentId }).select("_id").lean();
    if (blocked) {
      return res.status(403).json({
        success: false,
        message: "Messaging is not available for this connection.",
      });
    }

    // Fetch messages between these two users (sorted by date)
    const messages = await ChatMessage.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email")
      .populate("receiverId", "name email");

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

// @desc Save a message to database (called after real-time send via Socket.io)
// @route POST /api/chat/messages
// @access Private
exports.saveMessage = async (req, res) => {
  try {
    const { receiverId, message, attachments: rawAtt, linkUrl: rawLink } = req.body;
    const senderId = req.user.id;

    const text = typeof message === "string" ? message.trim().slice(0, 4000) : "";
    const attachments = normalizeChatAttachments(rawAtt);
    const linkUrl = sanitizeLinkUrl(rawLink);

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Please provide receiverId",
      });
    }

    if (!text && attachments.length === 0 && !linkUrl) {
      return res.status(400).json({
        success: false,
        message: "Add a message, at least one file, or a link.",
      });
    }

    // Verify users are connected
    const connection = await MentorshipRequest.findOne({
      $or: [
        { studentId: senderId, alumniId: receiverId },
        { studentId: receiverId, alumniId: senderId },
      ],
      status: "accepted",
    });

    if (!connection) {
      return res.status(403).json({
        success: false,
        message: "You can only chat with connected mentors/students",
      });
    }

    const alumniId = connection.alumniId.toString();
    const studentId = connection.studentId.toString();
    const blocked = await StudentBlock.findOne({ alumniId, studentId }).select("_id").lean();
    if (blocked) {
      return res.status(403).json({
        success: false,
        message: "Messaging is not available for this connection.",
      });
    }

    const chatMessage = await ChatMessage.create({
      senderId,
      receiverId,
      message: text,
      attachments,
      linkUrl,
    });

    await chatMessage.populate("senderId", "name email");
    await chatMessage.populate("receiverId", "name email");

    res.status(201).json({
      success: true,
      message: "Message saved",
      data: chatMessage,
    });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save message",
      error: error.message,
    });
  }
};

// @desc Get all active conversations for a user
// @route GET /api/chat/conversations
// @access Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all accepted connections
    let connections = await MentorshipRequest.find({
      $or: [{ studentId: userId }, { alumniId: userId }],
      status: "accepted",
    })
      .populate("studentId", "name email avatar")
      .populate("alumniId", "name email avatar");

    if (connections.length > 0) {
      const blockRows = await StudentBlock.find({
        $or: connections.map((c) => ({
          alumniId: c.alumniId._id,
          studentId: c.studentId._id,
        })),
      })
        .select("alumniId studentId")
        .lean();
      const blockedPairs = new Set(
        blockRows.map((b) => `${String(b.alumniId)}:${String(b.studentId)}`),
      );
      connections = connections.filter(
        (c) => !blockedPairs.has(`${String(c.alumniId._id)}:${String(c.studentId._id)}`),
      );
    }

    // For each connection, get the last message
    const conversations = await Promise.all(
      connections.map(async (connection) => {
        const otherUserId =
          connection.studentId._id.toString() === userId
            ? connection.alumniId._id
            : connection.studentId._id;

        const lastMessage = await ChatMessage.findOne({
          $or: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        const unreadCount = await ChatMessage.countDocuments({
          senderId: otherUserId,
          receiverId: userId,
          isRead: false,
        });

        const otherUser =
          connection.studentId._id.toString() === userId
            ? connection.alumniId
            : connection.studentId;

        return {
          connectionId: connection._id,
          otherUser,
          lastMessage: lastMessage ? previewFromMessageDoc(lastMessage) : null,
          lastMessageTime: lastMessage ? lastMessage.createdAt : null,
          unreadCount,
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

// @desc Mark messages as read
// @route PUT /api/chat/messages/mark-read/:otherUserId
// @access Private
exports.markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const connection = await MentorshipRequest.findOne({
      $or: [
        { studentId: userId, alumniId: otherUserId },
        { studentId: otherUserId, alumniId: userId },
      ],
      status: "accepted",
    });
    if (!connection) {
      return res.status(403).json({ success: false, message: "Not connected." });
    }
    const blocked = await StudentBlock.findOne({
      alumniId: connection.alumniId,
      studentId: connection.studentId,
    })
      .select("_id")
      .lean();
    if (blocked) {
      return res.status(403).json({ success: false, message: "Not available." });
    }

    // Mark all unread messages from otherUser as read
    const result = await ChatMessage.updateMany(
      {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
};

// @desc Get unread count for user
// @route GET /api/chat/unread-count
// @access Private
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await ChatMessage.countDocuments({
      receiverId: userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};
