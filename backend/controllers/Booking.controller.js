const bookingService = require("../services/Booking.Service");

exports.bookEvent = async (req, res) => {
  try {
    const { quantity = 1, transactionHash } = req.body;  
    
    if (!transactionHash) {
      return res.status(400).json({ 
        success: false, 
        message: 'transactionHash مطلوب' 
      });
    }

    const booking = await bookingService.bookEvent(
      req.params.eventId,
      req.user.id,
      quantity,
      transactionHash 
    );

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error("❌ خطأ في bookEvent controller:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user.id);
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.verifyTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const booking = await bookingService.verifyTicket(ticketId, req.user.id);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.checkinTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const booking = await bookingService.checkinTicket(ticketId, req.user.id);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.getBookingById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const booking = await bookingService.getBookingById(ticketId);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};
exports.getEventStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const stats = await bookingService.getEventStats(eventId, req.user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};