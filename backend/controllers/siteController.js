const SiteSettings = require("../models/SiteSettings");

const DEFAULT_LANDING = {
  heroTitle: "ECE. Designed to connect generations.",
  heroSubtitle:
    "A living bridge between our department and alumni who shape chips, systems, and societies.",
  heroBadge: "Department of Electronics & Communication Engineering",
  successStories: [],
  departmentEyebrow: "The department",
  departmentTitle: "Where theory meets the signal that changes the world.",
  departmentBody:
    "From solid-state devices to 5G, embedded systems, and AI at the edge — our graduates have powered national labs, global semiconductors, and deep-tech startups. MentorBridge keeps that lineage visible: students see paths; alumni give back without friction.",
  departmentHighlight:
    "Research that travels from the lab to industry — and back through mentorship.",
  stats: [
    { label: "Alumni on platform", value: "Growing", sublabel: "Mentors & role models" },
    { label: "Focus", value: "ECE-first", sublabel: "Circuits to careers" },
    { label: "Mentorship", value: "1:1", sublabel: "Requests & chat" },
  ],
  impactTitle: "Faces of the department",
  impactSubtitle:
    "A few alumni whose work reflects the breadth of what we study — and what you can build next.",
  spotlights: [
    {
      name: "Dr. Meera Iyer",
      role: "Principal Architect — SoC",
      company: "Global Semiconductor Ltd.",
      contribution:
        "Led tape-out teams for energy-efficient edge AI; returns to campus to judge projects and hire interns.",
    },
    {
      name: "Arjun Devan",
      role: "Co-founder & CTO",
      company: "MeshSense Robotics",
      contribution:
        "Spun out RF sensing research into a venture; mentors capstone teams on signal chain design.",
    },
    {
      name: "Sana Rahman",
      role: "Director, Wireless Standards",
      company: "North Telecom",
      contribution:
        "Represents regional interests in 3GPP; hosts open Q&A sessions for students each semester.",
    },
  ],
  timelineTitle: "A short arc of impact",
  timelineSubtitle:
    "How the department’s story reads when you move through the decades.",
  timeline: [
    {
      year: "1960s–80s",
      title: "Foundations",
      description: "Solid-state curriculum and labs that fed India’s electronics ecosystem.",
    },
    {
      year: "1990s–2000s",
      title: "Global footprint",
      description: "Alumni in telecom, VLSI, and defense — carrying the department’s rigor worldwide.",
    },
    {
      year: "Today",
      title: "Edge & intelligence",
      description: "From mmWave to embedded ML — mentorship keeps pace with where hardware is headed.",
    },
  ],
  closingTitle: "Join the line that keeps ECE human.",
  closingSubtitle:
    "Create an account to explore alumni, the feed, and conversations — built for our community.",
};

async function ensureLandingDoc() {
  let doc = await SiteSettings.findOne({ key: "main" });
  if (!doc) {
    doc = await SiteSettings.create({
      key: "main",
      landing: DEFAULT_LANDING,
    });
  }
  return doc;
}

function sanitizeSpotlights(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s) => s && typeof s === "object")
    .map((s) => ({
      name: String(s.name || "").slice(0, 120),
      role: String(s.role || "").slice(0, 160),
      company: String(s.company || "").slice(0, 120),
      contribution: String(s.contribution || "").slice(0, 600),
    }))
    .slice(0, 12);
}

function sanitizeStats(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s) => s && typeof s === "object")
    .map((s) => ({
      label: String(s.label || "").slice(0, 80),
      value: String(s.value || "").slice(0, 40),
      sublabel: String(s.sublabel || "").slice(0, 120),
    }))
    .slice(0, 8);
}

function sanitizeTimeline(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s) => s && typeof s === "object")
    .map((s) => ({
      year: String(s.year || "").slice(0, 40),
      title: String(s.title || "").slice(0, 200),
      description: String(s.description || "").slice(0, 800),
    }))
    .slice(0, 20);
}

// GET /api/site/landing — public
exports.getLanding = async (req, res) => {
  try {
    const doc = await ensureLandingDoc();
    return res.status(200).json({
      success: true,
      data: doc.landing,
    });
  } catch (err) {
    console.error("getLanding:", err);
    return res.status(500).json({
      success: false,
      message: "Could not load site content.",
    });
  }
};

// PUT /api/site/landing — admin
exports.updateLanding = async (req, res) => {
  try {
    const { landing } = req.body;
    if (!landing || typeof landing !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid payload: expected { landing: { ... } }",
      });
    }

    const doc = await ensureLandingDoc();
    const L = doc.landing;

    const str = (v, cur) => (typeof v === "string" ? v : cur);

    L.heroTitle = str(landing.heroTitle, L.heroTitle);
    L.heroSubtitle = str(landing.heroSubtitle, L.heroSubtitle);
    L.heroBadge = str(landing.heroBadge, L.heroBadge);

    if (Array.isArray(landing.successStories)) {
      L.successStories = landing.successStories
        .filter((s) => s && typeof s === "object")
        .map((s) => ({
          name: String(s.name || "").slice(0, 120),
          headline: String(s.headline || "").slice(0, 200),
          detail: String(s.detail || "").slice(0, 500),
          company: String(s.company || "").slice(0, 120),
        }))
        .slice(0, 12);
    }

    L.departmentEyebrow = str(landing.departmentEyebrow, L.departmentEyebrow);
    L.departmentTitle = str(landing.departmentTitle, L.departmentTitle);
    L.departmentBody = str(landing.departmentBody, L.departmentBody);
    L.departmentHighlight = str(landing.departmentHighlight, L.departmentHighlight);

    if (Array.isArray(landing.spotlights)) {
      L.spotlights = sanitizeSpotlights(landing.spotlights);
    }
    if (Array.isArray(landing.stats)) {
      L.stats = sanitizeStats(landing.stats);
    }
    if (Array.isArray(landing.timeline)) {
      L.timeline = sanitizeTimeline(landing.timeline);
    }

    L.impactTitle = str(landing.impactTitle, L.impactTitle);
    L.impactSubtitle = str(landing.impactSubtitle, L.impactSubtitle);
    L.timelineTitle = str(landing.timelineTitle, L.timelineTitle);
    L.timelineSubtitle = str(landing.timelineSubtitle, L.timelineSubtitle);

    L.closingTitle = str(landing.closingTitle, L.closingTitle);
    L.closingSubtitle = str(landing.closingSubtitle, L.closingSubtitle);

    await doc.save();

    return res.status(200).json({
      success: true,
      message: "Landing page updated.",
      data: doc.landing,
    });
  } catch (err) {
    console.error("updateLanding:", err);
    return res.status(500).json({
      success: false,
      message: "Could not save landing content.",
    });
  }
};
