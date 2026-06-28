const express = require('express');
const router = express.Router();
const artworkController = require('../controllers/artwork.controller');
const { adminAuth, requirePermission } = require('../middleware/adminAuth');
const adminArtworkController = require('../controllers/admin.artwork.controller');


router.delete('/comments/:commentId', adminArtworkController.deleteComment);
router.use(adminAuth);
router.get('/', requirePermission('canViewArtworks'), adminArtworkController.getAllArtworks);
router.get('/:id', requirePermission('canViewArtworks'), adminArtworkController.getArtworkDetails);
router.put('/:id/status', requirePermission('canViewArtworks'), adminArtworkController.updateArtworkStatus);
router.get('/reported/list', requirePermission('canViewArtworks'), adminArtworkController.getReportedArtworks);
router.delete('/:id', requirePermission('canViewArtworks'), adminArtworkController.deleteArtwork);


module.exports = router;