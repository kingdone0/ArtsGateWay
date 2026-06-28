const notificationService = require("../services/notification.service");

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    const unreadCount = await notificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length
      }
    });
  } catch (error) {
    console.error("❌ خطأ في جلب الإشعارات:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الإشعارات"
    });
  }
};
exports.markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({
      success: true,
      message: "تم تحديث الإشعار",
      data: notification
    });
  } catch (error) {
    console.error("❌ خطأ في تحديث الإشعار:", error);
    res.status(400).json({
      success: false,
      message: error.message || "حدث خطأ في تحديث الإشعار"
    });
  }
};
exports.markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      message: "تم تحديث كل الإشعارات"
    });
  } catch (error) {
    console.error("❌ خطأ في تحديث الإشعارات:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث الإشعارات"
    });
  }
};
exports.deleteNotification = async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    
    res.json({
      success: true,
      message: "تم حذف الإشعار"
    });
  } catch (error) {
    console.error("❌ خطأ في حذف الإشعار:", error);
    res.status(400).json({
      success: false,
      message: error.message || "حدث خطأ في حذف الإشعار"
    });
  }
};
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error("❌ خطأ في جلب عدد الإشعارات:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب عدد الإشعارات"
    });
  }
  
};
exports.getAdminNotifications = async (req, res) => {
  try {
    const admin = req.admin || req.user;
    const adminRole = admin.role;
    
    const notifications = await notificationService.getAdminNotifications(adminRole);
    const unreadCount = await notificationService.getAdminUnreadCount(adminRole);
    
    res.json({
      success: true,
      data: { notifications, unreadCount, total: notifications.length }
    });
  } catch (error) {
    console.error("❌ خطأ في جلب إشعارات الأدمن:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getAdminUnreadCount = async (req, res) => {
  try {
    const admin = req.admin || req.user;
    const count = await notificationService.getAdminUnreadCount(admin.role);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.markAdminNotificationAsRead = async (req, res) => {
  try {
    await notificationService.markAdminNotificationAsRead(req.params.id);
    res.json({ success: true, message: "تم تحديث الإشعار" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    await notificationService.markAllAdminNotificationsAsRead(req.user.role);
    res.json({ success: true, message: "تم تحديث جميع الإشعارات" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
