const Event = require("../models/Event.model");
const notificationService = require('./notification.service');

exports.createEvent = async (eventData) => {
  try {
    console.log('📢 [EVENT SERVICE] بدء إنشاء فعالية:', eventData.title);
    
    const event = new Event(eventData);
    await event.save();
    
    console.log('📢 [EVENT SERVICE] الفعالية تم حفظها، جاري إنشاء الإشعار...');
    
    await notificationService.createAdminNotification({
      type: 'new_event',
      title: '🎪 فعالية جديدة',
      message: `"${event.title}" - بانتظار المراجعة`,
      relatedId: event._id,
      relatedModel: 'Event'
    });
    
    console.log('✅ [EVENT SERVICE] تم إنشاء الإشعار بنجاح');
    
    return event;
  } catch (error) {
    console.error('❌ [EVENT SERVICE] فشل:', error.message);
    throw new Error(`فشل إنشاء الفعالية: ${error.message}`);
  }
};
exports.getAllEvents = async () => {
  return await Event.find()
    .populate("artist", "username")
    .sort({ date: 1 });
};
exports.getEventById = async (eventId) => {
  return await Event.findById(eventId)
    .populate("artist", "username");
};
exports.approveEvent = async (eventId) => {
  return await Event.findByIdAndUpdate(
    eventId,
    { status: "approved" },
    { new: true }
  );
};