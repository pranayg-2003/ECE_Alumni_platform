const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { getLanding, updateLanding } = require("../controllers/siteController");

router.get("/landing", getLanding);
router.put("/landing", protect, authorize("admin"), updateLanding);

module.exports = router;
