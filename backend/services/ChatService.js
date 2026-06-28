const Conversation = require('../models/Conversation.model');
const Message = require('../models/Message.model');
const User = require('../models/User.model');

class ChatService {
  async startConversationLogic(currentUserId, recipientId) {
    const participants = [currentUserId, recipientId].sort((a, b) =>
      a.toString().localeCompare(b.toString())
    );

    let conversation = await Conversation.findOne({ participants });

    if (!conversation) {
      conversation = new Conversation({ participants });
      await conversation.save();
    }

    const participantsData = await User.find(
      { _id: { $in: conversation.participants } },
      'username profileImage'
    );

    return {
      _id: conversation._id,
      participants: participantsData,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    };
  }
  async deleteConversationLogic(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error('المحادثة غير موجودة');
    
    if (!conversation.participants.includes(userId)) {
      throw new Error('غير مصرح لك بحذف هذه المحادثة');
    }

    await Message.deleteMany({ conversation: conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    const otherParticipantId = conversation.participants.find(
      p => p.toString() !== userId
    );

    return { otherParticipantId, conversationId };
  }
  async sendMessageLogic(conversationId, senderId, content, messageType = 'text') {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error('المحادثة غير موجودة');
    
    if (!conversation.participants.includes(senderId)) {
      throw new Error('لا يمكنك الإرسال في هذه المحادثة');
    }

    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      content,
      messageType,
      readBy: [senderId]
    });

    await message.save();

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profileImage');

    const recipientId = conversation.participants.find(
      p => p.toString() !== senderId
    );

    return { populatedMessage, recipientId, conversationId };
  }
  async getUserConversationsLogic(userId) {
    const conversations = await Conversation.find({
      participants: userId,
      status: { $ne: 'deleted' }
    })
    .populate('participants', 'username profilePicture')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'username' }
    })
    .sort('-lastMessageAt');

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          readBy: { $ne: userId }
        });

        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    return conversationsWithUnread;
  }
  async getConversationMessagesLogic(conversationId, userId, page = 1, limit = 20) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) throw new Error('لا يمكنك الوصول لهذه المحادثة');

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      },
      { $addToSet: { readBy: userId } }
    );

    const messages = await Message.find({ 
      conversation: conversationId,
      isDeleted: false 
    })
    .populate('sender', 'username profilePicture')
    .sort('-createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Message.countDocuments({ 
      conversation: conversationId,
      isDeleted: false 
    });

    return {
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  async deleteMessageLogic(messageId, userId) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error('الرسالة غير موجودة');
    
    if (message.sender.toString() !== userId) {
      throw new Error('لا يمكنك حذف هذه الرسالة');
    }

    message.isDeleted = true;
    await message.save();
    return true;
  }
  async markAsReadLogic(conversationId, userId) {
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      },
      { $addToSet: { readBy: userId } }
    );

    const conversation = await Conversation.findById(conversationId);
    const otherParticipant = conversation.participants.find(
      p => p.toString() !== userId
    );

    return { otherParticipant, conversationId };
  }
  async sendImageLogic(conversationId, senderId, imageUrl) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error('المحادثة غير موجودة');
    
    if (!conversation.participants.includes(senderId)) {
      throw new Error('لا يمكنك الإرسال في هذه المحادثة');
    }

    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      content: imageUrl,
      messageType: 'image',
      readBy: [senderId]
    });

    await message.save();

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture');

    const recipientId = conversation.participants.find(
      p => p.toString() !== senderId
    );

    return { populatedMessage, recipientId, conversationId };
  }
}

module.exports = new ChatService();