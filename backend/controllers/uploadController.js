const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });

const ALLOWED_IMAGE = /^image\/(jpeg|jpg|png|gif|webp)$/i;
const ALLOWED_VIDEO = /^video\/(mp4|webm|quicktime)$/i;
const ALLOWED_DOC = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const uploadPostMedia = async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return res.status(503).json({
        success: false,
        message:
          "File uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the server.",
      });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded." });
    }

    const results = [];

    for (const file of files) {
      const mime = file.mimetype || "";
      const isImage = ALLOWED_IMAGE.test(mime);
      const isVideo = ALLOWED_VIDEO.test(mime);
      const isDoc = ALLOWED_DOC.includes(mime);

      if (!isImage && !isVideo && !isDoc) {
        return res.status(400).json({
          success: false,
          message: `Unsupported file type: ${mime || "unknown"}. Use images, video (MP4, WebM, MOV), or PDF/DOC/DOCX/TXT.`,
        });
      }

      const resourceType = isVideo ? "video" : isImage ? "image" : "raw";
      const folder = process.env.CLOUDINARY_FOLDER || "mentorship-posts";

      const uploaded = await uploadBuffer(file.buffer, {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      });

      results.push({
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        resourceType: isVideo ? "video" : isImage ? "image" : "raw",
        originalName: file.originalname || "file",
        mimeType: mime,
      });
    }

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Upload failed.",
    });
  }
};

module.exports = { uploadPostMedia };
