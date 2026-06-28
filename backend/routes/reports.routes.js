const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reports.controller');
const { adminAuth } = require('../middleware/adminAuth');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/adminAuth');

router.post('/', authenticate, ReportController.createReport);
router.get('/:id', authenticate, ReportController.getReport);


router.get('/admin/stats', adminAuth, ReportController.getStats);
router.get('/admin/all', adminAuth, ReportController.getAllReports);
router.put('/admin/:id/resolve', adminAuth, ReportController.resolveReport);
router.delete('/admin/:id', adminAuth, ReportController.deleteReport);
router.get('/admin/user/:userId', adminAuth, ReportController.getUserReports);
router.get('/admin/event/:eventId', adminAuth, ReportController.getEventReports);
router.post('/admin/event/cancel/:reportId', adminAuth,  ReportController.cancelEventByReport);

module.exports = router;