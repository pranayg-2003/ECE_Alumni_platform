// models/User.js
// This is the Mongoose schema/model for our User collection in MongoDB

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    // Basic Info (required for all users)
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true, // No two users can have the same email
      lowercase: true,
      // Allow common TLDs (.info, .online, …); avoid the old \w{2,3} limit
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries by default
    },

    // Role determines what the user can do on the platform
    role: {
      type: String,
      enum: ["student", "alumni", "admin"], // Only these 3 values allowed
      default: "student",
    },

    // Common fields for both students and alumni
    interests: {
      type: [String], // Array of strings e.g. ["Web Dev", "AI/ML"]
      default: [],
    },

    skills: {
      type: [String], // Array of strings e.g. ["React", "Python"]
      default: [],
    },

    bio: {
      type: String,
      default: "",
    },

    profilePicture: {
      type: String,
      default: "", // URL to profile picture
    },

    coverImage: {
      type: String,
      default: "", // wide banner / cover photo URL
    },

    headline: {
      type: String,
      default: "",
      maxlength: 220,
      trim: true,
    },

    location: {
      type: String,
      default: "",
      maxlength: 120,
      trim: true,
    },

    // ---- ALUMNI ONLY FIELDS ----
    company: {
      type: String,
      default: "", // Current company where alumni works
    },

    jobTitle: {
      type: String,
      default: "", // e.g. "Software Engineer at Google"
    },

    graduationYear: {
      type: Number,
      default: null,
    },

    // ---- STUDENT ONLY FIELDS ----
    branch: {
      type: String,
      default: "", // e.g. "Computer Science", "Mechanical Engineering"
    },

    year: {
      type: Number,
      default: null, // 1, 2, 3, or 4
      min: 1,
      max: 4,
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// ============================================
// MIDDLEWARE: Hash password before saving
// ============================================
// This runs automatically before every .save() call
UserSchema.pre("save", async function (next) {
  // Only hash if password was modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  // Generate salt (10 rounds is a good balance of security and speed)
  const salt = await bcrypt.genSalt(10);

  // Replace plain text password with hashed version
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ============================================
// METHOD: Compare entered password with hash
// ============================================
// Used during login to verify the password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ============================================
// TEXT INDEX: For efficient full-text search
// ============================================
// Creates a text index on name, bio, skills, and company for fast alumni search
UserSchema.index({ name: "text", bio: "text", skills: "text", company: "text" });

module.exports = mongoose.model("User", UserSchema);
