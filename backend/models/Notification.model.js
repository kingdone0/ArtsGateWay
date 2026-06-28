const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false
  },
  type: { 
    type: String, 
    enum: [
      'event_approved', 'event_rejected', 'event_created', 'booking_confirmed',
      'new_artwork', 'new_event', 'new_user', 'new_report'
    ],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedModel: { 
    type: String, 
    enum: ['Event', 'Artwork', 'Booking', 'Report', 'User'] 
  },
  forAdmin: { type: Boolean, default: false },
  targetRole: {
    type: String,
    enum: ['superadmin', 'user_admin', 'artwork_admin']
  },
  targetRoles: {
    type: [String],
    enum: ['superadmin', 'user_admin', 'artwork_admin'],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);