const adminService = require('../services/admin.service');

exports.createSuperAdmin = async (req, res) => {
  try {
    const superAdmin = await adminService.createSuperAdminLogic(req.body);

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      data: superAdmin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating super admin',
      error: error.message
    });
  }
};
exports.adminLogin = async (req, res) => {
  try {
    const result = await adminService.adminLoginLogic(req.body);
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'فشل تسجيل الدخول'
    });
  }
};
exports.createAdmin = async (req, res) => {
  try {
    const admin = await adminService.createAdminLogic(req.body, req.admin._id);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الأدمن بنجاح',
      data: admin
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'خطأ في إنشاء الأدمن'
    });
  }
};
exports.getAdmins = async (req, res) => {
  try {
    const admins = await adminService.getAdminsLogic(req.admin.id);

    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admins',
      error: error.message
    });
  }
};
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await adminService.updateAdminLogic(id, req.body);

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: admin
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || 'Error updating admin'
    });
  }
};
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteAdminLogic(id);

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || 'Error deleting admin'
    });
  }
};
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStatsLogic();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await adminService.getAdminProfileLogic(req.admin._id);

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin profile',
      error: error.message
    });
  }
};