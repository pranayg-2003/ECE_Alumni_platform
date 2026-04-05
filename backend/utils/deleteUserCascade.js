const User = require("../models/User");
const Post = require("../models/Post");
const ChatMessage = require("../models/ChatMessage");
const MentorshipRequest = require("../models/MentorshipRequest");
const ReferralSeek = require("../models/ReferralSeek");
const StudentBlock = require("../models/StudentBlock");
const FundingCampaign = require("../models/FundingCampaign");
const FundingPayment = require("../models/FundingPayment");
const AlumniEvent = require("../models/AlumniEvent");
const PasswordResetOTP = require("../models/PasswordResetOTP");

const normalizeEmail = (value) => {
  if (value == null) return "";
  return String(value).trim().toLowerCase();
};

/**
 * Permanently remove a user and dependent records (same rules as self-service account deletion).
 * @param {import("mongoose").Types.ObjectId} userId
 * @param {string} emailRaw — used to clear password-reset OTP rows
 */
async function deleteUserAndRelatedData(userId, emailRaw) {
  const emailNorm = normalizeEmail(emailRaw);

  const campaigns = await FundingCampaign.find({ createdBy: userId }).select("_id").lean();
  const campaignIds = campaigns.map((c) => c._id);
  if (campaignIds.length > 0) {
    await FundingPayment.deleteMany({ campaign: { $in: campaignIds } });
    await FundingCampaign.deleteMany({ _id: { $in: campaignIds } });
  }
  await FundingPayment.deleteMany({ donor: userId });
  await AlumniEvent.deleteMany({ createdBy: userId });

  await ReferralSeek.deleteMany({ studentId: userId });
  await MentorshipRequest.deleteMany({
    $or: [{ studentId: userId }, { alumniId: userId }],
  });
  await ChatMessage.deleteMany({
    $or: [{ senderId: userId }, { receiverId: userId }],
  });
  await StudentBlock.deleteMany({
    $or: [{ studentId: userId }, { alumniId: userId }],
  });

  await Post.deleteMany({ author: userId });
  await Post.updateMany({ likes: userId }, { $pull: { likes: userId } });
  await Post.updateMany(
    { "comments.user": userId },
    { $pull: { comments: { user: userId } } },
  );

  if (emailNorm) {
    await PasswordResetOTP.deleteMany({ email: emailNorm });
  }
  await User.deleteOne({ _id: userId });
}

module.exports = { deleteUserAndRelatedData, normalizeEmail };
