const Artwork = require('../models/Artwork.model');
const Report = require('../models/UserReport.model');

class AdminArtworkService {
  async getAllArtworksLogic(queryParams) {
    const { page = 1, limit = 10, search, status, category } = queryParams;
    
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (category) query.category = category;

    const artworks = await Artwork.find(query)
      .populate({ path: 'artist', populate: { path: 'user', select: 'username' } })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Artwork.countDocuments(query);

    return { artworks, totalPages: Math.ceil(total / limit), currentPage: page, total };
  }
  async getArtworkDetailsLogic(id) {
    const artwork = await Artwork.findById(id)
      .populate('artist', 'name email username')
      .populate('category', 'name')
      .populate('comments.user', 'name username');

    if (!artwork) throw new Error('العمل الفني غير موجود');
    return artwork;
  }
  async updateArtworkStatusLogic(id, status, blockReason, adminId) {
    const artwork = await Artwork.findById(id);
    if (!artwork) throw new Error('العمل الفني غير موجود');

    artwork.status = status;

    if (status === 'blocked') {
      artwork.blockReason = blockReason || 'تم حظر العمل الفني بقرار من الإدارة';
      artwork.blockedAt = new Date();
      artwork.blockedBy = adminId;
    } else {
      artwork.blockReason = null;
      artwork.blockedAt = null;
      artwork.blockedBy = null;
    }

    await artwork.save();

    return {
      _id: artwork._id,
      title: artwork.title,
      status: artwork.status,
      blockReason: artwork.blockReason
    };
  }
  async deleteArtworkLogic(id) {
    const artwork = await Artwork.findByIdAndDelete(id);
    if (!artwork) throw new Error('العمل الفني غير موجود');
    return artwork;
  }
  async getReportedArtworksLogic(queryParams) {
    const { page = 1, limit = 20 } = queryParams;
    const skip = (page - 1) * limit;

    const reports = await Report.find({
      targetType: 'artwork',
      status: { $in: ['pending', 'under_review'] }
    })
      .populate('reporter', 'name username')
      .populate({
        path: 'targetId',
        model: 'Artwork',
        select: 'title artist category price status images createdAt',
        populate: { path: 'artist', select: 'name username email' }
      })
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const artworksMap = new Map();

    reports.forEach(report => {
      if (report.targetId) {
        const artworkId = report.targetId._id;
        if (!artworksMap.has(artworkId)) {
          artworksMap.set(artworkId, {
            ...report.targetId,
            reports: [report],
            reportCount: 1,
            reasons: [report.reason],
            lastReportedAt: report.createdAt,
            priority: report.priority
          });
        } else {
          const existing = artworksMap.get(artworkId);
          existing.reports.push(report);
          existing.reportCount++;
          existing.reasons.push(report.reason);
          if (new Date(report.createdAt) > new Date(existing.lastReportedAt)) existing.lastReportedAt = report.createdAt;
          if (report.priority === 'critical') existing.priority = 'critical';
          else if (report.priority === 'high' && existing.priority !== 'critical') existing.priority = 'high';
        }
      }
    });

    const reportedArtworks = Array.from(artworksMap.values()).map(artwork => ({
      ...artwork,
      reasons: [...new Set(artwork.reasons)]
    }));

    const uniqueArtworkIds = [...new Set(
      (await Report.find({ targetType: 'artwork', status: { $in: ['pending', 'under_review'] } }).select('targetId'))
        .map(r => r.targetId.toString())
    )];

    const total = uniqueArtworkIds.length;

    return { reportedArtworks, totalPages: Math.ceil(total / limit), currentPage: page, total };
  }
  async deleteCommentLogic(commentId) {
    const artwork = await Artwork.findOne({ 'comments._id': commentId });
    if (!artwork) throw new Error('التعليق غير موجود');

    const comment = artwork.comments.id(commentId);
    if (!comment) throw new Error('التعليق غير موجود');

    comment.deleteOne();
    await artwork.save();

    await Report.updateMany(
      { targetId: commentId, targetType: 'comment', status: 'pending' },
      { status: 'resolved', resolvedAt: new Date(), adminNote: 'تم حذف التعليق المخالف' }
    );

    return { success: true };
  }
}
module.exports = new AdminArtworkService();