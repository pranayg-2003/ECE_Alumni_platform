// routes/authRoutes.js
// Defines all authentication-related API endpoints

const express = require("express");
const router = express.Router();

// Import controller functions
const {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// Import middleware
const { protect } = require("../middleware/auth");

// =============================================
// PUBLIC ROUTES (no token required)
// =============================================

// POST /api/auth/register — Create new account
router.post("/register", register);

// POST /api/auth/login — Login and get token
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// =============================================
// PRIVATE ROUTES (token required)
// =============================================

// GET /api/auth/me — Get current user info
// 'protect' middleware runs first to verify JWT
router.get("/me", protect, getMe);

router.put("/profile", protect, updateProfile);

module.exports = router;
