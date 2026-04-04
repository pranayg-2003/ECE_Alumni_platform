// middleware/auth.js
// This middleware protects routes that require authentication.
// It checks for a valid JWT token before allowing access.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ============================================
// MIDDLEWARE: Protect routes (require login)
// ============================================
const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with "Bearer"
  // The format is: Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Extract the token part after "Bearer "
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token found, deny access
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route. Please login.",
    });
  }

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user from DB using the ID stored in token
    // We use select('+password') only when needed; here we don't need password
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    // Move to the next middleware/route handler
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please login again.",
    });
  }
};

// ============================================
// MIDDLEWARE: Restrict to specific roles
// ============================================
// Usage: authorize("admin") or authorize("alumni", "admin")
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the logged-in user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed to access this route.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
