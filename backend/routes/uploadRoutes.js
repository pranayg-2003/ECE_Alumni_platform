const express = require("express");
const multer = require("multer");
const { uploadPostMedia } = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 45 * 1024 * 1024 },
});

const router = express.Router();

const handleUpload = (req, res, next) => {
  upload.array("files", 10)(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Each file must be 12MB or smaller."
          : err.message || "Upload failed.";
      return res.status(400).json({ success: false, message });
    }
    next();
  });
};

router.post("/", protect, handleUpload, uploadPostMedia);

module.exports = router;
