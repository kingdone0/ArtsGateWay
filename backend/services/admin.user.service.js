const User = require('../models/User.model');
const Artwork = require('../models/Artwork.model');
const Report = require('../models/UserReport.model');
const Event = require('../models/Event.model');
const NotificationService = require('./notification.service');

class AdminUserService {
  // ======================= خدمات المستخدمين =======================
  
  static async getAllUsers(filters = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      status,
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'blocked') {
      query.isActive = false;
    } else if (status === 'suspended') { 
      query.isActive = false;
      query.suspendReason = { $exists: true, $ne: null };
    }

    if (role && ['user', 'artist'].includes(role)) {
      query.role = role;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('username email name profilePicture role isActive suspendReason createdAt followingArtists')
      .populate({
        path: 'artistProfile',
        select: 'bio artworks followers'
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // جلب البلاغات لجميع المستخدمين دفعة واحدة
    const userIds = users.map(user => user._id);
    const allReports = await Report.find({
      targetId: { $in: userIds },
      targetType: 'user'
    }).populate('reporter', 'username name').lean();

    // تجميع البلاغات لكل مستخدم
    const reportsByUser = {};
    allReports.forEach(report => {
      const userId = String(report.targetId);
      if (!reportsByUser[userId]) reportsByUser[userId] = [];
      reportsByUser[userId].push(report);
    });

    const usersWithStats = users.map(user => {
      const userReports = reportsByUser[String(user._id)] || [];
      const uniqueReporters = new Set(userReports.map(r => r.reporter?._id).filter(id => id));
      const uniqueReportersCount = uniqueReporters.size;
      
      // ✅ تحديد إذا كان المستخدم معلقاً بسبب البلاغات الكثيرة
      const isSuspended = !user.isActive && user.suspendReason?.includes('تم تعليق الحساب تلقائياً بسبب 10 بلاغات');
      const isCritical = uniqueReportersCount >= 10;

      const artworksCount = user.artistProfile?.artworks?.length || 0;
      const followersCount = user.artistProfile?.followers?.length || 0;
      const followingCount = user.followingArtists?.length || 0;

      return {
        _id: user._id,
        name: user.name || user.username,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        isActive: user.isActive !== false,
        isSuspended, // ✅ إضافة حقل لتوضيح أنه معلق
        suspendReason: user.suspendReason,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        artistInfo: user.artistProfile ? {
          bio: user.artistProfile.bio,
          profileImage: user.artistProfile.profileImage,
          artworks: user.artistProfile.artworks || []
        } : null,
        statistics: {
          artworksCount,
          followersCount,
          followingCount,
          reportsCount: userReports.length,
          pendingReports: userReports.filter(r => r.status === 'pending').length,
          uniqueReporters: uniqueReportersCount,
          isCritical
        },
        hasReports: userReports.length > 0
      };
    });

    const total = await User.countDocuments(query);
    const activeUsers = await User.countDocuments({ ...query, isActive: true });
    const blockedUsers = await User.countDocuments({ ...query, isActive: false });
    const suspendedUsers = await User.countDocuments({ 
      ...query, 
      isActive: false, 
      suspendReason: { $exists: true, $ne: null } 
    });
    const artistsCount = await User.countDocuments({ ...query, role: 'artist' });
    const pendingReportsCount = await Report.countDocuments({ targetType: 'user', status: 'pending' });
    const criticalUsers = usersWithStats.filter(user => user.statistics.isCritical).length;

    return {
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        totalUsers: total,
        activeUsers,
        blockedUsers,
        suspendedUsers, // ✅ إحصائيات المعلقين
        artistsCount,
        criticalUsers,
        pendingReports: pendingReportsCount
      }
    };
  }
  static async getUserDetails(userId) {
    const user = await User.findById(userId)
      .select('-password -__v')
      .populate({
        path: 'artistProfile',
        select: 'bio profileImage website socialMedia artworks followers',
        populate: [
          {
            path: 'artworks',
            select: 'title imageUrl category createdAt likes comments',
            options: { limit: 20, sort: { createdAt: -1 } }
          },
          {
            path: 'followers',
            select: 'username name profilePicture',
            options: { limit: 10 }
          }
        ]
      })
      .populate({
        path: 'followers following',
        select: 'username name profilePicture createdAt',
        options: { limit: 10 }
      })
      .lean();

    if (!user) return null;

    const [reports, pendingReports] = await Promise.all([
      Report.find({ targetId: user._id, targetType: 'user' })
        .populate('reporter', 'username name profilePicture')
        .sort({ createdAt: -1 })
        .lean(),
      Report.countDocuments({ targetId: user._id, targetType: 'user', status: 'pending' })
    ]);

    const uniqueReporters = await Report.aggregate([
      { $match: { targetId: user._id, targetType: 'user', status: 'pending' } },
      { $group: { _id: '$reporter' } },
      { $count: 'total' }
    ]);

    const uniqueReportersCount = uniqueReporters[0]?.total || 0;
    const isCritical = uniqueReportersCount >= 10;
    const artworksCount = user.artistProfile?.artworks?.length || 0;
    const followersCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;

    return {
      ...user,
      name: user.name || user.username,
      statistics: {
        artworksCount,
        followersCount,
        followingCount,
        reportsCount: reports.length,
        pendingReports,
        uniqueReporters: uniqueReportersCount,
        isCritical
      },
      reports: reports.map(report => ({
        ...report,
        reporterInfo: {
          _id: report.reporter?._id,
          name: report.reporter?.name || report.reporter?.username,
          username: report.reporter?.username,
          profilePicture: report.reporter?.profilePicture
        }
      })),
      artistInfo: user.artistProfile ? {
        ...user.artistProfile,
        artworks: user.artistProfile.artworks || [],
        followers: user.artistProfile.followers || []
      } : null
    };
  }
  static async updateUserStatus(userId, status, suspendReason = null) {
  console.log(`🔧 [updateUserStatus] User: ${userId}, Status: ${status}`);
  
  const user = await User.findById(userId);
  if (!user) throw new Error('المستخدم غير موجود');
  
  console.log(`👤 Before: ${user.username} isActive=${user.isActive}`);
  
  if (status === 'active') {
    user.isActive = true;
    user.suspendReason = null;
    user.suspendedAt = null;
  } else if (status === 'blocked') {
    user.isActive = false;
    user.suspendReason = suspendReason || 'تم التعليق من قبل الإدارة';
    user.suspendedAt = new Date();
  }
  
  await user.save();
  
  console.log(`👤 After: ${user.username} isActive=${user.isActive}`);
  
  return {
    _id: user._id,
    isActive: user.isActive,
    suspendReason: user.suspendReason
  };
  }
  static async deleteUser(userId, currentAdminId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('المستخدم غير موجود');
    if (user.role === 'admin') throw new Error('لا يمكن حذف حساب مدير');

    // حذف الأعمال الفنية
    await Artwork.deleteMany({ artist: userId });
    
    // إزالة الإعجابات والتعليقات
    await Artwork.updateMany(
      { 'likes.user': userId },
      { $pull: { likes: { user: userId } } }
    );
    await Artwork.updateMany(
      { 'comments.user': userId },
      { $pull: { comments: { user: userId } } }
    );
    
    // حذف البلاغات
    await Report.deleteMany({ 
      $or: [{ reporter: userId }, { targetId: userId, targetType: 'user' }]
    });
    
    // إزالة المتابعات
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );
    
    await User.findByIdAndDelete(userId);
    return { success: true };
  }
  static async getUserReports(userId, statusFilter = null) {
    const query = { targetId: userId, targetType: 'user' };
    if (statusFilter && ['pending', 'resolved', 'rejected'].includes(statusFilter)) {
      query.status = statusFilter;
    }

    const reports = await Report.find(query)
      .populate('reporter', 'name username avatar')
      .sort({ createdAt: -1 });

    const uniqueReporters = await Report.aggregate([
      { $match: { targetId: userId, targetType: 'user' } },
      { $group: { _id: '$reporter' } },
      { $count: 'count' }
    ]);

    return {
      reports,
      statistics: {
        totalReports: reports.length,
        uniqueReporters: uniqueReporters[0]?.count || 0,
        pendingReports: reports.filter(r => r.status === 'pending').length
      }
    };
  }
  static async getUserStats() {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const blockedUsers = await User.countDocuments({ isActive: false });
    const suspendedUsers = await User.countDocuments({ 
      isActive: false, 
      suspendReason: { $exists: true, $ne: null } 
    });
    const artistsCount = await User.countDocuments({ role: 'artist' });
    const pendingReports = await Report.countDocuments({ targetType: 'user', status: 'pending' });

    // حساب المستخدمين الحرجة
    const criticalUsers = await Report.aggregate([
      { $match: { targetType: 'user', status: 'pending' } },
      { $group: { _id: '$targetId', reporters: { $addToSet: '$reporter' } } },
      { $project: { count: { $size: '$reporters' } } },
      { $match: { count: { $gte: 10 } } },
      { $count: 'total' }
    ]);

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      suspendedUsers,
      artistsCount,
      pendingReports,
      criticalUsers: criticalUsers[0]?.total || 0
    };
  }
  static async getPendingEvents() {
    return await Event.find({ status: "pending" })
      .populate("artist", "username email name profilePicture")
      .sort({ createdAt: -1 });
  }
  static async approveEvent(eventId, adminId) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error("الفعالية غير موجودة");
    if (event.status !== "pending") throw new Error("هذه الفعالية تم معالجتها مسبقاً");

    event.status = "approved";
    event.approvedBy = adminId;
    event.approvedAt = new Date();
    await event.save();

    // إشعار للفنان
    await NotificationService.createNotification({
      user: event.artist,
      type: 'event_approved',
      title: '✅ تم الموافقة على فعاليتك',
      message: `تمت الموافقة على فعالية "${event.title}" وتم نشرها للجمهور.`,
      relatedId: event._id,
      relatedModel: 'Event'
    });

    return event;
  }
  static async rejectEvent(eventId, adminId, reason = 'لم يتم تقديم سبب') {
  const event = await Event.findById(eventId).populate('artist');
  if (!event) throw new Error("الفعالية غير موجودة");
  
  // ✅ السماح برفض الفعاليات المعلقة والمنشورة
  if (event.status !== "pending" && event.status !== "approved") {
    throw new Error("لا يمكن رفض هذه الفعالية في حالتها الحالية");
  }

  event.status = "rejected";
  event.rejectedBy = adminId;
  event.rejectedAt = new Date();
  event.rejectionReason = reason;
  await event.save();

  await NotificationService.createNotification({
    user: event.artist._id,
    type: 'event_rejected',
    title: '❌ تم رفض فعاليتك',
    message: `تم رفض فعالية "${event.title}"${reason ? ': ' + reason : ''}`,
    relatedId: event._id,
    relatedModel: 'Event'
  });

  return event;
  }
  static async blockEvent(eventId, adminId, reason = '') {
  const event = await Event.findById(eventId);
  if (!event) throw new Error("الفعالية غير موجودة");
  if (event.isBlocked) throw new Error("الفعالية محظورة بالفعل");
  
  console.log(`🔒 حظر الفعالية: ${event.title}`);
  
  event.isBlocked = true;
  event.blockedBy = adminId;
  event.blockedAt = new Date();
  event.blockReason = reason || 'تم حظر الفعالية بقرار من الإدارة';
  event.status = 'blocked';
  await event.save();
  
  return event;
  }
  static async unblockEvent(eventId, adminId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error("الفعالية غير موجودة");
  if (!event.isBlocked) throw new Error("الفعالية غير محظورة");
  
  console.log(`🔓 رفع الحظر عن الفعالية: ${event.title}`);
  
  event.isBlocked = false;
  event.blockedBy = null;
  event.blockedAt = null;
  event.blockReason = null;
  event.status = 'approved';
  await event.save();
  
  return event;
  }
  static async getAllEvents() {
  try {
    // جلب جميع الفعاليات
    const events = await Event.find({})
      .populate("artist", "username email name profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 عدد الفعاليات في قاعدة البيانات: ${events.length}`);

    // جلب البلاغات للفعاليات
    const eventIds = events.map(e => e._id);
    const reports = await Report.find({
      targetId: { $in: eventIds },
      targetType: 'event',
      status: 'pending'
    });

    // تجميع البلاغات حسب الفعالية
    const reportsByEvent = {};
    reports.forEach(report => {
      const eventId = String(report.targetId);
      if (!reportsByEvent[eventId]) reportsByEvent[eventId] = [];
      reportsByEvent[eventId].push(report);
    });

    // إضافة الإحصائيات لكل فعالية
    const eventsWithStats = events.map(event => {
      const eventReports = reportsByEvent[String(event._id)] || [];
      const uniqueReporters = new Set(eventReports.map(r => r.reporter?.toString()).filter(id => id));
      const uniqueCount = uniqueReporters.size;
      
      return {
        ...event,
        statistics: {
          reportsCount: eventReports.length,
          uniqueReporters: uniqueCount,
          isCritical: uniqueCount >= 10,  // ✅ 10 بلاغات للحرجة
          pendingReports: eventReports.filter(r => r.status === 'pending').length
        }
      };
    });

    return {
      success: true,
      count: eventsWithStats.length,
      data: eventsWithStats  // ✅ تأكد أنها مصفوفة
    };
  } catch (error) {
    console.error('❌ خطأ في getAllEvents:', error);
    return {
      success: true,
      count: 0,
      data: []  // ✅ في حالة الخطأ، نرجع مصفوفة فارغة
    };
  }
  }
}
module.exports = AdminUserService;