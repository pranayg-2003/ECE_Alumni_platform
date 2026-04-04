const mongoose = require("mongoose");

const FundingPaymentSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "FundingCampaign", required: true, index: true },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amountPaise: { type: Number, required: true, min: 1 },
    orderId: { type: String, required: true, unique: true, trim: true },
    paymentId: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["created", "completed", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FundingPayment", FundingPaymentSchema);
