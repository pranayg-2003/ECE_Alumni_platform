// controllers/userController.js
// Handles user-related routes: dashboards, user lists, etc.

const User = require("../models/User");
const MentorshipRequest = require("../models/MentorshipRequest");
const StudentBlock = require("../models/StudentBlock");

// ============================================
// @route   GET /api/users/students
// @desc    Get all students (for alumni/admin)
// @access  Private - Alumni and Admin only
// ============================================
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student", isActive: true })
      .select("-password") // Never send password
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ============================================
// @route   GET /api/users/alumni
// @desc    Get all alumni (for students/admin)
// @access  Private
// ============================================
const getAllAlumni = async (req, res) => {
  try {
    let alumni = await User.find({ role: "alumni", isActive: true })
      .select("-password")
      .sort({ createdAt: -1 });

    if (req.user?.role === "student") {
      const blockedAlumniIds = await StudentBlock.find({ studentId: req.user.id })
        .distinct("alumniId")
        .exec();
      const hide = new Set(blockedAlumniIds.map((id) => String(id)));
      alumni = alumni.filter((a) => !hide.has(String(a._id)));
    }

    res.status(200).json({
      success: true,
      count: alumni.length,
      data: alumni,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ============================================
// @route   GET /api/users/all
// @desc    Get all users (admin only)
// @access  Private - Admin only
// ============================================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ============================================
// @route   GET /api/users/stats
// @desc    Get platform stats (admin dashboard)
// @access  Private - Admin only
// ============================================
const getPlatformStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalAlumni = await User.countDocuments({ role: "alumni" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalAlumni,
        totalAdmins,
        totalUsers: totalStudents + totalAlumni + totalAdmins,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ============================================
// @route   GET /api/users/search-alumni?q=name
// @desc    Search alumni by name, skills, company using text search
// @access  Private - Students only
// ============================================
// HOW IT WORKS:
// 1. Uses MongoDB text search on name, bio, skills, and company fields
// 2. User types "harshit" or "jatin" → MongoDB searches across all fields
// 3. Filters to only show active alumni
// 4. Returns matching alumni with relevance score
const searchAlumni = async (req, res) => {
  try {
    const searchQuery = req.query.q; // Get search term from query params: ?q=harshit

    // Validate that search query is provided
    if (!searchQuery || searchQuery.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide a search term",
      });
    }

    const searchTerm = searchQuery.toLowerCase().trim();
    const searchRegex = new RegExp(searchTerm, "i"); // Case-insensitive regex

    // MongoDB search with regex (works without text index)
    // Searches across: name, bio, skills (array), company
    let alumni = await User.find({
      role: "alumni",
      isActive: true,
      $or: [
        { name: searchRegex }, // Search in name field
        { bio: searchRegex }, // Search in bio field
        { company: searchRegex }, // Search in company field
        { skills: searchRegex }, // Search in skills array
        { jobTitle: searchRegex }, // Search in job title
      ],
    })
      .select("-password") // Never send password
      .sort({ createdAt: -1 }) // Newest alumni first
      .limit(20); // Limit to 20 results for performance

    if (req.user?.role === "student") {
      const blockedAlumniIds = await StudentBlock.find({ studentId: req.user.id })
        .distinct("alumniId")
        .exec();
      const hide = new Set(blockedAlumniIds.map((id) => String(id)));
      alumni = alumni.filter((a) => !hide.has(String(a._id)));
    }

    res.status(200).json({
      success: true,
      count: alumni.length,
      data: alumni,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search alumni. Please try again.",
      error: error.message,
    });
  }
};

// ============================================
// @route   GET /api/users/search-network?q=name
// @desc    Alumni search active students and other alumni (excludes self)
// @access  Private - Alumni only
// ============================================
const searchNetwork = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    if (!searchQuery || searchQuery.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide a search term",
      });
    }

    const safe = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(safe, "i");
    const me = req.user.id;

    let users = await User.find({
      _id: { $ne: me },
      isActive: true,
      role: { $in: ["alumni", "student"] },
      $or: [
        { name: searchRegex },
        { bio: searchRegex },
        { skills: searchRegex },
        { interests: searchRegex },
        { company: searchRegex },
        { jobTitle: searchRegex },
        { branch: searchRegex },
        { headline: searchRegex },
        { location: searchRegex },
      ],
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(30);

    const blockedStudentIds = await StudentBlock.find({ alumniId: me })
      .distinct("studentId")
      .exec();
    const hideStudents = new Set(blockedStudentIds.map((id) => String(id)));
    users = users.filter((u) => {
      if (u.role !== "student") return true;
      return !hideStudents.has(String(u._id));
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("searchNetwork error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search. Please try again.",
      error: error.message,
    });
  }
};

// ============================================
// @route   POST /api/users/send-request
// @desc    Student sends mentorship request to alumni
// @access  Private - Students only
// ============================================
const sendMentorshipRequest = async (req, res) => {
  try {
    const { alumniId, message } = req.body;
    const studentId = req.user.id; // Get from auth middleware

    // Validate input
    if (!alumniId) {
      return res.status(400).json({
        success: false,
        message: "Alumni ID is required",
      });
    }

    // Verify alumni exists and is active
    const alumni = await User.findById(alumniId);
    if (!alumni || alumni.role !== "alumni" || !alumni.isActive) {
      return res.status(404).json({
        success: false,
        message: "Alumni not found or inactive",
      });
    }

    const blocked = await StudentBlock.findOne({
      alumniId,
      studentId,
    })
      .select("_id")
      .lean();
    if (blocked) {
      return res.status(403).json({
        success: false,
        message: "This mentor is not accepting requests from you.",
      });
    }

    // Check if request already exists
    const existingRequest = await MentorshipRequest.findOne({
      studentId,
      alumniId,
      status: { $in: ["pending", "accepted"] }, // Don't allow if already pending/accepted
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Request already sent to this alumni",
      });
    }

    // Create new request
    const newRequest = new MentorshipRequest({
      studentId,
      alumniId,
      message: message || "",
      status: "pending",
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: "Request sent successfully",
      data: newRequest,
    });
  } catch (error) {
    console.error("Error sending request:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ============================================
// @route   GET /api/users/:id
// @desc    Get public profile for an alumni or student (for search / directory)
// @access  Private
// ============================================
const getAlumniProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerRole = req.user?.role;

    const profile = await User.findById(id).select("-password");

    if (!profile || !profile.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (profile.role === "admin" && viewerRole !== "admin") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!["alumni", "student"].includes(profile.role)) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ============================================
// @route   GET /api/users/my-requests
// @desc    Get student's sent mentorship requests
// @access  Private - Students only
// ============================================
const getMyRequests = async (req, res) => {
  try {
    const studentId = req.user.id;

    const requests = await MentorshipRequest.find({ studentId })
      .populate("alumniId", "name email company jobTitle")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch requests" });
  }
};

// ============================================
// @route   GET /api/users/incoming-requests
// @desc    Get alumni's incoming mentorship requests
// @access  Private - Alumni only
// ============================================
const getIncomingRequests = async (req, res) => {
  try {
    const alumniId = req.user.id;

    const requests = await MentorshipRequest.find({ alumniId })
      .populate("studentId", "name email branch year interests")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching incoming requests:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch requests" });
  }
};

// ============================================
// @route   PUT /api/users/respond-request/:id
// @desc    Accept or reject a mentorship request
// @access  Private - Alumni only
// ============================================
const respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const alumniId = req.user.id;

    // Validate status
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'accepted' or 'rejected'",
      });
    }

    // Find request and verify it belongs to this alumni
    const request = await MentorshipRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.alumniId.toString() !== alumniId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to respond to this request",
      });
    }

    // Update request
    request.status = status;
    request.respondedAt = new Date();
    request.responseMessage = `Request ${status}`;
    await request.save();

    res.status(200).json({
      success: true,
      message: `Request ${status} successfully`,
      data: request,
    });
  } catch (error) {
    console.error("Error responding to request:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to respond to request" });
  }
};

// ============================================
// @route   POST /api/users/block-student
// @desc    Alumni blocks a student (reason required)
// @access  Private — alumni
// ============================================
const blockStudent = async (req, res) => {
  try {
    const alumniId = req.user.id;
    const { studentId, reason } = req.body;
    const reasonText = typeof reason === "string" ? reason.trim() : "";

    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required." });
    }
    if (reasonText.length < 5) {
      return res
        .status(400)
        .json({ success: false, message: "Please give a short reason (at least 5 characters)." });
    }

    const student = await User.findById(studentId).select("role");
    if (!student || student.role !== "student") {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    await StudentBlock.create({ alumniId, studentId, reason: reasonText });

    await MentorshipRequest.updateMany(
      { alumniId, studentId, status: "pending" },
      { status: "rejected", respondedAt: new Date(), responseMessage: "Blocked by mentor" },
    );

    res.status(201).json({ success: true, message: "Student blocked." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "This student is already blocked." });
    }
    console.error("blockStudent:", error);
    res.status(500).json({ success: false, message: "Could not block student." });
  }
};

// ============================================
// @route   DELETE /api/users/block-student/:studentId
// @desc    Alumni unblocks a student
// @access  Private — alumni
// ============================================
const unblockStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await StudentBlock.deleteOne({
      alumniId: req.user.id,
      studentId,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "No block record found." });
    }
    res.status(200).json({ success: true, message: "Student unblocked." });
  } catch (error) {
    console.error("unblockStudent:", error);
    res.status(500).json({ success: false, message: "Could not unblock." });
  }
};

// ============================================
// @route   GET /api/users/blocked-students
// @desc    List students this alumni has blocked
// @access  Private — alumni
// ============================================
const listBlockedStudents = async (req, res) => {
  try {
    const rows = await StudentBlock.find({ alumniId: req.user.id })
      .populate("studentId", "name email branch year profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    const data = rows.map((r) => ({
      _id: r._id,
      reason: r.reason,
      createdAt: r.createdAt,
      student: r.studentId,
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("listBlockedStudents:", error);
    res.status(500).json({ success: false, message: "Could not load blocked list." });
  }
};

module.exports = {
  getAllStudents,
  getAllAlumni,
  getAllUsers,
  getPlatformStats,
  searchAlumni,
  searchNetwork,
  sendMentorshipRequest,
  getAlumniProfile,
  getMyRequests,
  getIncomingRequests,
  respondToRequest,
  blockStudent,
  unblockStudent,
  listBlockedStudents,
};
