const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  listFunding,
  createFunding,
  updateFunding,
  deleteFunding,
  getRazorpayMeta,
  createFundingOrder,
  verifyFundingPayment,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/communityController");

router.get("/payments/razorpay-meta", protect, getRazorpayMeta);
router.post("/funding/:id/order", protect, createFundingOrder);
router.post("/funding/:id/verify-payment", protect, verifyFundingPayment);

router.get("/funding", protect, listFunding);
router.post("/funding", protect, authorize("alumni", "admin"), createFunding);
router.put("/funding/:id", protect, updateFunding);
router.delete("/funding/:id", protect, deleteFunding);

router.get("/events", protect, listEvents);
router.post("/events", protect, authorize("alumni", "admin"), createEvent);
router.put("/events/:id", protect, updateEvent);
router.delete("/events/:id", protect, deleteEvent);

module.exports = router;
