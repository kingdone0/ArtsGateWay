const reportService = require('../services/reports.service');
const Report = require('../models/UserReport.model');
const Artwork = require('../models/Artwork.model');
const notificationService = require('../services/notification.service');

exports.getAllReports = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Admin only'
      });
    }

    const result = await reportService.getAllReports(req.query);

    res.json({
      success: true,
      data: result.reports,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('❌ getAllReports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
};
exports.getStats = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Admin only'
      });
    }

    const stats = await reportService.getReportStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ getStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load stats'
    });
  }
};
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, details, customReason, evidence } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول'
      });
    }

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'البيانات ناقصة'
      });
    }

    if (!['artwork', 'comment', 'user', 'event'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المحتوى غير صالح. الأنواع المسموحة: artwork, comment, user, event'
      });
    }

    const report = await reportService.createReport({
      targetType,
      targetId,
      reason,
      details,
      customReason,
      evidence,
      reporterId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'تم الإبلاغ بنجاح',
      data: report
    });

  } catch (error) {
    console.error('CREATE REPORT ERROR:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'حدث خطأ أثناء الإبلاغ'
    });
  }
};
exports.getReport = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';
    const report = await reportService.getReportById(req.params.id, req.user._id, isAdmin);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(error.message.includes('غير مصرح') ? 403 : 404).json({
      success: false,
      message: error.message
    });
  }
};
exports.resolveReport = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const { action } = req.body;
    const { adminNote } = req.body;

    if (!['resolve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'action يجب أن يكون resolve أو reject'
      });
    }

    const report = await reportService.resolveReport(
      req.params.id,
      req.admin._id,
      action,
      adminNote
    );

    res.json({
      success: true,
      message: action === 'resolve' ? 'تم قبول البلاغ وحل المشكلة' : 'تم رفض البلاغ',
      data: report
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
exports.deleteReport = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    await reportService.deleteReport(req.params.id, req.admin._id);

    res.json({
      success: true,
      message: 'تم حذف البلاغ بنجاح'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
exports.getUserReports = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const { userId } = req.params;
    const result = await reportService.getUserReports(userId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
exports.getEventReports = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const { eventId } = req.params;
    const result = await reportService.getEventReports(eventId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Get event reports error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
exports.cancelEventByReport = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const { reportId } = req.params;
    const { reason } = req.body;

    const report = await reportService.resolveReport(
      reportId,
      req.admin._id,
      'resolve',
      reason || 'تم إلغاء الفعالية بقرار من الإدارة',
      'event_cancelled'
    );

    res.json({
      success: true,
      message: 'تم إلغاء الفعالية بنجاح',
      data: report
    });
  } catch (error) {
    console.error('❌ Cancel event by report error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};