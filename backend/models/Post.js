const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    resourceType: {
      type: String,
      enum: ["image", "raw"],
      default: "image",
    },
    originalName: { type: String, default: "", trim: true },
    mimeType: { type: String, default: "", trim: true },
    publicId: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    thumbnailUrl: {
      type: String,
      default: "",
      trim: true,
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [CommentSchema],
    isPublished: {
      type: Boolean,
      default: true,
    },
    palette: {
      type: String,
      enum: ["orchid", "sky", "sunset"],
      default: "orchid",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", PostSchema);
