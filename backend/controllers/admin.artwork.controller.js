const adminArtworkService = require('../services/admin.artwork.service');

exports.getAllArtworks = async (req, res) => {
  try {
    const result = await adminArtworkService.getAllArtworksLogic(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ success: false, message: 'فشل في جلب الأعمال الفنية' });
  }
};
exports.getArtworkDetails = async (req, res) => {
  try {
    const artwork = await adminArtworkService.getArtworkDetailsLogic(req.params.id);
    res.json({ success: true, artwork });
  } catch (error) {
    console.error('Error fetching artwork details:', error);
    res.status(404).json({ success: false, message: error.message || 'فشل في جلب تفاصيل العمل الفني' });
  }
};
exports.updateArtworkStatus = async (req, res) => {
  try {
    const { status, blockReason } = req.body;
    const { id } = req.params;
    console.log(`🔧 تحديث العمل الفني ${id} إلى الحالة: ${status}`);

    const artwork = await adminArtworkService.updateArtworkStatusLogic(id, status, blockReason, req.admin?._id);

    console.log(`✅ تم ${status === 'blocked' ? 'حظر' : 'تفعيل'} العمل الفني`);
    res.json({
      success: true,
      message: status === 'blocked' ? 'تم حظر العمل الفني بنجاح' : 'تم تفعيل العمل الفني بنجاح',
      artwork
    });
  } catch (error) {
    console.error('Error updating artwork status:', error);
    res.status(500).json({ success: false, message: error.message || 'فشل في تحديث حالة العمل الفني' });
  }
};
exports.deleteArtwork = async (req, res) => {
  try {
    await adminArtworkService.deleteArtworkLogic(req.params.id);
    res.json({ success: true, message: 'تم حذف العمل الفني بنجاح' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(404).json({ success: false, message: error.message || 'فشل في حذف العمل الفني' });
  }
};
exports.getReportedArtworks = async (req, res) => {
  try {
    const result = await adminArtworkService.getReportedArtworksLogic(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in getReportedArtworks:', error);
    res.status(500).json({ success: false, message: 'فشل في جلب الأعمال المبلغ عنها' });
  }
};
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    console.log('🔍 محاولة حذف تعليق:', commentId);
    await adminArtworkService.deleteCommentLogic(commentId);
    console.log('✅ تم حذف التعليق بنجاح');
    res.json({ success: true, message: 'تم حذف التعليق بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في حذف التعليق:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};