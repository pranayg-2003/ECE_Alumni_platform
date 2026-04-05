const mongoose = require("mongoose");

const successStorySchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    headline: { type: String, default: "" },
    detail: { type: String, default: "" },
    company: { type: String, default: "" },
  },
  { _id: false },
);

const statItemSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    value: { type: String, default: "" },
    sublabel: { type: String, default: "" },
  },
  { _id: false },
);

const spotlightSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    role: { type: String, default: "" },
    company: { type: String, default: "" },
    contribution: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
  },
  { _id: false },
);

const galleryItemSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    kind: { type: String, enum: ["image", "video"], default: "image" },
    caption: { type: String, default: "" },
  },
  { _id: false },
);

const timelineItemSchema = new mongoose.Schema(
  {
    year: { type: String, default: "" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false },
);

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    landing: {
      heroTitle: { type: String, default: "" },
      heroSubtitle: { type: String, default: "" },
      heroBadge: { type: String, default: "" },
      heroImageUrl: { type: String, default: "" },
      heroVideoUrl: { type: String, default: "" },
      heroYoutubeUrl: { type: String, default: "" },
      successStories: { type: [successStorySchema], default: [] },
      departmentEyebrow: { type: String, default: "" },
      departmentTitle: { type: String, default: "" },
      departmentBody: { type: String, default: "" },
      departmentHighlight: { type: String, default: "" },
      departmentImageUrl: { type: String, default: "" },
      stats: { type: [statItemSchema], default: [] },
      spotlights: { type: [spotlightSchema], default: [] },
      impactTitle: { type: String, default: "" },
      impactSubtitle: { type: String, default: "" },
      timelineTitle: { type: String, default: "" },
      timelineSubtitle: { type: String, default: "" },
      timeline: { type: [timelineItemSchema], default: [] },
      closingTitle: { type: String, default: "" },
      closingSubtitle: { type: String, default: "" },
      gallery: { type: [galleryItemSchema], default: [] },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
