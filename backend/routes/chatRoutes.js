const express = require('express');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
const uploadMiddleware = require('../utils/upload');
const chatController = require('../controllers/ChatController');

router.use(authenticate);

router.post('/start', chatController.startConversation);
router.post('/send', chatController.sendMessage);
router.get('/conversations', chatController.getUserConversations);
router.post('/send-image',authenticate, uploadMiddleware, chatController.sendImage);
router.get('/messages/:conversationId', chatController.getConversationMessages);
router.delete('/message/:messageId', chatController.deleteMessage);
router.delete('/conversation/:conversationId', authenticate, chatController.deleteConversation);
router.put('/read/:conversationId', chatController.markAsRead);

module.exports = router;