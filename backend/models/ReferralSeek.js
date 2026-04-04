// models/ReferralSeek.js — Students post what referral help they need; alumni browse openly.

const mongoose = require("mongoose");

const ReferralSeekSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    seekType: {
      type: String,
      enum: ["internship", "full_time", "research", "other"],
      default: "internship",
    },
    /** e.g. "RTL design", "Embedded", "ML intern" */
    targetRoles: {
      type: [String],
      default: [],
    },
    targetCompanies: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    /** Optional link (portfolio, resume, Drive, etc.) */
    linkUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["open", "filled", "closed"],
      default: "open",
      index: true,
    },
  },
  { timestamps: true },
);

ReferralSeekSchema.index({ status: 1, createdAt: -1 });
ReferralSeekSchema.index({ title: "text", summary: "text", targetRoles: "text", skills: "text" });

module.exports = mongoose.model("ReferralSeek", ReferralSeekSchema);
