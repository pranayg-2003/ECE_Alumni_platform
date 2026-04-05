// routes/userRoutes.js
// Defines user-related API endpoints (dashboards, listings)

const express = require("express");
const router = express.Router();

// Import controller functions
const {
  getAllStudents,
  getAllAlumni,
  getAllUsers,
  getPlatformStats,
  searchAlumni,
  searchNetwork,
  sendMentorshipRequest,
  getAlumniProfile,
  getMyRequests,
  getIncomingRequests,
  respondToRequest,
  blockStudent,
  unblockStudent,
  listBlockedStudents,
} = require("../controllers/userController");

// Import middleware
const { protect, authorize } = require("../middleware/auth");

// All routes below require authentication (protect middleware)

// GET /api/users/alumni — Get all alumni
// Accessible by: all logged-in users
router.get("/alumni", protect, getAllAlumni);

// GET /api/users/students — Get all students
// Accessible by: alumni and admin
router.get("/students", protect, authorize("alumni", "admin"), getAllStudents);

// GET /api/users/search-alumni — Search alumni by name, skills, company
// Accessible by: students
// Query params: ?q=searchterm (e.g., ?q=harshit)
router.get("/search-alumni", protect, authorize("student"), searchAlumni);

// GET /api/users/search-network — Alumni search students + alumni
router.get("/search-network", protect, authorize("alumni"), searchNetwork);

// GET /api/users/my-requests — Get student's sent mentorship requests
// Accessible by: students only
router.get("/my-requests", protect, authorize("student"), getMyRequests);

// GET /api/users/incoming-requests — Get alumni's incoming mentorship requests
// Accessible by: alumni only
router.get(
  "/incoming-requests",
  protect,
  authorize("alumni"),
  getIncomingRequests,
);

// POST /api/users/send-request — Send mentorship request to an alumni
// Accessible by: students only
// Body: { alumniId, message }
router.post(
  "/send-request",
  protect,
  authorize("student"),
  sendMentorshipRequest,
);

// PUT /api/users/respond-request/:id — Accept or reject a request
// Accessible by: alumni only
// Body: { status: "accepted" | "rejected" }
router.put(
  "/respond-request/:id",
  protect,
  authorize("alumni"),
  respondToRequest,
);

router.post("/block-student", protect, authorize("alumni"), blockStudent);
router.delete("/block-student/:studentId", protect, authorize("alumni"), unblockStudent);
router.get("/blocked-students", protect, authorize("alumni"), listBlockedStudents);

// Admin-only static paths MUST be registered before /:id or "all" is treated as an ObjectId.
router.get("/all", protect, authorize("admin"), getAllUsers);
router.get("/stats", protect, authorize("admin"), getPlatformStats);

// GET /api/users/:id — Get single alumni profile
// Accessible by: all logged-in users
router.get("/:id", protect, getAlumniProfile);

module.exports = router;
