const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getActivityOverview,
  blockUser,
  unblockUser,
  listPostsForModeration,
} = require("../controllers/adminController");

router.use(protect, authorize("admin"));

router.get("/activity", getActivityOverview);
router.get("/posts", listPostsForModeration);
router.put("/users/:userId/block", blockUser);
router.put("/users/:userId/unblock", unblockUser);

module.exports = router;
