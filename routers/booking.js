const express = require("express");
const BookingController = require("../controllers/booking.controller");
const authentication = require("../middleware/authentication");
const router = express.Router();

router.post("/", BookingController.createBooking);
router.use(authentication);
router.get("/", BookingController.getAllBooking);
router.put("/:id", BookingController.updateBooking);
router.delete("/:id", BookingController.deleteBooking);
router.patch("/:id/status", BookingController.updateBookingStatus);
module.exports = router;
