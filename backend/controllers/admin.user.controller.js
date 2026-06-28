const AdminUserService = require('../services/admin.user.service');

exports.getAllUsers = async (req, res) => {
  try {
    const result = await AdminUserService.getAllUsers(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('❌ خطأ في جلب المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب المستخدمين',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.getUserDetails = async (req, res) => {
  try {
    const user = await AdminUserService.getUserDetails(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ خطأ في جلب تفاصيل المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب تفاصيل المستخدم',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, suspendReason } = req.body;

    console.log(`📝 [API] Update user ${id} to status: ${status}`);

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'الحالة غير صالحة' });
    }

    const result = await AdminUserService.updateUserStatus(id, status, suspendReason);
    
    console.log(`✅ [API] User status updated: isActive=${result.isActive}`);
    
    res.json({
      success: true,
      message: status === 'active' ? 'تم تفعيل المستخدم بنجاح' : 'تم تعليق المستخدم بنجاح',
      user: result
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث حالة المستخدم:', error);
    res.status(500).json({ success: false, message: error.message || 'حدث خطأ في تحديث حالة المستخدم' });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    await AdminUserService.deleteUser(req.params.id, req.admin._id);
    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في حذف المستخدم:', error);
    res.status(error.message === 'لا يمكن حذف حساب مدير' ? 403 : 500).json({
      success: false,
      message: error.message || 'حدث خطأ في حذف المستخدم'
    });
  }
};
exports.getUserReports = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const result = await AdminUserService.getUserReports(id, status);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('❌ خطأ في جلب بلاغات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب بلاغات المستخدم'
    });
  }
};
exports.getUserStats = async (req, res) => {
  try {
    const stats = await AdminUserService.getUserStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب إحصائيات المستخدمين',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.getPendingEvents = async (req, res) => {
  try {
    const events = await AdminUserService.getPendingEvents();
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.approveEvent = async (req, res) => {
  try {
    const event = await AdminUserService.approveEvent(req.params.id, req.admin._id);
    res.json({ success: true, message: "تم الموافقة على الفعالية", data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.rejectEvent = async (req, res) => {
  try {
    const { reason } = req.body;
    const event = await AdminUserService.rejectEvent(req.params.id, req.admin._id, reason);
    res.json({ success: true, message: "تم رفض الفعالية وإرسال إشعار للمستخدم", data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.blockEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log(`🔒 حظر الفعالية: ${id}, السبب: ${reason}`);
    
    const event = await AdminUserService.blockEvent(id, req.admin._id, reason);
    
    res.json({
      success: true,
      message: "تم حظر الفعالية بنجاح",
      data: event
    });
  } catch (error) {
    console.error('❌ خطأ في حظر الفعالية:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.unblockEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔓 رفع الحظر عن الفعالية: ${id}`);
    
    const event = await AdminUserService.unblockEvent(id, req.admin._id);
    
    res.json({
      success: true,
      message: "تم رفع الحظر عن الفعالية",
      data: event
    });
  } catch (error) {
    console.error('❌ خطأ في رفع الحظر:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.getAllEvents = async (req, res) => {
  try {
    const result = await AdminUserService.getAllEvents();
    console.log('📤 إرجاع الفعاليات:', result.count);
    res.json({ 
      success: true, 
      count: result.count, 
      data: result.data 
    });
  } catch (error) {
    console.error('❌ خطأ في جلب الفعاليات:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      data: [] 
    });
  }
};