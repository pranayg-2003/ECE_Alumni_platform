const Post = require("../models/Post");

const normalizeAttachments = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => a && typeof a.url === "string" && a.url.trim())
    .map((a) => ({
      url: a.url.trim(),
      resourceType: a.resourceType === "raw" ? "raw" : "image",
      originalName: String(a.originalName || "").slice(0, 240),
      mimeType: String(a.mimeType || "").slice(0, 120),
      publicId: String(a.publicId || "").slice(0, 240),
    }))
    .slice(0, 10);
};

const postPopulateConfig = [
  { path: "author", select: "name role profilePicture company branch year jobTitle" },
  { path: "comments.user", select: "name role profilePicture" },
];

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ isPublished: true })
      .populate(postPopulateConfig)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch posts." });
  }
};

const createPost = async (req, res) => {
  try {
    const { content, thumbnailUrl, attachments } = req.body;
    const safeAttachments = normalizeAttachments(attachments);
    let thumb = typeof thumbnailUrl === "string" ? thumbnailUrl.trim() : "";
    const firstImage = safeAttachments.find((a) => a.resourceType === "image");
    if (!thumb && firstImage) thumb = firstImage.url;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Post content is required." });
    }

    const post = await Post.create({
      author: req.user.id,
      content: content.trim(),
      thumbnailUrl: thumb,
      attachments: safeAttachments,
    });

    const populatedPost = await Post.findById(post._id).populate(postPopulateConfig);

    return res.status(201).json({
      success: true,
      message: "Post published successfully.",
      data: populatedPost,
    });
  } catch (error) {
    console.error("Create post error:", error);
    return res.status(500).json({ success: false, message: "Failed to create post." });
  }
};

const toggleLikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const liked = post.likes.some((likeId) => likeId.toString() === userId);

    if (liked) {
      post.likes = post.likes.filter((likeId) => likeId.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    const populatedPost = await Post.findById(post._id).populate(postPopulateConfig);

    return res.status(200).json({
      success: true,
      message: liked ? "Post unliked." : "Post liked.",
      data: populatedPost,
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    return res.status(500).json({ success: false, message: "Failed to update like status." });
  }
};

const addCommentToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required." });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    post.comments.push({
      user: req.user.id,
      text: text.trim(),
    });

    await post.save();

    const populatedPost = await Post.findById(post._id).populate(postPopulateConfig);

    return res.status(200).json({
      success: true,
      message: "Comment added successfully.",
      data: populatedPost,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({ success: false, message: "Failed to add comment." });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, thumbnailUrl, attachments } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const isOwner = post.author.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this post." });
    }

    if (typeof content !== "undefined") {
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: "Post content cannot be empty." });
      }
      post.content = content.trim();
    }

    if (typeof thumbnailUrl !== "undefined") {
      post.thumbnailUrl = thumbnailUrl?.trim() || "";
    }

    if (Array.isArray(attachments)) {
      const safeAttachments = normalizeAttachments(attachments);
      post.attachments = safeAttachments;
      const firstImage = safeAttachments.find((a) => a.resourceType === "image");
      if (firstImage) post.thumbnailUrl = firstImage.url;
    }

    await post.save();

    const populatedPost = await Post.findById(post._id).populate(postPopulateConfig);

    return res.status(200).json({
      success: true,
      message: "Post updated successfully.",
      data: populatedPost,
    });
  } catch (error) {
    console.error("Update post error:", error);
    return res.status(500).json({ success: false, message: "Failed to update post." });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const isOwner = post.author.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this post." });
    }

    await post.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Post deleted.",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete post." });
  }
};

module.exports = {
  getPosts,
  createPost,
  toggleLikePost,
  addCommentToPost,
  updatePost,
  deletePost,
};
