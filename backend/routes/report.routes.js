const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission } = require('../middleware/adminAuth');
const reportController = require('../controllers/report.controller');

router.post('/', adminAuth, requirePermission('canGenerateReports'), reportController.createReport);
router.get('/', adminAuth, requirePermission('canGenerateReports'), reportController.getReports);
router.get('/download/:id', adminAuth, requirePermission('canGenerateReports'), reportController.downloadReport);
router.get('/view/:id', adminAuth, requirePermission('canGenerateReports'), reportController.viewReport); 

module.exports = router;