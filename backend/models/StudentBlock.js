const mongoose = require("mongoose");

/** Alumni blocks a student (no requests, no chat) */
const StudentBlockSchema = new mongoose.Schema(
  {
    alumniId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

StudentBlockSchema.index({ alumniId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("StudentBlock", StudentBlockSchema);
