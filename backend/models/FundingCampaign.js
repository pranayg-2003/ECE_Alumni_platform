const mongoose = require("mongoose");

const FundingCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 8000 },
    goalAmount: { type: Number, min: 0, default: null },
    raisedAmount: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "INR", trim: true, maxlength: 8 },
    /** External donate / payment page (UPI, college portal, etc.) — optional alongside Razorpay */
    externalUrl: { type: String, default: "", trim: true, maxlength: 2000 },
    /** When true and Razorpay is configured, donors can pay with UPI / card (INR only) */
    acceptRazorpay: { type: Boolean, default: true },
    imageUrl: { type: String, default: "", trim: true, maxlength: 2000 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FundingCampaign", FundingCampaignSchema);
