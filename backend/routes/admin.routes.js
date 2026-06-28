// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission } = require('../middleware/adminAuth');
const {  createSuperAdmin,  adminLogin, createAdmin, getAdmins, getDashboardStats,updateAdmin,deleteAdmin,getAdminProfile } = require('../controllers/admin.controller');


router.post('/createsuper', createSuperAdmin);
router.post('/login', adminLogin);


router.get('/profile', adminAuth, getAdminProfile);
router.get('/dashboard/stats', adminAuth, getDashboardStats);
router.post('/admins', adminAuth, requirePermission('canManageAdmins'), createAdmin);
router.get('/admins', adminAuth, requirePermission('canManageAdmins'), getAdmins);
router.put('/admins/:id', adminAuth, requirePermission('canManageAdmins'), updateAdmin);
router.delete('/admins/:id', adminAuth, requirePermission('canManageAdmins'), deleteAdmin);
router.get('/roles', (req, res) => {
  const roles = [
    { value: 'user_admin', label: 'أدمن مستخدمين' },
    { value: 'artwork_admin', label: 'أدمن أعمال فنية' },
  ];
  
  res.json({
    success: true,
    roles: roles
  });
});
module.exports = router;