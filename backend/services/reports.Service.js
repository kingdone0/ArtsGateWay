const Report = require('../models/UserReport.model');
const Artwork = require('../models/Artwork.model');
const User = require('../models/User.model');
const Event = require('../models/Event.model'); 
const NotificationService = require('./notification.service');
const AdminUserService = require('./admin.user.service');
const notificationService = require('./notification.service');

class ReportService {
  
  async createReport(reportData) {
  const { targetType, targetId, reason, reporterId, details, customReason, evidence } = reportData;

  if (!['artwork', 'comment', 'user', 'event'].includes(targetType)) {
    throw new Error('نوع المحتوى غير صالح');
  }

  let targetModel;
  switch (targetType) {
    case 'artwork': targetModel = 'Artwork'; break;
    case 'comment': targetModel = 'Comment'; break;
    case 'user': targetModel = 'User'; break;
    case 'event': targetModel = 'Event'; break;
  }

  let commentOwnerId = null;
  let artworkId = null;
  
  if (targetType === 'artwork') {
    const artwork = await Artwork.findById(targetId);
    if (!artwork) throw new Error('العمل الفني غير موجود');
  }
  
  if (targetType === 'user') {
    const user = await User.findById(targetId);
    if (!user) throw new Error('المستخدم غير موجود');
    if (user._id.toString() === reporterId.toString()) {
      throw new Error('لا يمكنك الإبلاغ عن نفسك');
    }
  }

  if (targetType === 'event') {
    const event = await Event.findById(targetId);
    if (!event) throw new Error('الفعالية غير موجودة');
    if (event.artist && event.artist.toString() === reporterId.toString()) {
      throw new Error('لا يمكنك الإبلاغ عن فعالية خاصة بك');
    }
  }

  if (targetType === 'comment') {
    const artwork = await Artwork.findOne({ 'comments._id': targetId });
    if (!artwork) throw new Error('التعليق غير موجود');
    
    const comment = artwork.comments.id(targetId);
    if (!comment) throw new Error('التعليق غير موجود');
    
    commentOwnerId = comment.user;
    artworkId = artwork._id;
    
    if (commentOwnerId && commentOwnerId.toString() === reporterId.toString()) {
      throw new Error('لا يمكنك الإبلاغ عن تعليقك الخاص');
    }
  }

  const existingReport = await Report.findOne({
    reporter: reporterId,
    targetId,
    targetType,
    status: { $in: ['pending', 'under_review'] }
  });

  if (existingReport) {
    throw new Error('لديك بلاغ معلق بالفعل لهذا المحتوى');
  }

  let priority = 'medium';
  if (targetType === 'event') priority = 'high';
  if (reason === 'violence' || reason === 'harassment') priority = 'critical';

  const report = await Report.create({
    reporter: reporterId,
    targetType,
    targetModel,
    targetId,
    reason,
    customReason: customReason || '',
    details: details || '',
    evidence: evidence || [],
    status: 'pending',
    priority,
    createdAt: new Date()
  });


  if (targetType === 'user') {
    const suspensionResult = await this.checkAndAutoSuspendUser(targetId);
    if (suspensionResult.suspended) {
      console.log(`✅ تم تعليق المستخدم ${targetId}`);
      report.actionTaken = 'account_suspended';
      report.actionDetails = `تم تعليق الحساب تلقائياً بسبب ${suspensionResult.reportersCount} بلاغات`;
      await report.save();
    }
  }

  if (targetType === 'event') {
    console.log(`🔴 جاري التحقق من الحظر التلقائي للفعالية: ${targetId}`);
    const blockResult = await this.checkAndAutoBlockEvent(targetId);
    if (blockResult.blocked) {
      console.log(`✅ تم حظر الفعالية ${targetId} تلقائياً: ${blockResult.reason}`);
      report.actionTaken = 'event_blocked';
      report.actionDetails = `تم حظر الفعالية تلقائياً بسبب ${blockResult.reportersCount} بلاغات`;
      await report.save();
    }
  }

  if (targetType === 'artwork') {
    console.log(`🔴 جاري التحقق من الحظر التلقائي للعمل الفني: ${targetId}`);
    const artworkBlockResult = await this.checkAndAutoBlockArtwork(targetId);
    if (artworkBlockResult.blocked) {
      console.log(`✅ تم حظر العمل الفني ${targetId} تلقائياً: ${artworkBlockResult.reason}`);
      report.actionTaken = 'artwork_blocked';
      report.actionDetails = `تم حظر العمل الفني تلقائياً بسبب ${artworkBlockResult.reportersCount} بلاغات`;
      await report.save();
    }
  }

  if (targetType === 'comment' && commentOwnerId) {
    console.log(`🔴 جاري التحقق من الحظر التلقائي لصاحب التعليق: ${commentOwnerId}`);
    const suspensionResult = await this.checkAndAutoSuspendUser(commentOwnerId);
    if (suspensionResult.suspended) {
      console.log(`✅ تم تعليق المستخدم ${commentOwnerId} (صاحب التعليق) تلقائياً`);
      report.actionTaken = 'comment_owner_suspended';
      report.actionDetails = `تم تعليق حساب صاحب التعليق تلقائياً بسبب ${suspensionResult.reportersCount} بلاغات على تعليقاته`;
      await report.save();
    }
    
    if (artworkId) {
      console.log(`🔴 جاري التحقق من إجمالي بلاغات تعليقات العمل الفني: ${artworkId}`);
      const commentsCheckResult = await this.checkArtworkCommentsReports(artworkId);
      if (commentsCheckResult.shouldBlock) {
        console.log(`✅ تم حظر العمل الفني ${artworkId} تلقائياً بسبب ${commentsCheckResult.count} بلاغات على تعليقاته`);
        report.actionTaken = 'artwork_blocked_by_comments';
        report.actionDetails = `تم حظر العمل الفني تلقائياً بسبب ${commentsCheckResult.count} بلاغات على تعليقاته`;
        await report.save();
      }
    }
  }

 
  let targetName = '';
  if (targetType === 'artwork') {
    const artwork = await Artwork.findById(targetId);
    targetName = artwork?.title || 'عمل فني';
  } else if (targetType === 'user') {
    const user = await User.findById(targetId);
    targetName = user?.username || 'مستخدم';
  } else if (targetType === 'event') {
    const event = await Event.findById(targetId);
    targetName = event?.title || 'فعالية';
  } else if (targetType === 'comment') {
    targetName = 'تعليق';
  }

  await notificationService.createAdminNotification({
    type: 'new_report',
    title: '🚨 بلاغ جديد',
    message: `بلاغ عن ${targetType === 'artwork' ? 'عمل فني' : targetType === 'user' ? 'مستخدم' : targetType === 'event' ? 'فعالية' : 'تعليق'}: "${targetName}" - السبب: ${reason}`,
    relatedId: report._id,
    relatedModel: 'Report'
  });

  return report;
  }
  async checkAndAutoBlockArtwork(artworkId) {
  try {
    console.log(`🔍 [AUTO-BLOCK-ARTWORK] بدء فحص العمل الفني: ${artworkId}`);

    const reports = await Report.find({
      targetId: artworkId,
      targetType: 'artwork',
      status: 'pending'
    });

    const uniqueReporters = new Set(reports.map(r => r.reporter?.toString()).filter(id => id));
    const uniqueCount = uniqueReporters.size;
    
    console.log(`📊 عدد المبلغين الفريدين على العمل الفني: ${uniqueCount}`);
   
    if (uniqueCount >= 10) {
      console.log(`⚠️ [AUTO-BLOCK-ARTWORK] سيتم حظر العمل الفني ${artworkId}`);
      
      const artwork = await Artwork.findById(artworkId);
      if (artwork && artwork.status !== 'blocked') {
        artwork.status = 'blocked';
        await artwork.save();
        console.log(`✅ [AUTO-BLOCK-ARTWORK] تم حظر العمل الفني: ${artwork.title}`);
        
        return { blocked: true, reason: `تم حظر العمل الفني تلقائياً بسبب ${uniqueCount} بلاغات`, reportersCount: uniqueCount };
      }
    }
    
    return { blocked: false, reportersCount: uniqueCount };
  } catch (error) {
    console.error('❌ خطأ في checkAndAutoBlockArtwork:', error);
    return { blocked: false, reportersCount: 0 };
  }
  }
  async checkAndAutoSuspendUser(userId) {
    try {
      console.log(`🔍 بدء فحص المستخدم: ${userId}`);
      
      const reports = await Report.find({ 
        targetId: userId, 
        targetType: 'user', 
        status: 'pending' 
      });
      
      console.log(`📊 عدد البلاغات: ${reports.length}`);
      
      const uniqueReporterIds = [];
      for (const report of reports) {
        const reporterId = report.reporter.toString();
        if (!uniqueReporterIds.includes(reporterId)) {
          uniqueReporterIds.push(reporterId);
        }
      }
      
      const uniqueCount = uniqueReporterIds.length;
      console.log(`👥 عدد المبلغين الفريدين: ${uniqueCount}`);
      
  
      if (uniqueCount >= 10) {
        console.log(`⚠️ سيتم تعليق المستخدم ${userId}`);
        
        const user = await User.findById(userId);
        if (user && user.isActive === true) {
          user.isActive = false;
          user.suspendReason = `تم تعليق الحساب تلقائياً بسبب ${uniqueCount} بلاغات من أشخاص مختلفين`;
          user.suspendedAt = new Date();
          await user.save();
          console.log(`✅ تم تعليق المستخدم ${user.email} بنجاح`);
          return { suspended: true, reason: user.suspendReason, reportersCount: uniqueCount };
        }
      }
      
      return { suspended: false, reportersCount: uniqueCount };
    } catch (error) {
      console.error('❌ خطأ في checkAndAutoSuspendUser:', error);
      return { suspended: false, reportersCount: 0 };
    }
  }
  async checkAndAutoBlockEvent(eventId) {
    try {
      console.log(`🔍 [AUTO-BLOCK] بدء فحص الفعالية: ${eventId}`);
      
      const reports = await Report.find({ 
        targetId: eventId, 
        targetType: 'event', 
        status: 'pending' 
      });
      
      const uniqueReporterIds = [];
      for (const report of reports) {
        const reporterId = report.reporter.toString();
        if (!uniqueReporterIds.includes(reporterId)) {
          uniqueReporterIds.push(reporterId);
        }
      }
      
      const uniqueCount = uniqueReporterIds.length;
      console.log(`👥 عدد المبلغين الفريدين: ${uniqueCount}`);
      
      
      if (uniqueCount >= 10) {
        console.log(`⚠️ [AUTO-BLOCK] سيتم حظر الفعالية ${eventId}`);
        
        const event = await Event.findById(eventId);
        if (event && !event.isBlocked && event.status === 'approved') {
          event.isBlocked = true;
          event.blockedAt = new Date();
          event.blockReason = `تم حظر الفعالية تلقائياً بسبب ${uniqueCount} بلاغات من أشخاص مختلفين`;
          event.status = 'blocked';
          await event.save();
          console.log(`✅ [AUTO-BLOCK] تم حظر الفعالية: ${event.title}`);
          
          return { blocked: true, reason: event.blockReason, reportersCount: uniqueCount };
        }
      }
      
      return { blocked: false, reportersCount: uniqueCount };
    } catch (error) {
      console.error('❌ خطأ في checkAndAutoBlockEvent:', error);
      return { blocked: false, reportersCount: 0 };
    }
  }
  async checkArtworkCommentsReports(artworkId) {
  try {
    console.log(`🔍 [CHECK-ARTWORK-COMMENTS] بدء فحص تعليقات العمل الفني: ${artworkId}`);
    
   
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) return { shouldBlock: false, count: 0 };
    

    const commentIds = artwork.comments.map(c => c._id);
    
    if (commentIds.length === 0) return { shouldBlock: false, count: 0 };
    

    const commentReports = await Report.find({
      targetId: { $in: commentIds },
      targetType: 'comment',
      status: 'pending'
    });
   
    const uniqueReporters = new Set(commentReports.map(r => r.reporter?.toString()).filter(id => id));
    const uniqueCount = uniqueReporters.size;
    
    console.log(`📊 عدد المبلغين الفريدين على تعليقات العمل الفني: ${uniqueCount}`);
    
    
    if (uniqueCount >= 10) {
      console.log(`⚠️ [CHECK-ARTWORK-COMMENTS] سيتم حظر العمل الفني ${artworkId} بسبب بلاغات على تعليقاته`);
      
      if (artwork.status !== 'blocked') {
        artwork.status = 'blocked';
        await artwork.save();
        console.log(`✅ [CHECK-ARTWORK-COMMENTS] تم حظر العمل الفني: ${artwork.title}`);
        
        return { shouldBlock: true, count: uniqueCount };
      }
    }
    
    return { shouldBlock: false, count: uniqueCount };
  } catch (error) {
    console.error('❌ خطأ في checkArtworkCommentsReports:', error);
    return { shouldBlock: false, count: 0 };
  }
  }
  async getReportById(reportId, userId, isAdmin) {
    const report = await Report.findById(reportId)
      .populate('reporter', 'username name profilePicture email')
      .populate('reviewedBy', 'username name')
      .lean();

    if (!report) throw new Error('البلاغ غير موجود');

    if (!isAdmin && report.reporter._id.toString() !== userId.toString()) {
      throw new Error('غير مصرح لك بمشاهدة هذا البلاغ');
    }

  
    if (report.targetModel) {
      const targetModel = mongoose.model(report.targetModel);
      const targetData = await targetModel.findById(report.targetId)
        .select('title name username email artist status')
        .lean();
      report.targetData = targetData;
    }

    return report;
  }
  async getAllReports(filters = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      targetType,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const query = {};

    if (status && ['pending', 'under_review', 'resolved', 'rejected'].includes(status)) {
      query.status = status;
    }

    if (targetType && ['artwork', 'comment', 'user', 'event'].includes(targetType)) {
      query.targetType = targetType;
    }

    if (priority && ['low', 'medium', 'high', 'critical'].includes(priority)) {
      query.priority = priority;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find(query)
      .populate('reporter', 'username name profilePicture email')
      .populate('reviewedBy', 'username name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

   
    const reportsWithTargetInfo = await Promise.all(reports.map(async (report) => {
      let targetInfo = null;
      
      if (report.targetType === 'user') {
        const user = await User.findById(report.targetId)
          .select('username name email profilePicture isActive suspendReason role');
        targetInfo = user;
      } else if (report.targetType === 'artwork') {
        const artwork = await Artwork.findById(report.targetId)
          .populate('artist', 'username name')
          .select('title imageUrl artist category status');
        targetInfo = artwork;
      } else if (report.targetType === 'event') {
        const event = await Event.findById(report.targetId)
          .populate('artist', 'username name email')
          .select('title description imageUrl startDate endDate location status');
        targetInfo = event;
      }

      return {
        ...report,
        targetInfo
      };
    }));

    const total = await Report.countDocuments(query);

    return {
      reports: reportsWithTargetInfo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }
 async resolveReport(reportId, adminId, action, adminNote = '', actionTaken = null) {
  console.log('🔥 [SERVICE] resolveReport called');
  console.log('📝 reportId:', reportId);
  console.log('📝 adminId:', adminId);
  console.log('📝 action:', action);
  console.log('📝 adminNote:', adminNote);
  
  const report = await Report.findById(reportId);
  console.log('📝 Report found:', report ? 'Yes' : 'No');
  
  if (!report) throw new Error('البلاغ غير موجود');
  
  console.log('📝 Report status:', report.status);
  console.log('📝 Report targetType:', report.targetType);
  
  if (report.status !== 'pending' && report.status !== 'under_review') {
    throw new Error('تم معالجة هذا البلاغ مسبقاً');
  }

  const newStatus = action === 'resolve' ? 'resolved' : 'rejected';
  console.log('📝 New status:', newStatus);
  
  report.status = newStatus;
  report.reviewedBy = adminId;
  report.reviewedAt = new Date();
  report.actionDetails = adminNote;
  
  if (actionTaken) {
    report.actionTaken = actionTaken;
  }

  if (action === 'resolve') {
    console.log('📝 Action is resolve, processing...');
    
    if (report.targetType === 'user') {
      console.log('📝 Target is user, checking auto-suspend...');
      await this.checkAndAutoSuspendUser(report.targetId);
      
      const user = await User.findById(report.targetId);
      if (user && user.isActive) {
        user.isActive = false;
        user.suspendReason = adminNote || 'تم تعليق الحساب بقرار من الإدارة بعد التحقق من البلاغات';
        user.suspendedAt = new Date();
        await user.save();
        report.actionTaken = 'account_suspended';
        console.log('✅ User suspended');
      }
    }
    
    if (report.targetType === 'event') {
      const event = await Event.findById(report.targetId);
      if (event && event.status !== 'cancelled') {
        event.status = 'cancelled';
        event.cancelledBy = adminId;
        event.cancelledAt = new Date();
        event.cancellationReason = adminNote || 'تم إلغاء الفعالية بعد التحقق من البلاغات';
        await event.save();
        report.actionTaken = 'event_cancelled';
        console.log('✅ Event cancelled');
      }
    }
    
    if (report.targetType === 'artwork') {

      const artwork = await Artwork.findById(report.targetId);
      if (artwork && artwork.status !== 'blocked') {
        artwork.status = 'blocked';
        await artwork.save();
        report.actionTaken = 'artwork_blocked';
        console.log('✅ Artwork blocked');
      }
    }
  }
  
  await report.save();
  console.log('✅ Report saved successfully');
  
  return report;
  }
  getTargetTypeArabic(targetType) {
    const types = {
      'user': 'المستخدم',
      'artwork': 'العمل الفني',
      'comment': 'التعليق',
      'event': 'الفعالية'
    };
    return types[targetType] || targetType;
  }
  async deleteReport(reportId, adminId) {
    const report = await Report.findById(reportId);
    if (!report) throw new Error('البلاغ غير موجود');
    
    await Report.findByIdAndDelete(reportId);
    return { deleted: true };
  }
  async getReportStats() {
    const total = await Report.countDocuments();
    const pending = await Report.countDocuments({ status: 'pending' });
    const underReview = await Report.countDocuments({ status: 'under_review' });
    const resolved = await Report.countDocuments({ status: 'resolved' });
    const rejected = await Report.countDocuments({ status: 'rejected' });

    const byTargetType = await Report.aggregate([
      {
        $group: {
          _id: '$targetType',
          count: { $sum: 1 }
        }
      }
    ]);

    const byPriority = await Report.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const byReason = await Report.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const eventReports = await Report.countDocuments({ targetType: 'event' });
    const pendingEventReports = await Report.countDocuments({ targetType: 'event', status: 'pending' });

    return {
      total,
      pending,
      underReview,
      resolved,
      rejected,
      byTargetType,
      byPriority,
      topReasons: byReason,
      eventReports: {
        total: eventReports,
        pending: pendingEventReports
      }
    };
  }
  async getUserReports(userId) {
    const reports = await Report.find({ targetId: userId, targetType: 'user' })
      .populate('reporter', 'username name')
      .sort({ createdAt: -1 });

    const uniqueReporters = await Report.aggregate([
      { $match: { targetId: userId, targetType: 'user' } },
      { $group: { _id: '$reporter' } },
      { $count: 'total' }
    ]);

    return {
      reports,
      stats: {
        total: reports.length,
        uniqueReporters: uniqueReporters[0]?.total || 0,
        pending: reports.filter(r => r.status === 'pending').length
      }
    };
  }
  async getEventReports(eventId) {
    const reports = await Report.find({ targetId: eventId, targetType: 'event' })
      .populate('reporter', 'username name profilePicture')
      .sort({ createdAt: -1 });

    return {
      reports,
      stats: {
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        critical: reports.filter(r => r.priority === 'critical').length
      }
    };
  }
}

module.exports = new ReportService();