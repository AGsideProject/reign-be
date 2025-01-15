const { Booking, User } = require("../models");
const SibApiV3Sdk = require("sib-api-v3-sdk");
const formatDate = require("../helpers/format-date");

class BookingController {
  // Get all bookings
  static async getAllBooking(_req, res, next) {
    try {
      const bookings = await Booking.findAll({
        include: [{ model: User, attributes: ["full_name"] }],
      });

      return res.status(200).json({
        message: "success",
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create a new booking
  static async createBooking(req, res, next) {
    try {
      const {
        brand_name,
        contact_name,
        shoot_date,
        booking_hour,
        wa_number,
        email,
        desired_model,
        usages,
        status,
        user_id,
      } = req.body;

      const newBooking = await Booking.create({
        brand_name,
        contact_name,
        shoot_date,
        booking_hour,
        wa_number,
        email,
        desired_model,
        usages,
        status,
        user_id,
      });

      // Send notification email
      await BookingController.sendNotificationEmail(newBooking);

      return res.status(201).json({
        message: "Booking created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Update a booking
  static async updateBooking(req, res, next) {
    try {
      const { id } = req.params;
      const {
        brand_name,
        contact_name,
        shoot_date,
        booking_hour,
        wa_number,
        email,
        desired_model,
        usages,
        user_id,
      } = req.body;

      const booking = await Booking.findByPk(id);
      if (!booking) throw { name: "Not Found" };

      await booking.update({
        brand_name,
        contact_name,
        shoot_date,
        booking_hour,
        wa_number,
        email,
        desired_model,
        usages,
        user_id,
      });

      return res.status(200).json({
        message: "Booking updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a booking
  static async deleteBooking(req, res, next) {
    try {
      const { id } = req.params;

      const booking = await Booking.findByPk(id);
      if (!booking) throw { name: "Not Found" };

      await booking.destroy();

      return res.status(200).json({
        message: "Booking deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Update booking status
  static async updateBookingStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const booking = await Booking.findByPk(id);
      if (!booking) throw { name: "Not Found" };

      await booking.update({ status });

      return res.status(200).json({
        message: "Booking status updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Send notification email using Brevo
  static async sendNotificationEmail(booking) {
    try {
      // Initialize Brevo client
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications["api-key"];
      apiKey.apiKey = process.env.EMAIL_API_KEY;

      // Create the email API instance
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

      // Define the email
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = {
        name: "Booking System",
        email: "aldo115marcelino@gmail.com",
      };
      sendSmtpEmail.subject = "New Booking Created or Updated";
      sendSmtpEmail.htmlContent = `
      <h1>New Booking Notification</h1>
      <p><strong>Brand Name:</strong> ${booking.brand_name}</p>
      <p><strong>Contact Name:</strong> ${booking.contact_name}</p>
      <p><strong>Shoot Date:</strong> ${formatDate(booking.shoot_date)}</p>
      <p><strong>Booking Hour:</strong> ${booking.booking_hour}</p>
      <p><strong>WA Number:</strong> ${booking.wa_number}</p>
      <p><strong>Email:</strong> ${booking.email}</p>
      <p><strong>Desired Model:</strong> ${booking.desired_model}</p>
      <p><strong>Usages:</strong> ${booking.usages}</p>
    `;

      // Send to the specific email address
      sendSmtpEmail.to = [{ email: process.env.EMAIL_RECIPIENT }];

      // Call the API to send the email
      const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log("Email sent successfully:", response);
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }
}

module.exports = BookingController;
