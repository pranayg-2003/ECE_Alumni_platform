const User = require("../models/User");
const Post = require("../models/Post");
const ChatMessage = require("../models/ChatMessage");
const MentorshipRequest = require("../models/MentorshipRequest");
const ReferralSeek = require("../models/ReferralSeek");
const { deleteUserAndRelatedData } = require("../utils/deleteUserCascade");

const safeCount = async (label, fn) => {
  try {
    return await fn();
  } catch (err) {
    console.error(`[admin activity] ${label}:`, err.message || err);
    return 0;
  }
};

// @route GET /api/admin/activity
// @access admin
exports.getActivityOverview = async (req, res) => {
  try {
    const now = new Date();
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      students,
      alumni,
      admins,
      activeUsers,
      inactiveUsers,
      posts,
      postsAll,
      messages,
      mentorshipPending,
      mentorshipAccepted,
      referralOpen,
      signups7d,
      signups30d,
    ] = await Promise.all([
      safeCount("users", () => User.countDocuments()),
      safeCount("students", () => User.countDocuments({ role: "student" })),
      safeCount("alumni", () => User.countDocuments({ role: "alumni" })),
      safeCount("admins", () => User.countDocuments({ role: "admin" })),
      safeCount("activeUsers", () => User.countDocuments({ isActive: true })),
      safeCount("inactiveUsers", () => User.countDocuments({ isActive: false })),
      safeCount("postsPublished", () => Post.countDocuments({ isPublished: true })),
      safeCount("postsAll", () => Post.countDocuments()),
      safeCount("messages", () => ChatMessage.countDocuments()),
      safeCount("mentorshipPending", () => MentorshipRequest.countDocuments({ status: "pending" })),
      safeCount("mentorshipAccepted", () => MentorshipRequest.countDocuments({ status: "accepted" })),
      safeCount("referralOpen", () => ReferralSeek.countDocuments({ status: "open" })),
      safeCount("signups7d", () => User.countDocuments({ createdAt: { $gte: day7 } })),
      safeCount("signups30d", () => User.countDocuments({ createdAt: { $gte: day30 } })),
    ]);

    const recentUsers = await User.find()
      .select("name email role isActive createdAt branch year company")
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          students,
          alumni,
          admins,
          activeUsers,
          inactiveUsers,
          posts,
          postsAll,
          messages,
          mentorshipPending,
          mentorshipAccepted,
          referralOpen,
        },
        signups: { last7Days: signups7d, last30Days: signups30d },
        recentUsers,
      },
    });
  } catch (e) {
    console.error("getActivityOverview:", e);
    res.status(500).json({ success: false, message: "Could not load activity." });
  }
};

// @route PUT /api/admin/users/:userId/block
// @access admin
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";

    const adminSelf = req.user._id ?? req.user.id;
    if (String(userId) === String(adminSelf)) {
      return res.status(400).json({ success: false, message: "You cannot block your own account." });
    }

    const target = await User.findById(userId).select("role isActive");
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (target.role === "admin") {
      return res.status(403).json({ success: false, message: "Admin accounts cannot be blocked from here." });
    }

    await User.updateOne(
      { _id: userId },
      {
        isActive: false,
        blockedReason: reason.slice(0, 500),
        blockedAt: new Date(),
      },
    );

    res.status(200).json({ success: true, message: "User has been blocked." });
  } catch (e) {
    console.error("blockUser:", e);
    res.status(500).json({ success: false, message: "Could not block user." });
  }
};

// @route PUT /api/admin/users/:userId/unblock
// @access admin
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const target = await User.findById(userId).select("_id");
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await User.updateOne(
      { _id: userId },
      {
        isActive: true,
        blockedReason: "",
        blockedAt: null,
      },
    );

    res.status(200).json({ success: true, message: "User has been unblocked." });
  } catch (e) {
    console.error("unblockUser:", e);
    res.status(500).json({ success: false, message: "Could not unblock user." });
  }
};

// @route DELETE /api/admin/users/:userId
// @access admin — permanent delete (posts, chat, mentorship, etc.)
exports.deleteUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminSelf = req.user._id ?? req.user.id;
    if (String(userId) === String(adminSelf)) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    }

    const target = await User.findById(userId).select("role email name");
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (target.role === "admin") {
      return res.status(403).json({ success: false, message: "Admin accounts cannot be deleted from the dashboard." });
    }

    console.info(`[admin] delete user ${userId} (${target.email}) by admin ${adminSelf}`);

    await deleteUserAndRelatedData(target._id, target.email);

    res.status(200).json({
      success: true,
      message: "User account and related data have been permanently deleted.",
    });
  } catch (e) {
    console.error("deleteUserAccount:", e);
    res.status(500).json({ success: false, message: "Could not delete user." });
  }
};

const postPopulateConfig = [
  { path: "author", select: "name role profilePicture company branch year jobTitle email" },
  { path: "comments.user", select: "name role profilePicture email" },
];

// @route GET /api/admin/posts
// @access admin — full post list for moderation (published + drafts)
exports.listPostsForModeration = async (req, res) => {
  try {
    let rawQ = typeof req.query.q === "string" ? req.query.q.trim() : "";
    rawQ = rawQ.replace(/\0/g, "").slice(0, 200);
    let authorRaw = typeof req.query.author === "string" ? req.query.author.trim() : "";
    authorRaw = authorRaw.replace(/\0/g, "").slice(0, 120);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 80, 1), 200);
    const filter = {};
    if (rawQ) {
      const esc = rawQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      try {
        filter.content = new RegExp(esc, "i");
      } catch (regexErr) {
        console.warn("listPostsForModeration regex:", regexErr.message);
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
    }

    if (authorRaw) {
      const escA = authorRaw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let authorRegex;
      try {
        authorRegex = new RegExp(escA, "i");
      } catch {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      const matchingUsers = await User.find({
        $or: [{ name: authorRegex }, { email: authorRegex }],
      })
        .select("_id")
        .lean();
      if (matchingUsers.length === 0) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      filter.author = { $in: matchingUsers.map((u) => u._id) };
    }

    const posts = await Post.find(filter)
      .populate(postPopulateConfig)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (e) {
    console.error("listPostsForModeration:", e);
    res.status(500).json({ success: false, message: "Could not load posts." });
  }
};
