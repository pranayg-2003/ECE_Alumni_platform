const User = require("../models/User");
const Post = require("../models/Post");
const ChatMessage = require("../models/ChatMessage");
const MentorshipRequest = require("../models/MentorshipRequest");
const ReferralSeek = require("../models/ReferralSeek");

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
      messages,
      mentorshipPending,
      mentorshipAccepted,
      referralOpen,
      signups7d,
      signups30d,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "alumni" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Post.countDocuments({ isPublished: true }),
      ChatMessage.countDocuments(),
      MentorshipRequest.countDocuments({ status: "pending" }),
      MentorshipRequest.countDocuments({ status: "accepted" }),
      ReferralSeek.countDocuments({ status: "open" }),
      User.countDocuments({ createdAt: { $gte: day7 } }),
      User.countDocuments({ createdAt: { $gte: day30 } }),
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

    if (String(userId) === String(req.user._id)) {
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
