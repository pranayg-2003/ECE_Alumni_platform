// controllers/userController.js
// Handles user-related routes: dashboards, user lists, etc.

const User = require("../models/User");
const MentorshipRequest = require("../models/MentorshipRequest");

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
    const alumni = await User.find({ role: "alumni", isActive: true })
      .select("-password")
      .sort({ createdAt: -1 });

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
    const alumni = await User.find({
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

    const users = await User.find({
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
};
