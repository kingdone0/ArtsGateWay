const express = require("express");
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const notificationController = require("../controllers/notification.controller");

router.get('/my-notifications', authenticate, notificationController.getMyNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount); 
router.patch('/:id/read', authenticate, notificationController.markAsRead);
router.post('/mark-all-read', authenticate, notificationController.markAllAsRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);
router.get("/admin-notifications", adminAuth, notificationController.getAdminNotifications);
router.put("/admin/:id/read", adminAuth, notificationController.markAdminNotificationAsRead);
router.put("/admin/mark-all-read", adminAuth, notificationController.markAllAdminNotificationsAsRead);
router.get("/admin/unread-count", adminAuth, notificationController.getAdminUnreadCount);


module.exports = router;