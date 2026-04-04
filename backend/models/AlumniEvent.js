const mongoose = require("mongoose");

const AlumniEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 8000 },
    googleMeetLink: { type: String, required: true, trim: true, maxlength: 2000 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AlumniEventSchema.index({ startsAt: 1, status: 1 });

module.exports = mongoose.model("AlumniEvent", AlumniEventSchema);
