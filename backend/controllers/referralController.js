const ReferralSeek = require("../models/ReferralSeek");
const User = require("../models/User");

const STUDENT_POPULATE =
  "name branch year profilePicture headline skills interests bio";

const sanitizeStringArray = (arr, maxLen = 24, maxItems = 12) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .slice(0, maxItems)
    .map((s) => s.slice(0, maxLen));
};

const createReferralSeek = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== "student" || !student.isActive) {
      return res.status(403).json({ success: false, message: "Only active students can post." });
    }

    const {
      title,
      summary,
      seekType,
      targetRoles,
      targetCompanies,
      skills,
      linkUrl,
    } = req.body;

    const t = typeof title === "string" ? title.trim() : "";
    const s = typeof summary === "string" ? summary.trim() : "";
    if (!t || !s) {
      return res.status(400).json({ success: false, message: "Title and summary are required." });
    }

    const allowedTypes = ["internship", "full_time", "research", "other"];
    const type = allowedTypes.includes(seekType) ? seekType : "internship";

    const doc = await ReferralSeek.create({
      studentId: req.user.id,
      title: t.slice(0, 140),
      summary: s.slice(0, 4000),
      seekType: type,
      targetRoles: sanitizeStringArray(targetRoles, 48, 16),
      targetCompanies: sanitizeStringArray(targetCompanies, 64, 16),
      skills: sanitizeStringArray(skills, 32, 20),
      linkUrl: typeof linkUrl === "string" ? linkUrl.trim().slice(0, 500) : "",
      status: "open",
    });

    const populated = await ReferralSeek.findById(doc._id).populate("studentId", STUDENT_POPULATE);

    return res.status(201).json({ success: true, data: populated });
  } catch (e) {
    console.error("createReferralSeek:", e);
    return res.status(500).json({ success: false, message: "Could not create referral request." });
  }
};

const listReferralSeeksForAlumni = async (req, res) => {
  try {
    const { q, branch, seekType, status } = req.query;
    const filter = {};

    const st = typeof status === "string" ? status.trim() : "";
    if (["open", "filled", "closed", "all"].includes(st)) {
      if (st !== "all") filter.status = st;
    } else {
      filter.status = "open";
    }

    if (typeof seekType === "string" && seekType.trim()) {
      const allowed = ["internship", "full_time", "research", "other"];
      if (allowed.includes(seekType)) filter.seekType = seekType;
    }

    const search = typeof q === "string" ? q.trim() : "";
    if (search) {
      filter.$text = { $search: search };
    }

    let qb = ReferralSeek.find(filter)
      .populate({
        path: "studentId",
        match: { role: "student", isActive: true },
        select: STUDENT_POPULATE,
      })
      .limit(80);

    if (search) {
      qb = qb.sort({ score: { $meta: "textScore" }, createdAt: -1 });
    } else {
      qb = qb.sort({ createdAt: -1 });
    }

    let list = await qb.lean();

    list = list.filter((item) => item.studentId);

    const branchQ = typeof branch === "string" ? branch.trim() : "";
    if (branchQ) {
      const re = new RegExp(branchQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      list = list.filter((item) => item.studentId && re.test(item.studentId.branch || ""));
    }

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (e) {
    console.error("listReferralSeeksForAlumni:", e);
    return res.status(500).json({ success: false, message: "Could not load referrals." });
  }
};

const getMyReferralSeeks = async (req, res) => {
  try {
    const list = await ReferralSeek.find({ studentId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (e) {
    console.error("getMyReferralSeeks:", e);
    return res.status(500).json({ success: false, message: "Could not load your requests." });
  }
};

const updateReferralSeek = async (req, res) => {
  try {
    const { id } = req.params;
    const seek = await ReferralSeek.findById(id);
    if (!seek) {
      return res.status(404).json({ success: false, message: "Not found." });
    }
    if (String(seek.studentId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    const {
      title,
      summary,
      seekType,
      targetRoles,
      targetCompanies,
      skills,
      linkUrl,
      status,
    } = req.body;

    if (typeof title === "string") seek.title = title.trim().slice(0, 140);
    if (typeof summary === "string") seek.summary = summary.trim().slice(0, 4000);
    if (typeof seekType === "string" && ["internship", "full_time", "research", "other"].includes(seekType)) {
      seek.seekType = seekType;
    }
    if (targetRoles !== undefined) seek.targetRoles = sanitizeStringArray(targetRoles, 48, 16);
    if (targetCompanies !== undefined) seek.targetCompanies = sanitizeStringArray(targetCompanies, 64, 16);
    if (skills !== undefined) seek.skills = sanitizeStringArray(skills, 32, 20);
    if (typeof linkUrl === "string") seek.linkUrl = linkUrl.trim().slice(0, 500);
    if (typeof status === "string" && ["open", "filled", "closed"].includes(status)) {
      seek.status = status;
    }

    if (!seek.title || !seek.summary) {
      return res.status(400).json({ success: false, message: "Title and summary cannot be empty." });
    }

    await seek.save();
    const populated = await ReferralSeek.findById(seek._id).populate("studentId", STUDENT_POPULATE);

    return res.status(200).json({ success: true, data: populated });
  } catch (e) {
    console.error("updateReferralSeek:", e);
    return res.status(500).json({ success: false, message: "Could not update." });
  }
};

const deleteReferralSeek = async (req, res) => {
  try {
    const { id } = req.params;
    const seek = await ReferralSeek.findById(id);
    if (!seek) {
      return res.status(404).json({ success: false, message: "Not found." });
    }
    if (String(seek.studentId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }
    await seek.deleteOne();
    return res.status(200).json({ success: true, message: "Removed." });
  } catch (e) {
    console.error("deleteReferralSeek:", e);
    return res.status(500).json({ success: false, message: "Could not delete." });
  }
};

module.exports = {
  createReferralSeek,
  listReferralSeeksForAlumni,
  getMyReferralSeeks,
  updateReferralSeek,
  deleteReferralSeek,
};
