const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createReferralSeek,
  listReferralSeeksForAlumni,
  getMyReferralSeeks,
  updateReferralSeek,
  deleteReferralSeek,
} = require("../controllers/referralController");

router.post("/", protect, authorize("student"), createReferralSeek);
router.get("/board", protect, authorize("alumni", "admin"), listReferralSeeksForAlumni);
router.get("/mine", protect, authorize("student"), getMyReferralSeeks);
router.put("/:id", protect, authorize("student"), updateReferralSeek);
router.delete("/:id", protect, authorize("student"), deleteReferralSeek);

module.exports = router;
