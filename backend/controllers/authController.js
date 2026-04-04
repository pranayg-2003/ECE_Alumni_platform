// controllers/authController.js
// Handles all authentication logic: Register, Login, Get Current User

const User = require("../models/User");
const jwt = require("jsonwebtoken");

const normalizeEmail = (value) => {
  if (value == null) return "";
  return String(value).trim().toLowerCase();
};

// ============================================
// HELPER: Public user shape for API / client
// ============================================
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  interests: user.interests || [],
  skills: user.skills || [],
  bio: user.bio || "",
  profilePicture: user.profilePicture || "",
  coverImage: user.coverImage || "",
  headline: user.headline || "",
  location: user.location || "",
  company: user.company || "",
  jobTitle: user.jobTitle || "",
  graduationYear: user.graduationYear,
  branch: user.branch || "",
  year: user.year,
  createdAt: user.createdAt,
});

// ============================================
// HELPER: Generate JWT Token
// ============================================
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Payload: store user ID in token
    process.env.JWT_SECRET, // Secret key from .env
    { expiresIn: process.env.JWT_EXPIRE || "7d" } // Token expires in 7 days
  );
};

// ============================================
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// ============================================
const register = async (req, res) => {
  try {
    // Destructure fields from request body
    let { name, email, password, role, interests, skills, company, branch, year } = req.body;

    name = typeof name === "string" ? name.trim() : String(name ?? "").trim();
    email = normalizeEmail(email);
    company = typeof company === "string" ? company.trim() : company;
    branch = typeof branch === "string" ? branch.trim() : branch;

    // --- Validation ---
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, password, and role.",
      });
    }

    const emailTaken = await User.exists({ email });
    if (emailTaken) {
      return res.status(400).json({
        success: false,
        message: `This email is already registered: ${email}`,
      });
    }

    // Validate role-specific fields
    if (role === "alumni" && (!company || !String(company).trim())) {
      return res.status(400).json({
        success: false,
        message: "Alumni must provide their company name.",
      });
    }

    if (role === "student" && (!branch || !year)) {
      return res.status(400).json({
        success: false,
        message: "Students must provide their branch and year.",
      });
    }

    // Build user object
    const userData = {
      name,
      email,
      password, // Will be hashed by pre-save middleware in User model
      role,
      interests: interests || [],
      skills: skills || [],
    };

    // Add role-specific fields
    if (role === "alumni") {
      userData.company = String(company).trim();
    }
    if (role === "student") {
      userData.branch = branch;
      userData.year = year;
    }

    // Create user in database
    const user = await User.create(userData);

    // Generate JWT token for the new user
    const token = generateToken(user._id);

    // Send response (exclude password)
    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Register Error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }

    // Duplicate key (e.g. race with exists() check)
    if (error.code === 11000) {
      const dup =
        error.keyValue && typeof error.keyValue === "object"
          ? Object.values(error.keyValue)[0]
          : null;
      return res.status(400).json({
        success: false,
        message: dup
          ? `This email is already registered: ${dup}`
          : "An account with this email already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// ============================================
// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
// ============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailNorm = normalizeEmail(email);

    // Validate input
    if (!emailNorm || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    // Find user by email — we need password so use .select("+password")
    // (Password has select:false in schema, so we must explicitly include it)
    const user = await User.findOne({ email: emailNorm }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.", // Generic message for security
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact admin.",
      });
    }

    // Compare entered password with hashed password in DB
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// ============================================
// @route   GET /api/auth/me
// @desc    Get currently logged-in user's profile
// @access  Private (requires valid JWT)
// ============================================
const getMe = async (req, res) => {
  try {
    // req.user is set by the 'protect' middleware
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// ============================================
// @route   PUT /api/auth/profile
// @desc    Update current user profile (text + image URLs)
// @access  Private
// ============================================
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const {
      name,
      bio,
      profilePicture,
      coverImage,
      headline,
      location,
      jobTitle,
      company,
      branch,
      year,
      graduationYear,
      interests,
      skills,
    } = req.body;

    if (typeof name === "string" && name.trim()) {
      user.name = name.trim().slice(0, 120);
    }
    if (typeof bio === "string") {
      user.bio = bio.trim().slice(0, 2000);
    }
    if (typeof profilePicture === "string") {
      user.profilePicture = profilePicture.trim().slice(0, 2000);
    }
    if (typeof coverImage === "string") {
      user.coverImage = coverImage.trim().slice(0, 2000);
    }
    if (typeof headline === "string") {
      user.headline = headline.trim().slice(0, 220);
    }
    if (typeof location === "string") {
      user.location = location.trim().slice(0, 120);
    }
    if (user.role === "alumni") {
      if (typeof jobTitle === "string") user.jobTitle = jobTitle.trim().slice(0, 120);
      if (typeof company === "string") user.company = company.trim().slice(0, 120);
      if (graduationYear !== undefined && graduationYear !== null && graduationYear !== "") {
        const gy = Number(graduationYear);
        if (!Number.isNaN(gy)) user.graduationYear = gy;
      }
    }
    if (user.role === "student") {
      if (typeof branch === "string") user.branch = branch.trim().slice(0, 120);
      if (year !== undefined && year !== null && year !== "") {
        const y = Number(year);
        if (y >= 1 && y <= 4) user.year = y;
      }
    }
    if (Array.isArray(interests)) {
      user.interests = interests
        .filter((x) => typeof x === "string" && x.trim())
        .map((x) => x.trim().slice(0, 80))
        .slice(0, 30);
    }
    if (Array.isArray(skills)) {
      user.skills = skills
        .filter((x) => typeof x === "string" && x.trim())
        .map((x) => x.trim().slice(0, 80))
        .slice(0, 40);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated.",
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Failed to update profile." });
  }
};

module.exports = { register, login, getMe, updateProfile };
