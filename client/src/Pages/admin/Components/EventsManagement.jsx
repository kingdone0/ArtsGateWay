import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, Search, BarChart3, AlertTriangle, 
  CheckCircle, User, Clock, Shield, Ban, 
  ChevronDown, ChevronUp, Star, 
  Palette, Loader2, Check, X,
  Filter, ThumbsUp, MessageCircle, Calendar,
  Edit, Trash2, ExternalLink,
  RefreshCw, Flag, Mail, MoreVertical,
  MapPin, DollarSign, Users, FileText, UserCheck
} from 'lucide-react';
import axios from 'axios';

const EventsManagement = ({ getToken, currentAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [reportActionLoading, setReportActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({});
  
  const isBlockingRef = useRef(false);
  const criticalThreshold = 10; // 10 بلاغات للحرجة
  const API_BASE_URL = 'http://localhost:5000/api';

  // جلب الفعاليات
  const fetchEventsData = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/admin/users/events/all`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const eventsData = response.data.data || [];
        const enhancedEvents = eventsData.map(event => ({
          _id: event._id,
          title: event.title || 'بدون عنوان',
          description: event.description || '',
          location: event.location || '',
          date: event.date,
          price: event.price || 0,
          capacity: event.capacity || 0,
          bookedSeats: event.bookedSeats || 0,
          image: event.image,
          identityDocument: event.identityDocument,
          proofDocument: event.proofDocument,
          status: event.status || 'pending',
          isBlocked: event.isBlocked || false,
          blockReason: event.blockReason || null,
          artist: event.artist,
          createdAt: event.createdAt,
          statistics: {
            reportsCount: event.statistics?.reportsCount || 0,
            uniqueReporters: event.statistics?.uniqueReporters || 0,
            isCritical: event.statistics?.isCritical || false
          }
        }));
        setEvents(enhancedEvents);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الفعاليات:', error);
      setEvents([]);
    }
  }, [getToken]);

  // جلب البلاغات
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
        const eventReports = allReports.filter(report => 
          report.targetType === 'event'
        );
        setReports(eventReports);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب البلاغات:', error);
      setReports([]);
    }
  }, [getToken]);

  const fetchStatsData = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/admin/users/stats`, {
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
        fetchEventsData(),
        fetchReportsData(),
        fetchStatsData()
      ]);
    } catch (error) {
      console.error('❌ خطأ في جلب البيانات:', error);
    }
    setLoading(false);
  }, [fetchEventsData, fetchReportsData, fetchStatsData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ دوال البلاغات للفعاليات (مثل المستخدمين)
  const getEventUniqueReportersCount = useCallback((eventId) => {
    const eventReports = reports.filter(report => 
      report.targetId && String(report.targetId) === String(eventId) &&
      report.status === 'pending'
    );
    
    const uniqueReporters = new Set(
      eventReports.map(report => report.reporter?._id).filter(id => id)
    );
    
    return uniqueReporters.size;
  }, [reports]);

  const getEventReportCount = useCallback((eventId) => {
    return reports.filter(report => 
      report.targetId && String(report.targetId) === String(eventId) && 
      report.status === 'pending'
    ).length;
  }, [reports]);

  const getEventReports = useCallback((eventId) => {
    return reports.filter(report => 
      report.targetId && String(report.targetId) === String(eventId)
    );
  }, [reports]);

  const isEventCritical = useCallback((eventId) => {
    return getEventUniqueReportersCount(eventId) >= criticalThreshold;
  }, [getEventUniqueReportersCount]);

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
      'false_information': 'معلومات خاطئة',
      'scam': 'احتيال',
      'other': 'أسباب أخرى'
    };
    return reasons[reason] || reason || 'سبب غير محدد';
  };

  // ✅ دالة حظر الفعالية
  const handleBlockEvent = async (eventId) => {
    if (isBlockingRef.current) return;
    if (actionLoading === eventId) return;
    if (!window.confirm('⚠️ هل تريد حظر هذه الفعالية؟')) return;

    isBlockingRef.current = true;
    setActionLoading(eventId);
    
    try {
      const token = getToken();
      if (!token) {
        alert('❌ لم يتم العثور على رمز الدخول');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/admin/users/events/${eventId}/block`,
        { 
          reason: 'مخالفة شروط الاستخدام - تم حظر الفعالية بقرار من الإدارة'
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.success) {
        alert('✅ تم حظر الفعالية بنجاح');
        
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event._id === eventId 
              ? { ...event, isBlocked: true, status: 'blocked', blockReason: 'تم الحظر من قبل الإدارة' }
              : event
          )
        );
        
        if (filter === 'reported' || filter === 'critical') {
          setFilter('blocked');
        }
        
        fetchStatsData();
      } else {
        throw new Error(response.data.message || 'فشل حظر الفعالية');
      }
    } catch (error) {
      console.error('❌ خطأ في حظر الفعالية:', error);
      alert('❌ فشل في حظر الفعالية: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(null);
      setTimeout(() => {
        isBlockingRef.current = false;
      }, 500);
    }
  };

  // ✅ دالة رفع الحظر عن فعالية
  const handleUnblockEvent = async (eventId) => {
    if (actionLoading === eventId) return;
    if (!window.confirm('هل تريد رفع الحظر عن هذه الفعالية؟')) return;

    setActionLoading(eventId);
    try {
      const token = getToken();
      await axios.post(
        `${API_BASE_URL}/admin/users/events/${eventId}/unblock`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      alert('✅ تم رفع الحظر عن الفعالية بنجاح');
      
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId 
            ? { ...event, isBlocked: false, status: 'approved', blockReason: null }
            : event
        )
      );
      
      setFilter('all');
      fetchStatsData();
      
    } catch (error) {
      console.error('❌ خطأ في رفع الحظر:', error);
      alert('❌ فشل في رفع الحظر');
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ دالة حذف الفعالية
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('⚠️ تحذير: هل تريد حذف هذه الفعالية بشكل نهائي؟')) return;
    if (actionLoading === eventId) return;

    setActionLoading(eventId);
    try {
      const token = getToken();
      await axios.delete(
        `${API_BASE_URL}/admin/users/events/${eventId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
      alert('✅ تم حذف الفعالية بنجاح');
      fetchStatsData();
      
    } catch (error) {
      console.error('❌ خطأ في حذف الفعالية:', error);
      alert('❌ فشل في حذف الفعالية: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ دالة حل بلاغ واحد
  const handleResolveReport = async (reportId, eventId) => {
    if (!window.confirm('هل تريد حل هذا البلاغ؟')) return;
    if (reportActionLoading === reportId) return;

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
      
      if (response.data.success) {
        setReports(prevReports => 
          prevReports.map(report => 
            report._id === reportId 
              ? { ...report, status: 'rejected' }
              : report
          )
        );
        
        alert('✅ تم حل البلاغ');
      }
    } catch (error) {
      console.error('❌ خطأ في حل البلاغ:', error);
      alert('❌ فشل في حل البلاغ: ' + (error.response?.data?.message || error.message));
    } finally {
      setReportActionLoading(null);
    }
  };

  // ✅ دالة اعتماد الفعالية (للمعلقة)
  const handleApproveEvent = async (eventId) => {
    const event = events.find(e => e._id === eventId);
    if (!event?.identityDocument || !event?.proofDocument) {
      alert("⚠️ لا يمكن اعتماد الفعالية بدون الوثائق الثبوتية");
      return;
    }
    
    setActionLoading(eventId);
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/admin/users/events/${eventId}/approve`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert("✅ تم اعتماد الفعالية بنجاح!");
        fetchData();
      }
    } catch (err) {
      console.error("❌ فشل الاعتماد:", err);
      alert("❌ فشل الاعتماد: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ دالة رفض الفعالية
  const handleRejectEvent = async (eventId) => {
    const reason = window.prompt("📝 الرجاء إدخال سبب الرفض (سيتم إرساله للمستخدم):");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("⚠️ يرجى كتابة سبب الرفض");
      return;
    }
    
    setActionLoading(eventId);
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/admin/users/events/${eventId}/reject`,
        { reason: reason.trim() },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert("✅ تم رفض الفعالية");
        fetchData();
      }
    } catch (err) {
      console.error("❌ فشل الرفض:", err);
      alert("❌ فشل الرفض: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  // عرض الوثيقة
  const viewDocument = (docUrl) => {
    if (docUrl) {
      const fullUrl = docUrl.startsWith('http') ? docUrl : `http://localhost:5000${docUrl}`;
      window.open(fullUrl, '_blank');
    } else {
      alert("⚠️ لا توجد وثائق مرفوعة");
    }
  };

  const toggleExpand = (eventId) => {
    setExpandedItems(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const getFilteredEvents = useMemo(() => {
    let filtered = [...events];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => {
        const title = (event.title || '').toLowerCase();
        const description = (event.description || '').toLowerCase();
        const location = (event.location || '').toLowerCase();
        return title.includes(term) || description.includes(term) || location.includes(term);
      });
    }

    if (filter === 'pending') {
      filtered = filtered.filter(event => event.status === 'pending');
    } else if (filter === 'approved') {
      filtered = filtered.filter(event => event.status === 'approved' && !event.isBlocked);
    } else if (filter === 'rejected') {
      filtered = filtered.filter(event => event.status === 'rejected');
    } else if (filter === 'blocked') {
      filtered = filtered.filter(event => event.isBlocked === true);
    } else if (filter === 'reported') {
      filtered = filtered.filter(event => getEventReportCount(event._id) > 0);
    } else if (filter === 'critical') {
      filtered = filtered.filter(event => isEventCritical(event._id));
    }

    return filtered;
  }, [events, searchTerm, filter, getEventReportCount, isEventCritical]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#d5006d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل الفعاليات...</p>
        </div>
      </div>
    );
  }

  const totalEvents = events.length;
  const pendingEvents = events.filter(e => e.status === 'pending').length;
  const approvedEvents = events.filter(e => e.status === 'approved' && !e.isBlocked).length;
  const rejectedEvents = events.filter(e => e.status === 'rejected').length;
  const blockedEvents = events.filter(e => e.isBlocked === true).length;
  const reportedEvents = events.filter(e => getEventReportCount(e._id) > 0).length;
  const criticalEvents = events.filter(e => isEventCritical(e._id)).length;

  const getStatusBadge = (event) => {
    if (event.isBlocked) {
      return <span className="bg-red-700 text-white px-3 py-1 rounded-full text-xs font-bold">🚫 محظورة</span>;
    }
    switch(event.status) {
      case 'pending': return <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold">⏳ قيد المراجعة</span>;
      case 'approved': return <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">✅ منشورة</span>;
      case 'rejected': return <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">❌ مرفوضة</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {filter === 'pending' ? 'الفعاليات قيد المراجعة' : 
               filter === 'approved' ? 'الفعاليات المنشورة' : 
               filter === 'rejected' ? 'الفعاليات المرفوضة' :
               filter === 'blocked' ? 'الفعاليات المحظورة' :
               filter === 'reported' ? 'الفعاليات المبلغ عنها' :
               filter === 'critical' ? 'الفعاليات الحرجة' :
               'إدارة الفعاليات'}
            </h1>
            <p className="text-gray-400">
              {totalEvents} فعالية • {reports.filter(r => r.status === 'pending').length} بلاغ قيد المراجعة
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

        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <div onClick={() => { setFilter('all'); setSearchTerm(''); }} className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'all' ? 'border-[#d5006d]' : 'border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{totalEvents}</h3>
            </div>
            <p className="text-gray-400 text-sm">كل الفعاليات</p>
          </div>
          
          <div onClick={() => { setFilter('pending'); setSearchTerm(''); }} className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'pending' ? 'border-yellow-500' : 'border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-yellow-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{pendingEvents}</h3>
            </div>
            <p className="text-gray-400 text-sm">قيد المراجعة</p>
          </div>
          
          <div onClick={() => { setFilter('approved'); setSearchTerm(''); }} className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'approved' ? 'border-green-500' : 'border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-green-500/10 rounded-lg">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{approvedEvents}</h3>
            </div>
            <p className="text-gray-400 text-sm">منشورة</p>
          </div>
          
          <div onClick={() => { setFilter('rejected'); setSearchTerm(''); }} className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'rejected' ? 'border-red-500' : 'border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-red-500/10 rounded-lg">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{rejectedEvents}</h3>
            </div>
            <p className="text-gray-400 text-sm">مرفوضة</p>
          </div>
          
          <div onClick={() => { setFilter('blocked'); setSearchTerm(''); }} className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'blocked' ? 'border-red-700' : 'border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-red-500/10 rounded-lg">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{blockedEvents}</h3>
            </div>
            <p className="text-gray-400 text-sm">محظورة</p>
          </div>
          
          <div onClick={() => { setFilter('reported'); setSearchTerm(''); }} className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'reported' ? 'border-yellow-500' : 'border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-yellow-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{reportedEvents}</h3>
            </div>
            <p className="text-gray-400 text-sm">مبلغ عنها</p>
          </div>
          
          <div onClick={() => { setFilter('critical'); setSearchTerm(''); }} className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'critical' ? 'border-red-500 animate-pulse' : 'border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-red-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{criticalEvents}</h3>
            </div>
            <p className="text-gray-400 text-sm">حرجة (10+ شخص)</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث في الفعاليات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl py-3.5 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {getFilteredEvents.length > 0 ? (
          getFilteredEvents.map((event) => {
            const reportCount = getEventReportCount(event._id);
            const uniqueReportersCount = getEventUniqueReportersCount(event._id);
            const isCritical = isEventCritical(event._id);
            const eventReports = getEventReports(event._id);
            const pendingReports = eventReports.filter(r => r.status === 'pending');
            const isExpanded = expandedItems[event._id];
            const hasReports = reportCount > 0;
            const isInReportedSection = filter === 'reported' || filter === 'critical';
            const isInBlockedSection = filter === 'blocked';

            return (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border overflow-hidden ${
                  isCritical ? 'border-red-500/50' :
                  hasReports ? 'border-yellow-500/30' :
                  event.isBlocked ? 'border-red-700' :
                  'border-gray-700'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                        {event.image ? (
                          <img 
                            src={`http://localhost:5000${event.image}`}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${event.title}&background=d5006d&color=fff&size=128`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                      </div>         
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-xl font-bold text-white">{event.title}</h3>
                            <div className="flex gap-2 flex-wrap">
                              {getStatusBadge(event)}
                              
                              {isCritical && (
                                <span className="px-3 py-1 bg-red-500 text-white text-xs rounded-full font-medium animate-pulse">
                                  حرجة ({uniqueReportersCount} شخص)
                                </span>
                              )}
                              
                              {hasReports && !isCritical && (
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                                  {reportCount} بلاغ من {uniqueReportersCount} شخص
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{event.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-400" />
                              <span>{event.location || 'غير محدد'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-400" />
                              <span>{event.date ? new Date(event.date).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <span className="font-bold">{event.price} ETH</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-400" />
                              <span>{event.capacity - (event.bookedSeats || 0)} / {event.capacity} مقعد</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="text-gray-400 text-sm">👤 الفنان:</span>
                            <span className="text-blue-400 text-sm">{event.artist?.username || event.artist?.name || 'غير معروف'}</span>
                          </div>
                          
                          {event.blockReason && event.isBlocked && (
                            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-red-300 text-xs">
                                <strong>سبب الحظر:</strong> {event.blockReason}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{event.capacity - (event.bookedSeats || 0)}</div>
                            <div className="text-xs text-gray-400">مقاعد متاحة</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{event.bookedSeats || 0}</div>
                            <div className="text-xs text-gray-400">محجوزة</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => toggleExpand(event._id)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors flex items-center gap-2"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                        </button>
                        
                        {event.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveEvent(event._id)}
                              disabled={actionLoading === event._id || !event.identityDocument || !event.proofDocument}
                              className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                                (!event.identityDocument || !event.proofDocument)
                                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {actionLoading === event._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              اعتماد
                            </button>
                            <button
                              onClick={() => handleRejectEvent(event._id)}
                              disabled={actionLoading === event._id}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center gap-2"
                            >
                              {actionLoading === event._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                              رفض
                            </button>
                          </>
                        )}
                        
                        {event.status === 'approved' && !event.isBlocked && (
                          <>
                            <button
                              onClick={() => handleRejectEvent(event._id)}
                              disabled={actionLoading === event._id}
                              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors flex items-center gap-2"
                            >
                              {actionLoading === event._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                              إلغاء
                            </button>
                            <button
                              onClick={() => handleBlockEvent(event._id)}
                              disabled={actionLoading === event._id}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center gap-2"
                            >
                              {actionLoading === event._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                              حظر
                            </button>
                          </>
                        )}
                        
                        {event.isBlocked && (
                          <button
                            onClick={() => handleUnblockEvent(event._id)}
                            disabled={actionLoading === event._id}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center gap-2"
                          >
                            {actionLoading === event._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            رفع الحظر
                          </button>
                        )}
                        
                        {isCritical && (
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            disabled={actionLoading === event._id}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center gap-2"
                          >
                            {actionLoading === event._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            حذف
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-700 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-white font-bold text-lg mb-4">تفاصيل الفعالية</h4>
                          <div className="bg-gray-900/50 rounded-xl p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-gray-400 text-sm mb-1">الحالة</div>
                                <div className="text-white font-medium">
                                  {event.isBlocked ? 'محظورة' : 
                                   event.status === 'pending' ? 'قيد المراجعة' :
                                   event.status === 'approved' ? 'منشورة' : 'مرفوضة'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm mb-1">تاريخ الإنشاء</div>
                                <div className="text-white font-medium">
                                  {new Date(event.createdAt).toLocaleDateString('ar-EG')}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm mb-1">السعر</div>
                                <div className="text-white font-medium">{event.price} ETH</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm mb-1">السعة</div>
                                <div className="text-white font-medium">{event.capacity} مقعد</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm mb-1">المقاعد المحجوزة</div>
                                <div className="text-white font-medium">{event.bookedSeats || 0}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm mb-1">عدد المبلغين الفريدين</div>
                                <div className={`font-medium ${uniqueReportersCount >= 10 ? 'text-red-400' : 'text-white'}`}>
                                  {uniqueReportersCount} شخص
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* الوثائق الثبوتية */}
                        <div>
                          <h4 className="text-white font-bold text-lg mb-4">الوثائق الثبوتية</h4>
                          <div className="bg-gray-900/50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-purple-400" />
                                <span className="text-white text-sm">صورة الهوية</span>
                              </div>
                              {event.identityDocument ? (
                                <button onClick={() => viewDocument(event.identityDocument)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition flex items-center gap-2">
                                  <Eye size={14} /> معاينة
                                </button>
                              ) : (
                                <span className="text-gray-400 text-sm">لا توجد وثيقة</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-green-400" />
                                <span className="text-white text-sm">إثبات الحجز</span>
                              </div>
                              {event.proofDocument ? (
                                <button onClick={() => viewDocument(event.proofDocument)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition flex items-center gap-2">
                                  <Eye size={14} /> معاينة
                                </button>
                              ) : (
                                <span className="text-gray-400 text-sm">لا توجد وثيقة</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {isInReportedSection && hasReports && (
                        <div>
                          <h4 className="text-white font-bold text-lg mb-4">
                            البلاغات ({pendingReports.length}/{eventReports.length})
                          </h4>
                          
                          {pendingReports.length > 0 ? (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                              {pendingReports.map((report) => (
                                <div key={report._id} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <div className="text-white font-medium mb-1">
                                        <AlertTriangle className="w-3 h-3 inline text-yellow-400 mr-2" />
                                        بلاغ من {report.reporter?.name || report.reporter?.username || 'مستخدم'}
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
                                        onClick={() => handleResolveReport(report._id, event._id)}
                                        disabled={reportActionLoading === report._id}
                                        className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                                      >
                                        {reportActionLoading === report._id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Check className="w-3 h-3" />
                                        )}
                                        حل البلاغ (رفضه)
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-900/30 rounded-xl p-8 text-center">
                              <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
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
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">لا توجد فعاليات</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `لم يتم العثور على فعاليات تطابق "${searchTerm}"`
                : filter === 'pending'
                ? 'لا توجد فعاليات قيد المراجعة'
                : filter === 'approved'
                ? 'لا توجد فعاليات منشورة'
                : filter === 'rejected'
                ? 'لا توجد فعاليات مرفوضة'
                : filter === 'blocked'
                ? 'لا توجد فعاليات محظورة'
                : filter === 'reported'
                ? 'لا توجد فعاليات مبلغ عنها'
                : filter === 'critical'
                ? 'لا توجد فعاليات حرجة (10+ بلاغ من 10+ شخص)'
                : 'لم يتم العثور على فعاليات'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#d5006d] to-[#ff4081] text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              عرض جميع الفعاليات
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsManagement;