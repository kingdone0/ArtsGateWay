const User = require("../models/User.model");
const Artwork = require("../models/Artwork.model");
const Admin = require("../models/Admin.model");
const Event = require("../models/Event.model");
const UserReport = require("../models/UserReport.model");

async function generateUsersReport(period, filters) {
  try {
    console.log('🔍 جلب بيانات المستخدمين...');
    
    const matchStage = {
      createdAt: { 
        $gte: new Date(period.start), 
        $lte: new Date(period.end) 
      }
    };

    const [totalUsers, newUsers, artists, activeUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments(matchStage),
      User.countDocuments({ role: 'artist' }),
      User.countDocuments({ isActive: true })
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email role createdAt');

    return {
      totalUsers: totalUsers || 0,
      newUsers: newUsers || 0,
      artists: artists || 0,
      regularUsers: (totalUsers - artists) || 0,
      activeUsers: activeUsers || 0,
      inactiveUsers: (totalUsers - activeUsers) || 0,
      recentUsers: recentUsers.map(user => ({
        username: user.username,
        email: user.email,
        role: user.role,
        joined: user.createdAt
      })),
      message: 'تم إنشاء تقرير المستخدمين بنجاح'
    };

  } catch (error) {
    console.error('Error generating users report:', error);
    return {
      totalUsers: 0,
      newUsers: 0,
      artists: 0,
      regularUsers: 0,
      error: 'فشل في جلب بيانات المستخدمين: ' + error.message
    };
  }
}
async function generateArtworksReport(period, filters) {
  try {
    console.log('🔍 جلب بيانات الأعمال الفنية...');
    
    const matchStage = {
      createdAt: { 
        $gte: new Date(period.start), 
        $lte: new Date(period.end) 
      }
    };

    const [totalArtworks, newArtworks] = await Promise.all([
      Artwork.countDocuments(),
      Artwork.countDocuments(matchStage)
    ]);

    const categories = await Artwork.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentArtworks = await Artwork.find()
      .populate('artist', 'username')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title price category status createdAt');

    return {
      totalArtworks: totalArtworks || 0,
      newArtworks: newArtworks || 0,
      categories: categories || [],
      recentArtworks: recentArtworks.map(artwork => ({
        title: artwork.title,
        artist: artwork.artist?.username || 'غير معروف',
        price: artwork.price,
        category: artwork.category,
        status: artwork.status
      })),
      message: 'تم إنشاء تقرير الأعمال الفنية بنجاح'
    };

  } catch (error) {
    console.error('Error generating artworks report:', error);
    return {
      totalArtworks: 0,
      newArtworks: 0,
      error: 'فشل في جلب بيانات الأعمال الفنية: ' + error.message
    };
  }
}
async function generateEventsReport(period, filters) {
  try {
    console.log('🔍 جلب بيانات الفعاليات...');
    
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    
    const matchStage = {
      createdAt: { 
        $gte: startDate, 
        $lte: endDate 
      }
    };

    const [totalEvents, newEvents] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments(matchStage)
    ]);

    const upcomingEvents = await Event.countDocuments({ date: { $gte: new Date() } });
    const pendingEvents = await Event.countDocuments({ status: 'pending' });
    const approvedEvents = await Event.countDocuments({ status: 'approved' });

    const recentEvents = await Event.find()
      .populate('artist', 'username')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title date location status price');

    return {
      totalEvents: totalEvents || 0,
      newEvents: newEvents || 0,
      upcomingEvents: upcomingEvents || 0,
      pastEvents: (totalEvents - upcomingEvents) || 0,
      pendingEvents: pendingEvents || 0,
      approvedEvents: approvedEvents || 0,
      recentEvents: recentEvents.map(event => ({
        title: event.title,
        date: event.date,
        location: event.location,
        status: event.status,
        artist: event.artist?.username || 'غير معروف',
        price: event.price
      })),
      message: 'تم إنشاء تقرير الفعاليات بنجاح'
    };

  } catch (error) {
    console.error('❌ خطأ في generateEventsReport:', error);
    return {
      totalEvents: 0,
      newEvents: 0,
      upcomingEvents: 0,
      pastEvents: 0,
      error: 'فشل في جلب بيانات الفعاليات: ' + error.message
    };
  }
}
async function generateReportsReport(period, filters) {
  try {
    console.log('🔍 جلب بيانات الإبلاغات...');
    
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    
    const matchStage = {
      createdAt: { 
        $gte: startDate, 
        $lte: endDate 
      }
    };

    const [totalReports, newReports] = await Promise.all([
      UserReport.countDocuments(),
      UserReport.countDocuments(matchStage)
    ]);

    const pendingReports = await UserReport.countDocuments({ status: 'pending' });
    const resolvedReports = await UserReport.countDocuments({ status: 'resolved' });
    const rejectedReports = await UserReport.countDocuments({ status: 'rejected' });

    const recentReports = await UserReport.find()
      .populate('reporter', 'username')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('targetType reason status createdAt');

  
    const reportsByTarget = await UserReport.aggregate([
      { $group: { _id: '$targetType', count: { $sum: 1 } } }
    ]);

    return {
      totalReports: totalReports || 0,
      newReports: newReports || 0,
      pendingReports: pendingReports || 0,
      resolvedReports: resolvedReports || 0,
      rejectedReports: rejectedReports || 0,
      reportsByTarget: reportsByTarget || [],
      recentReports: recentReports.map(report => ({
        targetType: report.targetType,
        reason: report.reason,
        status: report.status,
        reporter: report.reporter?.username || 'غير معروف',
        createdAt: report.createdAt
      })),
      message: 'تم إنشاء تقرير الإبلاغات بنجاح'
    };

  } catch (error) {
    console.error('❌ خطأ في generateReportsReport:', error);
    return {
      totalReports: 0,
      newReports: 0,
      pendingReports: 0,
      resolvedReports: 0,
      rejectedReports: 0,
      error: 'فشل في جلب بيانات الإبلاغات: ' + error.message
    };
  }
}
async function generateAdminsData(period, filters) {
  try {
    console.log('🔍 جلب بيانات الأدمن...');
    
    const admins = await Admin.find().select('-password');
    const total = admins.length;
    const active = admins.filter(admin => admin.isActive).length;
    const suspended = total - active;
    
    const roles = {};
    admins.forEach(admin => {
      const role = admin.role || 'user_admin';
      roles[role] = (roles[role] || 0) + 1;
    });

    const recentAdmins = await Admin.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('username email role isActive lastActive createdAt');

    return {
      summary: {
        total,
        active,
        suspended,
        activationRate: total > 0 ? ((active / total) * 100).toFixed(1) : 0
      },
      byRole: roles,
      admins: admins.map(admin => ({
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastActive: admin.lastActive,
        createdAt: admin.createdAt
      })),
      recentAdmins: recentAdmins.map(admin => ({
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
      })),
      message: 'تم إنشاء تقرير المشرفين بنجاح'
    };

  } catch (error) {
    console.error('Error generating admins report:', error);
    return {
      error: 'فشل في جلب بيانات الأدمن: ' + error.message
    };
  }
}


module.exports = {
  generateUsersReport,
  generateArtworksReport,
  generateAdminsData,
  generateEventsReport,
  generateReportsReport
};