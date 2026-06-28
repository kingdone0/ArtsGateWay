const express = require('express');
const router = express.Router();
const artworkController = require('../controllers/artwork.controller');
const { authenticate, authorize } = require('../middleware/auth');
const Artwork = require('../models/Artwork.model');
const uploadMiddleware = require('../utils/upload');
const  optionalUploadMiddleware  = require('../utils/eventUpload');

router.get('/', artworkController.getAllArtworks);
router.get('/:id', artworkController.getArtworkDetails);
router.use(authenticate);

router.post('/', authorize('artist'), uploadMiddleware, artworkController.createArtwork);
router.put('/:id', authorize('artist'), optionalUploadMiddleware, artworkController.updateArtwork);
router.delete('/:id', authorize('artist'), artworkController.deleteArtwork);
router.get('/purchases/:userId', artworkController.getUserPurchases);
router.post('/:id/purchase', artworkController.purchaseArtwork);
router.put('/:id/tokenId', authenticate, async (req, res) => {
  try {
    const { tokenId } = req.body;
    
    console.log("🔧 تحديث tokenId للعمل:", req.params.id);
    console.log("🔢 tokenId الجديد:", tokenId);
    
    const Artwork = require('../models/Artwork.model');
    const Artist = require('../models/Artist.model');
    
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ message: 'العمل غير موجود' });
    }
    
    const artist = await Artist.findOne({ user: req.user.id });
    if (!artist) {
      return res.status(404).json({ message: 'الفنان غير موجود' });
    }
    
    if (artwork.artist.toString() !== artist._id.toString()) {
      return res.status(403).json({ message: 'غير مصرح لك بتحديث هذا العمل' });
    }
    
    artwork.tokenId = tokenId;
    await artwork.save();
    
    res.json({ 
      success: true, 
      message: 'تم تحديث tokenId بنجاح',
      artwork 
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث tokenId:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/like', artworkController.toggleLikeArtwork);
router.post('/:id/comment', artworkController.addComment);
router.put('/:artworkId/comment/:commentId', artworkController.updateComment);
router.delete('/:artworkId/comment/:commentId', artworkController.deleteComment);
router.post('/:artworkId/rate', artworkController.rateArtwork);

module.exports = router;