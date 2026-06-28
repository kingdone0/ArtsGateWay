const artworkService = require('../services/artwork.service');
const notificationService = require('../services/notification.service');

exports.createArtwork = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.user.artistProfile._id);
    
    if (req.user.role !== 'artist') {
      return res.status(403).json({ message: 'Only artists can create artworks' });
    }
    
    const artwork = await artworkService.createArtwork(req.user.artistProfile._id, req.body);
    res.status(201).json(artwork);
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.log(error.message);
    
  }
};
exports.toggleLikeArtwork = async (req, res) => {
  try {
    const artwork = await artworkService.toggleLikeArtwork(
      req.params.id,
      req.user.id
    );

    res.json({
      success: true,
      likes: artwork.likes,
      likesCount: artwork.likesCount
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const artwork = await artworkService.addComment(req.params.id, req.user.id, text);
    res.json(artwork);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.updateComment = async (req, res) => {
  try {
    const { artworkId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const updatedComment = await artworkService.updateComment(
      artworkId,
      commentId,
      userId,
      text
    );

    res.json({
      success: true,
      message: 'تم تحديث التعليق بنجاح',
      data: updatedComment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.deleteComment = async (req, res) => {
  try {
    const { artworkId, commentId } = req.params;
    const userId = req.user.id;

    const result = await artworkService.deleteComment(
      artworkId,
      commentId,
      userId
    );

    res.json({
      success: true,
      message: 'تم حذف التعليق بنجاح',
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.rateArtwork  = async (req, res)=> {
    const { artworkId } = req.params;
      const {value } = req.body;
      const userId = req.user._id;
  
  try {
    console.log(value);
    console.log(userId);
    console.log(artworkId);

    const artwork = await artworkService.rateArtwork(artworkId, userId, value);
      
    res.status(200).json({
      message: 'تم إضافة التقييم بنجاح',
      count: artwork.ratings.length,
      rate: artwork.ratings,
      avrage: artwork.ratingAverage
    });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
};
exports.getAllArtworks = async (req, res) => {
  try {
    console.log("📦 Getting all artworks...");
    const artworks = await artworkService.getAllArtworks();
    console.log(`✅ Found ${artworks.length} artworks`);
    
    res.json({
      success: true,
      count: artworks.length,
      data: artworks
    });
  } catch (error) {
    console.error("❌ Error in getAllArtworks controller:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'خطأ في معالجة البيانات' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'حدث خطأ في الخادم',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
exports.getArtworkDetails = async (req, res) => {
  try {
    const artwork = await artworkService.getArtworkDetails(req.params.id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.purchaseArtwork = async (req, res) => {

    try {
        const { id } = req.params;
        const { transactionHash, newOwner } = req.body;
        const buyerUserId = req.user.id; // من الـ JWT token
        
        // ✅ استخدم buyerUserId بدلاً من newOwner
        const artwork = await artworkService.purchaseArtwork(
            id, 
            buyerUserId,  // هذا هو المهم
            transactionHash
        );
        
        res.status(200).json({ success: true, data: artwork });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.getUserPurchases = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId !== req.user.id) {
      return res.status(403).json({ message: 'غير مصرح' });
    }
    
    const purchases = await artworkService.getUserPurchases(userId);
    
    res.json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    console.error("❌ خطأ في جلب المشتريات:", error);
    res.status(400).json({ error: error.message });
  }
};
exports.updateArtwork = async (req, res) => {
  try {
    console.log("📝 بدء تحديث العمل:", req.params.id);
    console.log("📦 البيانات المرسلة:", req.body);
    console.log("🖼️ هل هناك صورة:", !!req.file);
    
    if (req.user.role !== 'artist') {
      return res.status(403).json({ message: 'Only artists can update artworks' });
    }
    
    const updateData = { ...req.body };
    
    if (updateData.isForSale !== undefined) {
      updateData.isForSale = updateData.isForSale === '1' || updateData.isForSale === 'true';
    }
  
    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price);
    }
    
    if (req.file) {
      console.log("🖼️ اسم الصورة الجديدة:", req.file.filename);
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }
    
    console.log("📤 بيانات التحديث بعد المعالجة:", updateData);
    
    const artwork = await artworkService.updateArtwork(
      req.params.id,
      req.user.id,
      updateData
    );
    
    console.log("✅ العمل المحدث:", artwork);
    
    res.json({
      success: true,
      message: 'تم تحديث العمل بنجاح',
      artwork
    });
  } catch (error) {
    console.error("❌ خطأ في تحديث العمل:", error);
    res.status(400).json({ error: error.message });
  }
};
exports.deleteArtwork = async (req, res) => {
  try {
    if (req.user.role !== 'artist') {
      return res.status(403).json({ message: 'Only artists can delete artworks' });
    }
    
    const artwork = await artworkService.deleteArtwork(
      req.params.id,
      req.user.id
    );
    
    res.json({ 
      success: true,
      message: 'Artwork deleted successfully', 
      artwork 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

