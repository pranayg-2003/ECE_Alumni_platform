const express = require("express");
const {
  getPosts,
  createPost,
  toggleLikePost,
  addCommentToPost,
  updatePost,
  deletePost,
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getPosts);
router.post("/", protect, createPost);
router.put("/:id/like", protect, toggleLikePost);
router.post("/:id/comments", protect, addCommentToPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
