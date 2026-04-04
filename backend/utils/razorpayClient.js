let cached;

const isRazorpayReady = () =>
  !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getPublicKey = () => process.env.RAZORPAY_KEY_ID || "";

const getRazorpay = () => {
  if (!isRazorpayReady()) return null;
  if (!cached) {
    const Razorpay = require("razorpay");
    cached = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return cached;
};

module.exports = { getRazorpay, isRazorpayReady, getPublicKey };
