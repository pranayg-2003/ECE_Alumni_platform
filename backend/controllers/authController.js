// controllers/authController.js
// Handles all authentication logic: Register, Login, Get Current User, Password reset

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const PasswordResetOTP = require("../models/PasswordResetOTP");
const Post = require("../models/Post");
const ChatMessage = require("../models/ChatMessage");
const MentorshipRequest = require("../models/MentorshipRequest");
const ReferralSeek = require("../models/ReferralSeek");
const StudentBlock = require("../models/StudentBlock");
const FundingCampaign = require("../models/FundingCampaign");
const FundingPayment = require("../models/FundingPayment");
const AlumniEvent = require("../models/AlumniEvent");
const jwt = require("jsonwebtoken");
const {
  sendPasswordResetOtpEmail,
  isMailConfigured,
  sendWelcomeEmail,
} = require("../utils/email");

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
  socialLinks: user.socialLinks || [],
  achievements: user.achievements || [],
  createdAt: user.createdAt,
});

const normalizeUrl = (raw) => {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "";
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString();
  } catch {
    return "";
  }
};

const sanitizeSocialLinks = (arr) => {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 80) : "";
    const url = normalizeUrl(item.url);
    if (!title || !url) continue;
    out.push({ title, url });
    if (out.length >= 12) break;
  }
  return out;
};

const sanitizeAchievements = (arr) => {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 160) : "";
    if (!title) continue;
    const description =
      typeof item.description === "string" ? item.description.trim().slice(0, 600) : "";
    const issuer = typeof item.issuer === "string" ? item.issuer.trim().slice(0, 120) : "";
    let year = null;
    if (item.year !== undefined && item.year !== null && item.year !== "") {
      const y = Number(item.year);
      if (!Number.isNaN(y) && y >= 1950 && y <= 2100) year = y;
    }
    out.push({ title, description, issuer, year });
    if (out.length >= 25) break;
  }
  return out;
};

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
    let {
      name,
      email,
      password,
      role,
      interests,
      skills,
      company,
      branch,
      year,
      adminSecret,
    } = req.body;

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

    if (!["student", "alumni", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    if (role === "admin") {
      const sec = String(process.env.ADMIN_REGISTER_SECRET ?? "").trim();
      const isProd = process.env.NODE_ENV === "production";
      const minLen = isProd ? 8 : 4;
      if (!sec || sec.length < minLen) {
        return res.status(403).json({
          success: false,
          message: isProd
            ? "Admin registration is disabled until ADMIN_REGISTER_SECRET is set in backend/.env (8+ characters). Restart the server after saving."
            : "Admin registration needs ADMIN_REGISTER_SECRET in backend/.env (4+ characters in development, 8+ in production). Restart the server after saving.",
        });
      }
      if (String(adminSecret || "").trim() !== sec) {
        return res.status(403).json({
          success: false,
          message: "Invalid admin registration secret. It must match ADMIN_REGISTER_SECRET in backend/.env exactly.",
        });
      }
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

    sendWelcomeEmail(user.email, user.name, user.role).catch((err) => {
      console.warn("[auth] welcome email skipped:", err.message || err);
    });

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
        code: "ACCOUNT_DISABLED",
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
    if (Array.isArray(req.body.socialLinks)) {
      user.socialLinks = sanitizeSocialLinks(req.body.socialLinks);
    }
    if (Array.isArray(req.body.achievements)) {
      user.achievements = sanitizeAchievements(req.body.achievements);
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

// ============================================
// @route   POST /api/auth/forgot-password
// @desc    Send 6-digit OTP to email (Gmail SMTP)
// @access  Public
// ============================================
const forgotPassword = async (req, res) => {
  const emailNorm = normalizeEmail(req.body.email);
  const genericOk = () =>
    res.status(200).json({
      success: true,
      message:
        "If an account exists for this email, a verification code has been sent.",
    });

  try {
    if (!emailNorm) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address.",
      });
    }

    const user = await User.findOne({ email: emailNorm });
    if (!user || !user.isActive) {
      return genericOk();
    }

    const existing = await PasswordResetOTP.findOne({ email: emailNorm });
    if (
      existing &&
      existing.lastSentAt &&
      Date.now() - new Date(existing.lastSentAt).getTime() < 60 * 1000
    ) {
      return genericOk();
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordResetOTP.findOneAndUpdate(
      { email: emailNorm },
      {
        email: emailNorm,
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true }
    );

    try {
      await sendPasswordResetOtpEmail(emailNorm, otp, user.name);
    } catch (mailErr) {
      const msg = mailErr && mailErr.message;
      if (msg === "SMTP_NOT_CONFIGURED" || !isMailConfigured()) {
        console.info(
          `[forgot-password] Mail not configured; OTP for ${emailNorm} (dev only): ${otp}`
        );
        return genericOk();
      }
      console.error("forgot-password mail error:", mailErr);
      if (mailErr.code === "EMAIL_SEND_TIMEOUT" || msg === "EMAIL_SEND_TIMEOUT") {
        return res.status(503).json({
          success: false,
          message:
            "Email delivery timed out. On Render, use RESEND_API_KEY (Resend.com) instead of Gmail SMTP, or check your network.",
        });
      }
      if (
        mailErr.code === "ETIMEDOUT" ||
        mailErr.code === "ESOCKET" ||
        mailErr.code === "ECONNREFUSED"
      ) {
        return res.status(503).json({
          success: false,
          message:
            "Cannot connect to the mail server from this host. Add RESEND_API_KEY from resend.com (free tier) — it uses HTTPS and works on Render.",
        });
      }
      if (mailErr.code === "RESEND_API_ERROR") {
        return res.status(502).json({
          success: false,
          message:
            "Email provider rejected the request. Check RESEND_FROM matches a verified domain in Resend, or fix RESEND_API_KEY.",
        });
      }
      const isAuthFail =
        mailErr.code === "EAUTH" ||
        mailErr.responseCode === 535 ||
        (mailErr.message && String(mailErr.message).toLowerCase().includes("invalid login"));
      return res.status(500).json({
        success: false,
        message: isAuthFail
          ? "Could not sign in to the mail server. Use a Gmail App Password (16 characters), not your normal password, and set SMTP_USER to that Gmail address."
          : "Could not send email. For production on Render, prefer RESEND_API_KEY over Gmail SMTP.",
      });
    }

    return genericOk();
  } catch (error) {
    console.error("forgotPassword Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// ============================================
// @route   POST /api/auth/reset-password
// @desc    Verify OTP and set new password
// @access  Public
// ============================================
const resetPassword = async (req, res) => {
  try {
    const emailNorm = normalizeEmail(req.body.email);
    const otpRaw = req.body.otp != null ? String(req.body.otp).trim() : "";
    const otpDigits = otpRaw.replace(/\D/g, "");
    const newPassword = req.body.newPassword;

    if (!emailNorm || !otpDigits || newPassword == null || newPassword === "") {
      return res.status(400).json({
        success: false,
        message: "Email, verification code, and new password are required.",
      });
    }

    if (otpDigits.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Enter the 6-digit code from your email.",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const doc = await PasswordResetOTP.findOne({ email: emailNorm });
    if (!doc || new Date(doc.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Request a new one.",
      });
    }

    const attemptsSoFar = doc.attempts ?? 0;
    if (attemptsSoFar >= 8) {
      await PasswordResetOTP.deleteOne({ _id: doc._id });
      return res.status(400).json({
        success: false,
        message: "Too many attempts. Request a new code.",
      });
    }

    const match = await bcrypt.compare(otpDigits, doc.otpHash);
    if (!match) {
      doc.attempts = attemptsSoFar + 1;
      await doc.save();
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    const user = await User.findOne({ email: emailNorm }).select("+password");
    if (!user) {
      await PasswordResetOTP.deleteOne({ _id: doc._id });
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    user.password = newPassword;
    // Full-document validation can fail on older/partial profiles; password rules are already checked above.
    await user.save({ validateBeforeSave: false });
    await PasswordResetOTP.deleteOne({ _id: doc._id });

    res.status(200).json({
      success: true,
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (error) {
    console.error("resetPassword Error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ") || "Could not update password.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// ============================================
// @route   DELETE /api/auth/account
// @desc    Permanently delete own account and related data
// @access  Private
// ============================================
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const email = req.user.email;
    let reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";

    if (role === "alumni" && reason.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Alumni must provide a reason for deleting the account (at least 10 characters).",
      });
    }

    console.info(
      `[auth] account deletion user=${userId} role=${role} reason=${reason ? `"${reason.slice(0, 200)}"` : "(none)"}`,
    );

    const campaigns = await FundingCampaign.find({ createdBy: userId }).select("_id").lean();
    const campaignIds = campaigns.map((c) => c._id);
    if (campaignIds.length > 0) {
      await FundingPayment.deleteMany({ campaign: { $in: campaignIds } });
      await FundingCampaign.deleteMany({ _id: { $in: campaignIds } });
    }
    await FundingPayment.deleteMany({ donor: userId });
    await AlumniEvent.deleteMany({ createdBy: userId });

    await ReferralSeek.deleteMany({ studentId: userId });
    await MentorshipRequest.deleteMany({
      $or: [{ studentId: userId }, { alumniId: userId }],
    });
    await ChatMessage.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });
    await StudentBlock.deleteMany({
      $or: [{ studentId: userId }, { alumniId: userId }],
    });

    await Post.deleteMany({ author: userId });
    await Post.updateMany({ likes: userId }, { $pull: { likes: userId } });
    await Post.updateMany(
      { "comments.user": userId },
      { $pull: { comments: { user: userId } } },
    );

    await PasswordResetOTP.deleteMany({ email: normalizeEmail(email) });
    await User.deleteOne({ _id: userId });

    res.status(200).json({
      success: true,
      message: "Your account has been deleted.",
    });
  } catch (error) {
    console.error("deleteAccount Error:", error);
    res.status(500).json({
      success: false,
      message: "Could not delete account. Please try again or contact support.",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  deleteAccount,
};
