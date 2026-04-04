const crypto = require("crypto");
const FundingCampaign = require("../models/FundingCampaign");
const AlumniEvent = require("../models/AlumniEvent");
const FundingPayment = require("../models/FundingPayment");
const { getRazorpay, isRazorpayReady, getPublicKey } = require("../utils/razorpayClient");

const creatorPopulate = { path: "createdBy", select: "name email role profilePicture company jobTitle" };

const isMeetUrl = (raw) => {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return false;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    return host === "meet.google.com" || host.endsWith(".meet.google.com");
  } catch {
    return false;
  }
};

const isHttpsUrl = (raw) => {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return true;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

const fundingListQuery = (req) => {
  if (req.user.role === "admin") return {};
  if (req.user.role === "alumni") {
    return { $or: [{ isActive: true }, { createdBy: req.user.id }] };
  }
  return { isActive: true };
};

const eventListQuery = (req) => {
  if (req.user.role === "admin") return {};
  if (req.user.role === "alumni") {
    return {
      $or: [
        { status: { $in: ["scheduled", "completed"] } },
        { createdBy: req.user.id },
      ],
    };
  }
  return { status: { $in: ["scheduled", "completed"] } };
};

const canManageDoc = (req, doc) => {
  if (req.user.role === "admin") return true;
  if (!doc?.createdBy) return false;
  return doc.createdBy.toString() === req.user.id.toString();
};

// --- Funding ---

const listFunding = async (req, res) => {
  try {
    const campaigns = await FundingCampaign.find(fundingListQuery(req))
      .populate(creatorPopulate)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: campaigns.length, data: campaigns });
  } catch (e) {
    console.error("listFunding", e);
    res.status(500).json({ success: false, message: "Could not load funding campaigns." });
  }
};

const createFunding = async (req, res) => {
  try {
    const {
      title,
      description,
      goalAmount,
      raisedAmount,
      currency,
      externalUrl,
      imageUrl,
      isActive,
      acceptRazorpay,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }

    let ext = typeof externalUrl === "string" ? externalUrl.trim() : "";
    if (ext && !isHttpsUrl(ext)) {
      return res.status(400).json({ success: false, message: "Contribution link must be a valid URL." });
    }

    let goal = null;
    if (goalAmount !== undefined && goalAmount !== null && goalAmount !== "") {
      const g = Number(goalAmount);
      if (!Number.isNaN(g) && g >= 0) goal = g;
    }

    let raised = 0;
    if (raisedAmount !== undefined && raisedAmount !== null && raisedAmount !== "") {
      const r = Number(raisedAmount);
      if (!Number.isNaN(r) && r >= 0) raised = r;
    }

    const doc = await FundingCampaign.create({
      title: String(title).trim().slice(0, 200),
      description: typeof description === "string" ? description.trim().slice(0, 8000) : "",
      goalAmount: goal,
      raisedAmount: raised,
      currency: typeof currency === "string" ? currency.trim().slice(0, 8).toUpperCase() || "INR" : "INR",
      externalUrl: ext.slice(0, 2000),
      acceptRazorpay: acceptRazorpay === false ? false : true,
      imageUrl: typeof imageUrl === "string" ? imageUrl.trim().slice(0, 2000) : "",
      isActive: isActive === false ? false : true,
      createdBy: req.user.id,
    });

    const populated = await FundingCampaign.findById(doc._id).populate(creatorPopulate);
    res.status(201).json({ success: true, message: "Funding campaign created.", data: populated });
  } catch (e) {
    console.error("createFunding", e);
    res.status(500).json({ success: false, message: "Could not create campaign." });
  }
};

const updateFunding = async (req, res) => {
  try {
    const doc = await FundingCampaign.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Campaign not found." });
    if (!canManageDoc(req, doc)) {
      return res.status(403).json({ success: false, message: "Not allowed to update this campaign." });
    }

    const {
      title,
      description,
      goalAmount,
      raisedAmount,
      currency,
      externalUrl,
      imageUrl,
      isActive,
      acceptRazorpay,
    } = req.body;

    if (typeof title === "string" && title.trim()) doc.title = title.trim().slice(0, 200);
    if (typeof description === "string") doc.description = description.trim().slice(0, 8000);
    if (goalAmount !== undefined) {
      if (goalAmount === null || goalAmount === "") doc.goalAmount = null;
      else {
        const g = Number(goalAmount);
        if (!Number.isNaN(g) && g >= 0) doc.goalAmount = g;
      }
    }
    if (raisedAmount !== undefined) {
      const r = Number(raisedAmount);
      if (!Number.isNaN(r) && r >= 0) doc.raisedAmount = r;
    }
    if (typeof currency === "string" && currency.trim()) {
      doc.currency = currency.trim().slice(0, 8).toUpperCase();
    }
    if (typeof externalUrl === "string") {
      const ext = externalUrl.trim();
      if (ext && !isHttpsUrl(ext)) {
        return res.status(400).json({ success: false, message: "Contribution link must be a valid URL." });
      }
      doc.externalUrl = ext.slice(0, 2000);
    }
    if (typeof imageUrl === "string") doc.imageUrl = imageUrl.trim().slice(0, 2000);
    if (typeof isActive === "boolean") doc.isActive = isActive;
    if (typeof acceptRazorpay === "boolean") doc.acceptRazorpay = acceptRazorpay;

    await doc.save();
    const populated = await FundingCampaign.findById(doc._id).populate(creatorPopulate);
    res.status(200).json({ success: true, message: "Campaign updated.", data: populated });
  } catch (e) {
    console.error("updateFunding", e);
    res.status(500).json({ success: false, message: "Could not update campaign." });
  }
};

const deleteFunding = async (req, res) => {
  try {
    const doc = await FundingCampaign.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Campaign not found." });
    if (!canManageDoc(req, doc)) {
      return res.status(403).json({ success: false, message: "Not allowed to delete this campaign." });
    }
    await doc.deleteOne();
    res.status(200).json({ success: true, message: "Campaign removed." });
  } catch (e) {
    console.error("deleteFunding", e);
    res.status(500).json({ success: false, message: "Could not delete campaign." });
  }
};

// --- Razorpay (INR funding) ---

const getRazorpayMeta = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        enabled: isRazorpayReady(),
        keyId: isRazorpayReady() ? getPublicKey() : "",
      },
    });
  } catch (e) {
    console.error("getRazorpayMeta", e);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const createFundingOrder = async (req, res) => {
  try {
    if (!isRazorpayReady()) {
      return res.status(503).json({
        success: false,
        message: "Online payments are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      });
    }

    const campaign = await FundingCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (!campaign.isActive) {
      return res.status(400).json({ success: false, message: "This campaign is not accepting donations." });
    }
    if (campaign.acceptRazorpay === false) {
      return res.status(400).json({ success: false, message: "This campaign does not use Razorpay checkout." });
    }
    const cur = (campaign.currency || "INR").toUpperCase();
    if (cur !== "INR") {
      return res.status(400).json({
        success: false,
        message: "Razorpay checkout is only available for INR campaigns.",
      });
    }

    const amountRupees = Number(req.body.amountRupees);
    if (!Number.isFinite(amountRupees) || amountRupees < 1 || amountRupees > 500000) {
      return res.status(400).json({
        success: false,
        message: "Enter an amount between ₹1 and ₹5,00,000.",
      });
    }

    const paise = Math.round(amountRupees * 100);
    if (paise < 100) {
      return res.status(400).json({ success: false, message: "Minimum contribution is ₹1." });
    }

    const rzp = getRazorpay();
    const rid = String(campaign._id).replace(/[^a-zA-Z0-9]/g, "").slice(-12);
    const receipt = `f${rid}${Date.now()}`.slice(0, 40);

    const order = await rzp.orders.create({
      amount: paise,
      currency: "INR",
      receipt,
      notes: {
        campaignId: String(campaign._id),
        donorId: String(req.user.id),
        campaignTitle: campaign.title.slice(0, 80),
      },
    });

    await FundingPayment.create({
      campaign: campaign._id,
      donor: req.user.id,
      amountPaise: paise,
      orderId: order.id,
      status: "created",
    });

    res.status(201).json({
      success: true,
      data: {
        keyId: getPublicKey(),
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (e) {
    console.error("createFundingOrder", e);
    res.status(500).json({
      success: false,
      message: e.error?.description || e.message || "Could not start payment.",
    });
  }
};

const verifyFundingPayment = async (req, res) => {
  try {
    if (!isRazorpayReady()) {
      return res.status(503).json({ success: false, message: "Payments not configured." });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields." });
    }

    const campaign = await FundingCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }

    const paymentDoc = await FundingPayment.findOne({
      orderId: razorpay_order_id,
      campaign: campaign._id,
      donor: req.user.id,
    });

    if (!paymentDoc) {
      return res.status(404).json({ success: false, message: "No matching payment order found." });
    }

    if (paymentDoc.status === "completed") {
      const populated = await FundingCampaign.findById(campaign._id).populate(creatorPopulate);
      return res.status(200).json({
        success: true,
        message: "Payment was already recorded.",
        duplicate: true,
        data: populated,
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      paymentDoc.status = "failed";
      await paymentDoc.save();
      return res.status(400).json({ success: false, message: "Invalid payment signature." });
    }

    paymentDoc.paymentId = razorpay_payment_id;
    paymentDoc.status = "completed";
    await paymentDoc.save();

    const rupees = paymentDoc.amountPaise / 100;
    await FundingCampaign.updateOne({ _id: campaign._id }, { $inc: { raisedAmount: rupees } });

    const populated = await FundingCampaign.findById(campaign._id).populate(creatorPopulate);
    res.status(200).json({
      success: true,
      message: "Thank you — your contribution was recorded.",
      data: populated,
    });
  } catch (e) {
    console.error("verifyFundingPayment", e);
    res.status(500).json({ success: false, message: "Could not verify payment." });
  }
};

// --- Events ---

const listEvents = async (req, res) => {
  try {
    const events = await AlumniEvent.find(eventListQuery(req))
      .populate(creatorPopulate)
      .sort({ startsAt: 1 });

    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (e) {
    console.error("listEvents", e);
    res.status(500).json({ success: false, message: "Could not load events." });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, googleMeetLink, startsAt, endsAt, status } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }
    const meet = typeof googleMeetLink === "string" ? googleMeetLink.trim() : "";
    if (!isMeetUrl(meet)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid Google Meet link (e.g. https://meet.google.com/xxx-xxxx-xxx).",
      });
    }

    const start = startsAt ? new Date(startsAt) : null;
    if (!start || Number.isNaN(start.getTime())) {
      return res.status(400).json({ success: false, message: "Valid start date and time are required." });
    }

    let end = null;
    if (endsAt) {
      end = new Date(endsAt);
      if (Number.isNaN(end.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid end time." });
      }
    }

    const allowed = ["scheduled", "cancelled", "completed"];
    const st = allowed.includes(status) ? status : "scheduled";

    const doc = await AlumniEvent.create({
      title: String(title).trim().slice(0, 200),
      description: typeof description === "string" ? description.trim().slice(0, 8000) : "",
      googleMeetLink: meet.slice(0, 2000),
      startsAt: start,
      endsAt: end,
      status: st,
      createdBy: req.user.id,
    });

    const populated = await AlumniEvent.findById(doc._id).populate(creatorPopulate);
    res.status(201).json({ success: true, message: "Event created.", data: populated });
  } catch (e) {
    console.error("createEvent", e);
    res.status(500).json({ success: false, message: "Could not create event." });
  }
};

const updateEvent = async (req, res) => {
  try {
    const doc = await AlumniEvent.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Event not found." });
    if (!canManageDoc(req, doc)) {
      return res.status(403).json({ success: false, message: "Not allowed to update this event." });
    }

    const { title, description, googleMeetLink, startsAt, endsAt, status } = req.body;

    if (typeof title === "string" && title.trim()) doc.title = title.trim().slice(0, 200);
    if (typeof description === "string") doc.description = description.trim().slice(0, 8000);

    if (typeof googleMeetLink === "string" && googleMeetLink.trim()) {
      const meet = googleMeetLink.trim();
      if (!isMeetUrl(meet)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid Google Meet link.",
        });
      }
      doc.googleMeetLink = meet.slice(0, 2000);
    }

    if (startsAt) {
      const start = new Date(startsAt);
      if (Number.isNaN(start.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid start time." });
      }
      doc.startsAt = start;
    }

    if (endsAt !== undefined) {
      if (endsAt === null || endsAt === "") {
        doc.endsAt = null;
      } else {
        const end = new Date(endsAt);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid end time." });
        }
        doc.endsAt = end;
      }
    }

    if (typeof status === "string" && ["scheduled", "cancelled", "completed"].includes(status)) {
      doc.status = status;
    }

    await doc.save();
    const populated = await AlumniEvent.findById(doc._id).populate(creatorPopulate);
    res.status(200).json({ success: true, message: "Event updated.", data: populated });
  } catch (e) {
    console.error("updateEvent", e);
    res.status(500).json({ success: false, message: "Could not update event." });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const doc = await AlumniEvent.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Event not found." });
    if (!canManageDoc(req, doc)) {
      return res.status(403).json({ success: false, message: "Not allowed to delete this event." });
    }
    await doc.deleteOne();
    res.status(200).json({ success: true, message: "Event removed." });
  } catch (e) {
    console.error("deleteEvent", e);
    res.status(500).json({ success: false, message: "Could not delete event." });
  }
};

module.exports = {
  listFunding,
  createFunding,
  updateFunding,
  deleteFunding,
  getRazorpayMeta,
  createFundingOrder,
  verifyFundingPayment,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
