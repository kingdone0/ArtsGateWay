const Event = require("../models/Event.model");
const Booking = require("../models/Booking.model");

class BookingService {

  async bookEvent(eventId, userId, quantity) {
    try {
      console.log("📝 محاولة حجز:", { eventId, userId, quantity });

      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error("الفعالية غير موجودة");
      }

      if (event.status !== "approved") {
        throw new Error("هذه الفعالية غير متاحة للحجز");
      }

      console.log("📦 الفعالية:", {
        title: event.title,
        capacity: event.capacity,
        bookedSeats: event.bookedSeats || 0
      });

      const availableSeats = event.capacity - (event.bookedSeats || 0);
      if (availableSeats < quantity) {
        throw new Error(`لا يوجد مقاعد كافية. المتاح: ${availableSeats}`);
      }

      event.bookedSeats = (event.bookedSeats || 0) + quantity;
      await event.save();

      const booking = await Booking.create({
        user: userId,
        event: eventId,
        quantity,
        totalPrice: event.price * quantity
      });

      console.log("✅ تم إنشاء الحجز:", booking._id);

      const populatedBooking = await Booking.findById(booking._id).populate("event");
      return populatedBooking;

    } catch (error) {
      console.error("❌ خطأ في bookEvent:", error);
      throw error;
    }
  }
  async getUserBookings(userId) {
    try {
      console.log("📝 جلب حجوزات المستخدم:", userId);
      
      const bookings = await Booking.find({ user: userId })
        .populate("event")
        .sort({ createdAt: -1 });
      
      console.log("📦 عدد الحجوزات:", bookings.length);
      return bookings;
      
    } catch (error) {
      console.error("❌ خطأ في getUserBookings:", error);
      throw error;
    }
  }
  async verifyTicket(ticketId, userId) {
    try {
      const booking = await Booking.findById(ticketId)
        .populate('event', 'title date location _id artist')
        .populate('user', 'username email');
      
      if (!booking) {
        throw new Error('التذكرة غير موجودة');
      }
      
      const event = await Event.findById(booking.event._id);
      if (event.artist.toString() !== userId.toString()) {
        throw new Error('غير مصرح لك بفحص تذاكر هذه الفعالية');
      }
      
      if (booking.status === 'checked-in') {
        throw new Error('تم استخدام هذه التذكرة مسبقاً');
      }
      
      return booking;
    } catch (error) {
      console.error("❌ خطأ في verifyTicket:", error);
      throw error;
    }
  }
  async checkinTicket(ticketId, userId) {
    try {
      const booking = await Booking.findById(ticketId);
      
      if (!booking) {
        throw new Error('التذكرة غير موجودة');
      }
      
      const event = await Event.findById(booking.event);
      if (event.artist.toString() !== userId.toString()) {
        throw new Error('غير مصرح لك');
      }
      
      if (booking.status === 'checked-in') {
        throw new Error('تم استخدام التذكرة مسبقاً');
      }
      
      booking.status = 'checked-in';
      booking.checkedInAt = new Date();
      booking.checkedInBy = userId;
      await booking.save();
      
      return await Booking.findById(ticketId)
        .populate('event')
        .populate('user', 'username email');
        
    } catch (error) {
      console.error("❌ خطأ في checkinTicket:", error);
      throw error;
    }
  }
  async getBookingById(ticketId) {
    try {
      const booking = await Booking.findById(ticketId)
        .populate('event', 'title date location')
        .populate('user', 'username');
      
      if (!booking) {
        throw new Error('التذكرة غير موجودة');
      }
      
      return booking;
    } catch (error) {
      console.error("❌ خطأ في getBookingById:", error);
      throw error;
    }
  }
  async getEventStats(eventId, userId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('الفعالية غير موجودة');
      }
      
      if (event.artist.toString() !== userId.toString()) {
        throw new Error('غير مصرح لك');
      }
      
      const bookings = await Booking.find({ event: eventId });
      
      const total = bookings.length;
      const checkedIn = bookings.filter(b => b.status === 'checked-in').length;
      const remaining = total - checkedIn;
      
      return { total, checkedIn, remaining };
    } catch (error) {
      console.error("❌ خطأ في getEventStats:", error);
      throw error;
    }
  }
}

module.exports = new BookingService();