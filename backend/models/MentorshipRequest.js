// models/MentorshipRequest.js
// Tracks mentorship connection requests between students and alumni

const mongoose = require("mongoose");

const MentorshipRequestSchema = new mongoose.Schema(
  {
    // Student sending the request
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Alumni receiving the request
    alumniId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Status of the request
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },

    // Message from student when sending request
    message: {
      type: String,
      default: "",
    },

    // When alumni accepted/rejected the request
    respondedAt: {
      type: Date,
      default: null,
    },

    // Response message from alumni
    responseMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // createdAt and updatedAt
  }
);

// Prevent duplicate requests from same student to same alumni
MentorshipRequestSchema.index({ studentId: 1, alumniId: 1 }, { unique: true });

module.exports = mongoose.model("MentorshipRequest", MentorshipRequestSchema);
