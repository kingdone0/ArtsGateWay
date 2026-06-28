const Admin = require('../models/Admin.model');
const User = require('../models/User.model');
const Artwork = require('../models/Artwork.model');
const Event = require('../models/Event.model');
const Report = require('../models/AdminReport.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AdminService {
  async createSuperAdminLogic(data) {
    const { username, email, password, fullName } = data;
    const hashedPassword = await bcrypt.hash(password, 12);

    const superAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: 'superadmin',
      permissions: {
        canViewFinancial: true,
        canViewUsers: true,
        canViewArtworks: true,
        canManageAdmins: true,
        canGenerateReports: true
      }
    });

    await superAdmin.save();
    return superAdmin;
  }
  async adminLoginLogic(data) {
    const { username, password } = data;
    const admin = await Admin.findOne({ username, isActive: true });
    
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new Error('بيانات الدخول غير صحيحة');
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions
      },
      token
    };
  }
  async createAdminLogic(data, createdBy) {
    const { username, email, password, fullName, role, permissions } = data;

    if (!username || !email || !password || !fullName || !role) {
      throw new Error('جميع الحقول مطلوبة');
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }]
    });

    if (existingAdmin) {
      throw new Error('اسم المستخدم أو البريد الإلكتروني مسجل مسبقاً');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = new Admin({
      username,
      email,
      password: hashedPassword,
      fullName,
      role,
      permissions: permissions || {},
      createdBy
    });

    await admin.save();

    const adminData = admin.toObject();
    delete adminData.password;

    return adminData;
  }
  async getAdminsLogic(currentAdminId) {
    const admins = await Admin.find({
      _id: { $ne: currentAdminId },
      role: { $ne: 'super_admin' }
    }).select('-password');
    
    return admins;
  }
  async updateAdminLogic(id, updateData) {
    const admin = await Admin.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

    if (!admin) {
      throw new Error('Admin not found');
    }

    return admin;
  }
  async deleteAdminLogic(id) {
    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      throw new Error('Admin not found');
    }

    return admin;
  }
  async getDashboardStatsLogic() {
    const totalUsers = await User.countDocuments();
    const totalArtworks = await Artwork.countDocuments();
    const totalAdmins = await Admin.countDocuments({ isActive: true });
    const totalEvents = await Event.countDocuments();
    const totalReports = await Report.countDocuments();
    const totalArtists = await User.countDocuments({ role: 'artist' });

    return {
      totalUsers,
      totalArtworks,
      totalAdmins,
      totalEvents,
      totalReports,
      totalArtists,
      totalRevenue: 0
    };
  }
  async getAdminProfileLogic(adminId) {
    const admin = await Admin.findById(adminId).select('-password');
    if (!admin) {
      throw new Error('Admin not found');
    }
    return admin;
  }
}

module.exports = new AdminService();