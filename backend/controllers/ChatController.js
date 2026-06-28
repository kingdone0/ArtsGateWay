const chatService = require('../services/ChatService');

const startConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = req.user.id;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'معرف المستلم مطلوب' });
    }

    const conversationData = await chatService.startConversationLogic(currentUserId, recipientId);

    res.status(200).json({ success: true, data: conversationData });
  } catch (error) {
    console.error('❌ خطأ في startConversation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const { otherParticipantId, conversationId: convId } = await chatService.deleteConversationLogic(conversationId, userId);

    const io = req.app.get('io');
    if (io && otherParticipantId) {
      io.to(`user:${otherParticipantId}`).emit('conversation-deleted', {
        conversationId: convId,
        deletedBy: userId
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم حذف المحادثة بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف المحادثة:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في حذف المحادثة'
    });
  }
};
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, messageType = 'text' } = req.body;
    const senderId = req.user.id;

    const { populatedMessage, recipientId, conversationId: convId } = await chatService.sendMessageLogic(
      conversationId, senderId, content, messageType
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${recipientId}`).emit('new-message', {
        conversationId: convId,
        message: populatedMessage
      });
    }

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('خطأ في إرسال الرسالة:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في إرسال الرسالة'
    });
  }
};
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversationsWithUnread = await chatService.getUserConversationsLogic(userId);

    res.status(200).json({
      success: true,
      data: conversationsWithUnread
    });
  } catch (error) {
    console.error('خطأ في جلب المحادثات:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في جلب المحادثات'
    });
  }
};
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await chatService.getConversationMessagesLogic(conversationId, userId, page, limit);

    res.status(200).json({
      success: true,
      data: result.messages,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('خطأ في جلب الرسائل:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في جلب الرسائل'
    });
  }
};
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    await chatService.deleteMessageLogic(messageId, userId);

    res.status(200).json({
      success: true,
      message: 'تم حذف الرسالة بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الرسالة:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في حذف الرسالة'
    });
  }
};
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const { otherParticipant, conversationId: convId } = await chatService.markAsReadLogic(conversationId, userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${otherParticipant}`).emit('messages-read', {
        conversationId: convId,
        readBy: userId
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث حالة القراءة'
    });
  } catch (error) {
    console.error('خطأ في تحديث حالة القراءة:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في تحديث حالة القراءة'
    });
  }
};
const sendImage = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const senderId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'الرجاء اختيار صورة' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const { populatedMessage, recipientId, conversationId: convId } = await chatService.sendImageLogic(
      conversationId, senderId, imageUrl
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${recipientId}`).emit('new-message', {
        conversationId: convId,
        message: populatedMessage
      });
    }

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    console.error('خطأ في إرسال الصورة:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  startConversation,
  sendMessage,
  getUserConversations,
  getConversationMessages,
  sendImage,
  deleteMessage,
  markAsRead,
  deleteConversation
};