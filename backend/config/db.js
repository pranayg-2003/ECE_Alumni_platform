// config/db.js
// This file handles the MongoDB database connection

const mongoose = require("mongoose");
const User = require("../models/User");

const connectDB = async () => {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/mentorship_platform";

  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    console.warn(
      "⚠️  MONGO_URI not set in backend/.env — using local fallback mongodb://127.0.0.1:27017/mentorship_platform"
    );
  }

  try {
    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Remove indexes not defined on the User schema (e.g. legacy `contact_1`).
    // A unique index on a dropped field makes `null` collide and blocks new signups.
    try {
      await User.syncIndexes();
      console.log("✅ User indexes synced with schema");
    } catch (syncErr) {
      console.warn("⚠️ User index sync:", syncErr.message);
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit process with failure if DB connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
