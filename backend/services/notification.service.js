const Notification = require("../models/Notification.model");



const getTargetRolesForType = (type) => {
  const roleMap = {
    
    'new_event': ['superadmin', 'user_admin'],
    'new_user': ['superadmin', 'user_admin'],
    'event_created': ['superadmin', 'user_admin'],
    
    'new_artwork': ['superadmin', 'artwork_admin'],
    
    'new_report': ['superadmin'] 
  };
  return roleMap[type] || ['superadmin'];
};
exports.getUserNotifications = async (userId) => {
  return await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
};
exports.createNotification = async ({ user, type, title, message, relatedId, relatedModel }) => {
  const notification = await Notification.create({
    user,
    type,
    title,
    message,
    relatedId,
    relatedModel,
    read: false
  });
  return notification;
};
exports.markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );
  if (!notification) throw new Error("الإشعار غير موجود");
  return notification;
};
exports.markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { user: userId, read: false },
    { read: true }
  );
  return true;
};
exports.deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    user: userId
  });
  if (!notification) throw new Error("الإشعار غير موجود");
  return notification;
};
exports.getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ user: userId, read: false });
};
exports.createAdminNotification = async ({ 
  type, title, message, relatedId = null, relatedModel = null 
}) => {
  try {
    const roles = getTargetRolesForType(type);
    
    const notification = await Notification.create({
      user: null,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      read: false,
      forAdmin: true,
      targetRoles: roles
    });
    
    // ✅ تحقق من وجود io قبل الاستخدام
    if (global.io) {
      roles.forEach(role => {
        global.io.to(`admin-role:${role}`).emit('admin-notification', notification);
      });
    }
    
    console.log(`📢 إشعار أدمن مرسل للأدوار: ${roles.join(', ')}`);
    return notification;
  } catch (error) {
    console.error('❌ فشل إنشاء إشعار الأدمن:', error);
    throw error; // ✅ رمي الخطأ ليتم التقاطه في السيرفيس
  }
};
exports.getAdminNotifications = async (adminRole, limit = 30) => {
  console.log(`🔍 جلب إشعارات للدور: ${adminRole}`);
  const notifications = await Notification.find({
    forAdmin: true,
    $or: [{ targetRoles: adminRole }, { targetRoles: 'superadmin' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  
  console.log(`✅ وجد ${notifications.length} إشعارات`);
  return notifications;
};
exports.getAdminUnreadCount = async (adminRole) => {
  return await Notification.countDocuments({
    forAdmin: true,
    read: false,
    $or: [{ targetRoles: adminRole }, { targetRoles: 'superadmin' }]
  });
};
exports.markAdminNotificationAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );
};
exports.markAllAdminNotificationsAsRead = async (adminRole) => {
  await Notification.updateMany(
    { 
      forAdmin: true, 
      read: false,
      $or: [{ targetRoles: adminRole }, { targetRoles: 'superadmin' }]
    },
    { read: true }
  );
  return true;
};