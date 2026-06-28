import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, Search, BarChart3, AlertTriangle, 
  CheckCircle, User, Clock, Shield, Ban, 
  ChevronDown, ChevronUp, Star, 
  Palette, Loader2, Check, X,
  Filter, ThumbsUp, MessageCircle, Calendar,
  Edit, Trash2, ExternalLink,
  RefreshCw, Flag, Mail, MessageSquare
} from 'lucide-react';
import axios from 'axios';

const ArtworksManagement = ({ getToken, currentAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [reportActionLoading, setReportActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showCommentsOnly, setShowCommentsOnly] = useState(false);
  const [stats, setStats] = useState({});
  
  const isSuspendingRef = useRef(false);
  const criticalThreshold = 10;
  const API_BASE_URL = 'http://localhost:5000/api';

  const fetchArtworksData = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/admin/artworks`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const artworksData = response.data.artworks || response.data.data || [];
        
        const enhancedArtworks = artworksData.map(artwork => {
          let artistInfo = {
            _id: null,
            name: 'فنان غير معروف',
            username: 'غير معروف'
          };

          if (artwork.artist) {
            if (typeof artwork.artist === 'object') {
              if (artwork.artist.user) {
                artistInfo = {
                  _id: artwork.artist.user._id,
                  name: artwork.artist.user.name || artwork.artist.user.username || 'فنان',
                  username: artwork.artist?.user?.username || 'غير معروف'
                };
              } else if (artwork.artist.username) {
                artistInfo = {
                  _id: artwork.artist._id,
                  name: artwork.artist.name || artwork.artist.username,
                  username: artwork.artist.username
                };
              }
            }
          } else if (artwork.user) {
            artistInfo = {
              _id: artwork.user._id,
              name: artwork.user.name || artwork.user.username,
              username: artwork.user.username
            };
          }

          return {
            _id: artwork._id,
            title: artwork.title || 'عنوان غير معروف',
            description: artwork.description || '',
            imageUrl: artwork.imageUrl || artwork.images?.[0] || '/default-artwork.jpg',
            category: artwork.category || 'عام',
            status: artwork.status || 'active',
            price: artwork.price || 0,
            ratingAverage: artwork.ratingAverage || artwork.rating || 0,
            likesCount: artwork.likes?.length || artwork.likesCount || 0,
            commentsCount: artwork.comments?.length || artwork.commentsCount || 0,
            views: artwork.views || 0,
            createdAt: artwork.createdAt,
            artist: artistInfo,
            comments: artwork.comments || []
          };
        });
        
        setArtworks(enhancedArtworks);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الأعمال:', error);
      setArtworks([]);
    }
  }, [getToken]);

const fetchReportsData = useCallback(async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/report/admin/all`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      const allReports = response.data.data || [];
      
      // ✅ معالجة البلاغات - استخدم البيانات الموجودة بالفعل
      const processedReports = allReports.map(report => {
        // إذا كان البلاغ على تعليق، حاول استخراج اسم المستخدم من targetInfo
        if (report.targetType === 'comment' && report.targetInfo) {
          // targetInfo قد يكون العمل الفني نفسه، وليس بيانات المستخدم
          // لذلك سنحتفظ بالبيانات كما هي
          console.log('📝 Comment report targetInfo:', report.targetInfo);
        }
        return report;
      });
      
      setReports(processedReports);
    }
  } catch (error) {
    console.error('❌ خطأ في جلب البلاغات:', error);
    setReports([]);
  }
}, [getToken]);

  const fetchStatsData = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard/stats`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setStats(response.data.data || {});
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الإحصائيات:', error);
      setStats({});
    }
  }, [getToken]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchArtworksData(),
        fetchReportsData(),
        fetchStatsData()
      ]);
    } catch (error) {
      console.error('❌ خطأ في جلب البيانات:', error);
    }
    setLoading(false);
  }, [fetchArtworksData, fetchReportsData, fetchStatsData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // دوال البلاغات للأعمال الفنية
  const getArtworkUniqueReportersCount = useCallback((artworkId) => {
    const artworkReports = reports.filter(report => 
      report.targetId && String(report.targetId) === String(artworkId) && 
      report.targetType === 'artwork' &&
      report.status === 'pending'
    );
    
    const uniqueReporters = new Set(
      artworkReports.map(report => report.reporter?._id).filter(id => id)
    );
    
    return uniqueReporters.size;
  }, [reports]);

  const getArtworkReportCount = useCallback((artworkId) => {
    return reports.filter(report => 
      report.targetId && String(report.targetId) === String(artworkId) && 
      report.targetType === 'artwork' &&
      report.status === 'pending'
    ).length;
  }, [reports]);

  const getArtworkReports = useCallback((artworkId) => {
    return reports.filter(report => 
      report.targetId && String(report.targetId) === String(artworkId) && 
      report.targetType === 'artwork'
    );
  }, [reports]);

  const isArtworkCritical = useCallback((artworkId) => {
    return getArtworkUniqueReportersCount(artworkId) >= criticalThreshold;
  }, [getArtworkUniqueReportersCount]);

  // دوال البلاغات للتعليقات
  const getCommentUniqueReportersCount = useCallback((commentId) => {
    const commentReports = reports.filter(report => 
      report.targetId && String(report.targetId) === String(commentId) && 
      report.targetType === 'comment' &&
      report.status === 'pending'
    );
    
    const uniqueReporters = new Set(
      commentReports.map(report => report.reporter?._id).filter(id => id)
    );
    
    return uniqueReporters.size;
  }, [reports]);

  const getCommentReportCount = useCallback((commentId) => {
    return reports.filter(report => 
      report.targetId && String(report.targetId) === String(commentId) && 
      report.targetType === 'comment' &&
      report.status === 'pending'
    ).length;
  }, [reports]);

  const getReasonText = (reason) => {
    const reasons = {
      'spam': 'محتوى مزعج',
      'inappropriate': 'سلوك غير لائق',
      'harassment': 'تحرش',
      'hate_speech': 'خطاب كراهية',
      'copyright': 'انتهاك حقوق ملكية',
      'impersonation': 'انتحال شخصية',
      'violence': 'تحريض على العنف',
      'nudity': 'محتوى غير لائق',
      'other': 'أسباب أخرى'
    };
    return reasons[reason] || reason || 'سبب غير محدد';
  };

  // دالة حظر العمل الفني
  const handleBlockArtwork = async (artworkId) => {
    if (actionLoading === artworkId) return;
    
    const reason = window.prompt('📝 الرجاء إدخال سبب الحظر:');
    if (reason === null) return;
    
    setActionLoading(artworkId);
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_BASE_URL}/admin/artworks/${artworkId}/status`,
        { 
          status: 'blocked',
          blockReason: reason || 'مخالفة شروط الاستخدام'
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('✅ تم حظر العمل الفني بنجاح');
        fetchData();
      }
    } catch (error) {
      console.error('❌ خطأ في حظر العمل:', error);
      alert('❌ فشل في حظر العمل: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  // دالة إلغاء حظر العمل الفني
  const handleUnblockArtwork = async (artworkId) => {
    if (actionLoading === artworkId) return;
    if (!window.confirm('هل تريد إلغاء حظر هذا العمل الفني؟')) return;

    setActionLoading(artworkId);
    try {
      const token = getToken();
      await axios.put(
        `${API_BASE_URL}/admin/artworks/${artworkId}/status`,
        { status: 'active' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      alert('✅ تم إلغاء حظر العمل الفني');
      fetchData();
    } catch (error) {
      console.error('❌ خطأ في إلغاء الحظر:', error);
      alert('❌ فشل في إلغاء الحظر');
    } finally {
      setActionLoading(null);
    }
  };

  // دالة حذف العمل الفني
  const handleDeleteArtwork = async (artworkId) => {
    if (!window.confirm('⚠️ تحذير: هل تريد حذف هذا العمل الفني بشكل نهائي؟')) return;
    if (actionLoading === artworkId) return;

    setActionLoading(artworkId);
    try {
      const token = getToken();
      await axios.delete(
        `${API_BASE_URL}/admin/artworks/${artworkId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setArtworks(prev => prev.filter(a => a._id !== artworkId));
      alert('✅ تم حذف العمل الفني بنجاح');
      fetchData();
    } catch (error) {
      console.error('❌ خطأ في حذف العمل:', error);
      alert('❌ فشل في حذف العمل');
    } finally {
      setActionLoading(null);
    }
  };

  // دالة حل بلاغ واحد للعمل الفني
  const handleResolveReport = async (reportId) => {
    if (!window.confirm('هل تريد حل هذا البلاغ؟')) return;
    if (reportActionLoading === reportId) return;

    setReportActionLoading(reportId);
    try {
      const token = getToken();
      await axios.put(
        `http://localhost:5000/api/report/admin/${reportId}/resolve`,
        {
          action: 'reject',
          adminNote: 'تم حل البلاغ لكونه كاذباً أو غير صحيح'
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setReports(prev => 
        prev.map(report => 
          report._id === reportId 
            ? { ...report, status: 'rejected' }
            : report
        )
      );
      
      alert('✅ تم حل البلاغ');
      fetchData();
    } catch (error) {
      console.error('❌ خطأ في حل البلاغ:', error);
      alert('❌ فشل في حل البلاغ');
    } finally {
      setReportActionLoading(null);
    }
  };


// دالة حل بلاغ التعليق
const handleResolveCommentReport = async (reportId) => {
  if (!window.confirm('هل تريد حل هذا البلاغ (كذب)؟')) return;
  
  setReportActionLoading(reportId);
  try {
    const token = getToken();
    
    const response = await axios.put(
      `http://localhost:5000/api/report/admin/${reportId}/resolve`,
      { 
        action: 'reject', 
        adminNote: 'تم حل البلاغ لكونه كاذباً أو غير صحيح' 
      },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log('✅ تم حل البلاغ:', response.data);
    
    // تحديث القائمة محلياً
    setReports(prev => prev.filter(r => r._id !== reportId));
    
    alert('✅ تم حل البلاغ');
    fetchData();
    
  } catch (error) {
    console.error('❌ خطأ في حل البلاغ:', error);
    alert('❌ فشل في حل البلاغ: ' + (error.response?.data?.message || error.message));
  } finally {
    setReportActionLoading(null);
  }
};

  // ✅ دالة حذف تعليق مبلغ عنه (محسنة)
// دالة حذف تعليق مبلغ عنها
const handleDeleteReportedComment = async (artworkId, commentId, reportId) => {
  if (!window.confirm('⚠️ هل تريد حذف هذا التعليق نهائياً؟')) return;
  
  setActionLoading(reportId);
  try {
    const token = getToken();
    
    // حذف التعليق
    const response = await axios.delete(
      `http://localhost:5000/api/admin/artworks/comments/${commentId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log('✅ تم حذف التعليق:', response.data);
    
    // ✅ محاولة حل البلاغ (إذا فشل، لا يهم لأن التعليق تم حذفه)
    try {
      await axios.put(
        `http://localhost:5000/api/report/admin/${reportId}/resolve`,
        { action: 'resolve', adminNote: 'تم حذف التعليق المخالف' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('✅ تم حل البلاغ');
    } catch (resolveError) {
      console.log('⚠️ البلاغ قد يكون محلول مسبقاً:', resolveError.response?.data?.message);
    }
    
    alert('✅ تم حذف التعليق');
    
    // تحديث القائمة محلياً
    setReports(prev => prev.filter(r => r._id !== reportId));
    fetchData();
    
  } catch (error) {
    console.error('❌ خطأ في حذف التعليق:', error);
    alert('❌ فشل في حذف التعليق: ' + (error.response?.data?.message || error.message));
  } finally {
    setActionLoading(null);
  }
};

  const toggleExpand = (artworkId) => {
    setExpandedItems(prev => ({
      ...prev,
      [artworkId]: !prev[artworkId]
    }));
  };

  const getFilteredArtworks = useMemo(() => {
    let filtered = [...artworks];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(artwork => {
        const title = (artwork.title || '').toLowerCase();
        const artistName = (artwork.artist?.name || '').toLowerCase();
        return title.includes(term) || artistName.includes(term);
      });
    }

    if (filter === 'reported') {
      filtered = filtered.filter(artwork => getArtworkReportCount(artwork._id) > 0);
    } else if (filter === 'blocked') {
      filtered = filtered.filter(artwork => artwork.status === 'blocked');
    } else if (filter === 'critical') {
      filtered = filtered.filter(artwork => isArtworkCritical(artwork._id));
    }

    return filtered;
  }, [artworks, searchTerm, filter, getArtworkReportCount, isArtworkCritical]);

  // التعليقات المبلغ عنها فقط
  const reportedCommentsList = reports.filter(r => r.targetType === 'comment' && r.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#d5006d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل الأعمال الفنية...</p>
        </div>
      </div>
    );
  }

  const totalArtworks = artworks.length;
  const reportedArtworks = artworks.filter(a => getArtworkReportCount(a._id) > 0).length;
  const blockedArtworks = artworks.filter(a => a.status === 'blocked').length;
  const criticalArtworks = artworks.filter(a => isArtworkCritical(a._id)).length;

  return (
    <div className="min-h-screen  p-4 md:p-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {showCommentsOnly ? 'التعليقات المبلغ عنها' :
                filter === 'reported' ? 'الأعمال المبلغ عنها' : 
                filter === 'critical' ? 'الأعمال الحرجة' : 
                filter === 'blocked' ? 'الأعمال المحظورة' :
                'إدارة الأعمال الفنية'}
            </h1>
            <p className="text-gray-400">
              {totalArtworks} عمل فني • {reports.filter(r => r.status === 'pending').length} بلاغ قيد المراجعة
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchData}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
          </div>
        </div>

        {/* ✅ الكروت العلوية - 5 كروت */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div onClick={() => { setFilter('all'); setSearchTerm(''); setShowCommentsOnly(false); }} className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'all' && !showCommentsOnly ? 'border-[#d5006d]' : 'border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{totalArtworks}</h3>
            </div>
            <p className="text-gray-400 text-sm">كل الأعمال</p>
          </div>
          
          <div onClick={() => { setFilter('reported'); setSearchTerm(''); setShowCommentsOnly(false); }} className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'reported' && !showCommentsOnly ? 'border-yellow-500' : 'border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-yellow-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{reportedArtworks}</h3>
            </div>
            <p className="text-gray-400 text-sm">مبلغ عنها (أعمال)</p>
          </div>
          
          <div onClick={() => { setFilter('blocked'); setSearchTerm(''); setShowCommentsOnly(false); }} className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'blocked' && !showCommentsOnly ? 'border-red-500' : 'border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-red-500/10 rounded-lg">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{blockedArtworks}</h3>
            </div>
            <p className="text-gray-400 text-sm">محظورة</p>
          </div>
          
          <div onClick={() => { setFilter('critical'); setSearchTerm(''); setShowCommentsOnly(false); }} className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'critical' && !showCommentsOnly ? 'border-red-500 animate-pulse' : 'border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-red-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{criticalArtworks}</h3>
            </div>
            <p className="text-gray-400 text-sm">حرجة (10+ شخص)</p>
          </div>
          
          {/* ✅ كرت التعليقات المبلغ عنها - يعرض التعليقات فقط */}
          <div 
            onClick={() => { setShowCommentsOnly(true); setSearchTerm(''); setFilter('all'); }} 
            className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${showCommentsOnly ? 'border-yellow-500' : 'border-gray-700'} hover:border-yellow-500`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-yellow-500/10 rounded-lg">
                <MessageCircle className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{reportedCommentsList.length}</h3>
            </div>
            <p className="text-gray-400 text-sm">تعليقات مبلغ عنها</p>
          </div>
        </div>

        {/* ✅ شريط البحث - يظهر فقط عند عرض الأعمال */}
        {!showCommentsOnly && (
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث في الأعمال الفنية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl py-3.5 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* ✅ قسم الأعمال الفنية (يظهر فقط عندما لا يكون عرض التعليقات) */}
      {!showCommentsOnly && (
        <div className="space-y-4">
          {getFilteredArtworks.length > 0 ? (
            getFilteredArtworks.map((artwork) => {
              const reportCount = getArtworkReportCount(artwork._id);
              const uniqueReportersCount = getArtworkUniqueReportersCount(artwork._id);
              const isCritical = isArtworkCritical(artwork._id);
              const artworkReports = getArtworkReports(artwork._id);
              const pendingReports = artworkReports.filter(r => r.status === 'pending');
              const isExpanded = expandedItems[artwork._id];
              const hasReports = reportCount > 0;

              return (
                <motion.div
                  key={artwork._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border overflow-hidden ${
                    isCritical ? 'border-red-500/50' :
                    hasReports ? 'border-yellow-500/30' :
                    artwork.status === 'blocked' ? 'border-gray-600' :
                    'border-gray-700'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                          {artwork.imageUrl && !artwork.imageUrl.includes('default') ? (
                            <img 
                              src={`http://localhost:5000${artwork.imageUrl}`} 
                              alt={artwork.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600">
                              <Palette className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-xl font-bold text-white">{artwork.title}</h3>
                              <div className="flex gap-2 flex-wrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  artwork.status === 'active' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {artwork.status === 'active' ? 'نشط' : 'محظور'}
                                </span>
                                
                                {isCritical && (
                                  <span className="px-3 py-1 bg-red-500 text-white text-xs rounded-full font-medium animate-pulse">
                                    حرج ({uniqueReportersCount} شخص)
                                  </span>
                                )}
                                
                                {hasReports && !isCritical && (
                                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                                    {reportCount} بلاغ من {uniqueReportersCount} شخص
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-400" />
                                <span className="text-white font-medium">{artwork.artist?.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(artwork.createdAt).toLocaleDateString('ar-EG')}</span>
                              </div>
                            </div>
                            
                            {artwork.description && (
                              <p className="text-gray-300 line-clamp-2 mb-4">{artwork.description}</p>
                            )}
                          </div>

                          <div className="flex gap-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{artwork.views}</div>
                              <div className="text-xs text-gray-400">مشاهدات</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{artwork.likesCount}</div>
                              <div className="text-xs text-gray-400">إعجاب</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{artwork.commentsCount}</div>
                              <div className="text-xs text-gray-400">تعليقات</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => toggleExpand(artwork._id)}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors flex items-center gap-2"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                          </button>
    
                          <button
                            onClick={() => window.open(`/artwork/${artwork._id}`, '_blank')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            عرض العمل
                          </button>
    
                          {artwork.status !== 'blocked' && (
                            <button
                              onClick={() => handleBlockArtwork(artwork._id)}
                              disabled={actionLoading === artwork._id}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              {actionLoading === artwork._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                              حظر
                            </button>
                          )}
    
                          {artwork.status === 'blocked' && (
                            <button
                              onClick={() => handleUnblockArtwork(artwork._id)}
                              disabled={actionLoading === artwork._id}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              {actionLoading === artwork._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              رفع الحظر
                            </button>
                          )}
    
                          <button
                            onClick={() => handleDeleteArtwork(artwork._id)}
                            disabled={actionLoading === artwork._id}
                            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === artwork._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            حذف نهائي
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-700 p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-white font-bold text-lg mb-4">تفاصيل العمل</h4>
                            <div className="bg-gray-900/50 rounded-xl p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-gray-400 text-sm mb-1">التصنيف</div>
                                  <div className="text-white font-medium">{artwork.category}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-sm mb-1">السعر</div>
                                  <div className="text-green-400 font-bold">{artwork.price > 0 ? `$${artwork.price}` : 'مجاني'}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-sm mb-1">التقييم</div>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400" />
                                    <span className="text-white font-medium">{artwork.ratingAverage.toFixed(1)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {hasReports && (
                          <div>
                            <h4 className="text-white font-bold text-lg mb-4">
                              البلاغات ({pendingReports.length}/{artworkReports.length})
                            </h4>
                            
                            {pendingReports.length > 0 ? (
                              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {pendingReports.map((report) => (
                                  <div key={report._id} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <div className="text-white font-medium mb-1">
                                          <Flag className="w-3 h-3 inline text-yellow-400 mr-2" />
                                          بلاغ من:{
                                     report.reporter?.displayName || 
                                     report.reporter?.username || 
                                     report.reporter?.name || 
                                         'مستخدم'}
                                        </div>
                                        <div className="text-gray-400 text-xs">
                                          {new Date(report.createdAt).toLocaleDateString('ar-EG')}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      <div>
                                        <div className="text-gray-400 text-xs mb-1">السبب:</div>
                                        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                          <span className="text-red-300 font-medium">
                                            {getReasonText(report.reason)}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {report.details && (
                                        <div>
                                          <div className="text-gray-400 text-xs mb-1">التفاصيل:</div>
                                          <p className="text-gray-300 text-sm bg-gray-800/50 p-2 rounded">
                                            {report.details}
                                          </p>
                                        </div>
                                      )}
                                      
                                      <div className="pt-2">
                                        <button
                                          onClick={() => handleResolveReport(report._id)}
                                          disabled={reportActionLoading === report._id}
                                          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                                        >
                                          {reportActionLoading === report._id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Check className="w-3 h-3" />
                                          )}
                                          حل البلاغ
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-gray-900/30 rounded-xl p-8 text-center">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                <p className="text-gray-300">لا توجد بلاغات قيد المراجعة</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 text-center border border-gray-700">
              <Palette className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">لا توجد أعمال فنية</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm 
                  ? `لم يتم العثور على أعمال تطابق "${searchTerm}"`
                  : filter === 'reported'
                  ? 'لا توجد أعمال مبلغ عنها'
                  : filter === 'blocked'
                  ? 'لا توجد أعمال محظورة'
                  : filter === 'critical'
                  ? 'لا توجد أعمال حرجة (10+ بلاغ من 10+ شخص)'
                  : 'لم يتم العثور على أعمال فنية'}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setShowCommentsOnly(false);
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#d5006d] to-[#ff4081] text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                عرض جميع الأعمال
              </button>
            </div>
          )}
        </div>
      )}

      {/* ✅ قسم التعليقات المبلغ عنها - يظهر عند الضغط على الكرت */}
      {showCommentsOnly && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-yellow-400" />
                التعليقات المبلغ عنها
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                  {reportedCommentsList.length}
                </span>
              </h2>
              <p className="text-gray-400 text-sm mt-1">إدارة التعليقات التي أبلغ عنها المستخدمون</p>
            </div>
          </div>

          {reportedCommentsList.length > 0 ? (
            reportedCommentsList.map((report) => {
              let foundComment = null;
              let parentArtwork = null;
              
              for (const artwork of artworks) {
                const comment = artwork.comments?.find(c => c._id === report.targetId);
                if (comment) {
                  foundComment = comment;
                  parentArtwork = artwork;
                  break;
                }
              }
              
              if (!foundComment) return null;
              
              const commentReportCount = getCommentReportCount(report.targetId);
              const isCritical = getCommentUniqueReportersCount(report.targetId) >= criticalThreshold;
              
              // ✅ الحصول على اسم المستخدم بشكل صحيح
              const commentUserName = foundComment.user?.username || 
                                      foundComment.user?.name || 
                                      foundComment.username || 
                                      'مستخدم';
              
              return (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border overflow-hidden ${
                    isCritical ? 'border-red-500/50' : 'border-yellow-500/30'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <div className="flex items-center gap-2">
  <User className="w-4 h-4 text-blue-400" />
  <span className="text-white font-medium">
    {report.reporter?.username || 
     report.reporter?.name || 
     foundComment.user?.username || 
     'مستخدم'}
  </span>
</div>
                          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(foundComment.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                          {isCritical && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium animate-pulse">
                              حرجة ({getCommentUniqueReportersCount(report.targetId)} شخص)
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                            {commentReportCount} بلاغ
                          </span>
                        </div>
                        
                        <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
                          <p className="text-gray-300">{foundComment.text}</p>
                        </div>
                        
                        <div className="bg-gray-900/30 rounded-xl p-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Palette className="w-4 h-4 text-purple-400" />
                            <span className="text-gray-400">العمل الفني:</span>
                            <span className="text-white">{parentArtwork?.title}</span>
                            <button
                              onClick={() => window.open(`/artwork/${parentArtwork?._id}`, '_blank')}
                              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              عرض العمل
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Flag className="w-4 h-4 text-yellow-400" />
                            <span className="text-white font-medium">تفاصيل البلاغ</span>
                          </div>
                          <div className="text-yellow-400 text-sm mb-1">
                            السبب: {getReasonText(report.reason)}
                          </div>
                          {report.details && (
                            <div className="text-gray-300 text-sm">
                              التفاصيل: {report.details}
                            </div>
                          )}
                          <div className="text-gray-400 text-xs mt-2">
                            مقدم البلاغ: {report.reporter?.username || 'مستخدم'}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          {/* زر حذف التعليق */}
                          <button
                            onClick={() => handleDeleteReportedComment(parentArtwork?._id, foundComment._id, report._id)}
                            disabled={actionLoading === report._id}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            حذف التعليق
                          </button>
                          <button
                            onClick={() => handleResolveCommentReport(report._id)}
                            disabled={reportActionLoading === report._id}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {reportActionLoading === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            حل البلاغ (كذب)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 text-center border border-gray-700">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">لا توجد تعليقات مبلغ عنها</h3>
              <p className="text-gray-400">كل التعليقات نظيفة ولا توجد بلاغات حالياً</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtworksManagement;