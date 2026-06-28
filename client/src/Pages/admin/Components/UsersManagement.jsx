import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, Search, BarChart3, AlertTriangle, 
  CheckCircle, User, Clock, Shield, Ban, 
  ChevronDown, ChevronUp, Star, 
  Palette, Loader2, Check, X,
  Filter, ThumbsUp, MessageCircle, Calendar,
  Edit, Trash2, ExternalLink,
  RefreshCw, Flag, Mail, MoreVertical
} from 'lucide-react';
import axios from 'axios';

const UsersManagement = ({ getToken, currentAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [reportActionLoading, setReportActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({});
  
  const isSuspendingRef = useRef(false);
  const criticalThreshold = 10;
  const API_BASE_URL = 'http://localhost:5000/api';

  const fetchUsersData = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const usersData = response.data.users || [];
        const enhancedUsers = usersData.map(user => ({
          _id: user._id,
          name: user.name || user.username || 'مستخدم',
          username: user.username || 'غير معروف',
          email: user.email || '',
          role: user.role || 'user',
          isActive: user.isActive !== false,
          isSuspended: user.isSuspended || false,
          suspendReason: user.suspendReason || null,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
          statistics: {
            artworksCount: user.statistics?.artworksCount || 0,
            followersCount: user.statistics?.followersCount || 0,
            followingCount: user.statistics?.followingCount || 0,
            reportsCount: user.statistics?.reportsCount || 0,
            uniqueReporters: user.statistics?.uniqueReporters || 0,
            isCritical: user.statistics?.isCritical || false
          }
        }));
        setUsers(enhancedUsers);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
      setUsers([]);
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
        const userReports = allReports.filter(report => 
          report.targetType === 'user'
        );
        setReports(userReports);
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
        fetchUsersData(),
        fetchReportsData(),
        fetchStatsData()
      ]);
    } catch (error) {
      console.error('❌ خطأ في جلب البيانات:', error);
    }
    setLoading(false);
  }, [fetchUsersData, fetchReportsData, fetchStatsData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

const getUserUniqueReportersCount = useCallback((userId) => {
  // ✅ فقط البلاغات pending (النشطة)
  const userReports = reports.filter(report => 
    report.targetId && String(report.targetId) === String(userId) &&
    report.status === 'pending'
  );
  
  const uniqueReporters = new Set(
    userReports.map(report => report.reporter?._id).filter(id => id)
  );
  
  return uniqueReporters.size;
}, [reports]);

  const getUserReportCount = useCallback((userId) => {
    return reports.filter(report => 
      report.targetId && String(report.targetId) === String(userId) && 
      report.status === 'pending'
    ).length;
  }, [reports]);

  const getUserReports = useCallback((userId) => {
    return reports.filter(report => 
      report.targetId && String(report.targetId) === String(userId)
    );
  }, [reports]);

const isUserCritical = useCallback((userId) => {
  return getUserUniqueReportersCount(userId) >= criticalThreshold;
}, [getUserUniqueReportersCount]);

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

  const handleSuspendUser = async (userId) => {
    if (isSuspendingRef.current) return;
    if (actionLoading === userId) return;
    if (!window.confirm('⚠️ هل تريد تعليق هذا المستخدم؟')) return;

    isSuspendingRef.current = true;
    setActionLoading(userId);
    
    try {
      const token = getToken();
      if (!token) {
        alert('❌ لم يتم العثور على رمز الدخول');
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/admin/users/${userId}/status`,
        { 
          status: 'blocked',
          suspendReason: 'مخالفة شروط الاستخدام - تم تعليق الحساب بقرار من الإدارة'
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('📥 استجابة الخادم بعد التعليق:', response.data);

      if (response.data.success) {
        alert('✅ تم تعليق المستخدم بنجاح');
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, isActive: false, isSuspended: true, suspendReason: 'تم التعليق من قبل الإدارة' }
              : user
          )
        );
        
        if (filter === 'reported' || filter === 'critical') {
          setFilter('blocked');
        }
        
        fetchStatsData();
      } else {
        throw new Error(response.data.message || 'فشل تعليق المستخدم');
      }
    } catch (error) {
      console.error('❌ خطأ في تعليق المستخدم:', error);
      alert('❌ فشل في تعليق المستخدم: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(null);
      setTimeout(() => {
        isSuspendingRef.current = false;
      }, 500);
    }
  };

  const handleActivateUser = async (userId) => {
    if (actionLoading === userId) return;
    if (!window.confirm('هل تريد تفعيل هذا المستخدم؟')) return;

    setActionLoading(userId);
    try {
      const token = getToken();
      await axios.put(
        `${API_BASE_URL}/admin/users/${userId}/status`,
        { status: 'active' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      alert('✅ تم تفعيل المستخدم بنجاح');
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, isActive: true, isSuspended: false, suspendReason: null }
            : user
        )
      );
      
      setFilter('all');
      fetchStatsData();
      
    } catch (error) {
      console.error('❌ خطأ في تفعيل المستخدم:', error);
      alert('❌ فشل في تفعيل المستخدم');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('⚠️ تحذير: هل تريد حذف هذا المستخدم بشكل نهائي؟ هذا الإجراء لا يمكن التراجع عنه!')) return;
    if (actionLoading === userId) return;

    setActionLoading(userId);
    try {
      const token = getToken();
      await axios.delete(
        `${API_BASE_URL}/admin/users/${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      alert('✅ تم حذف المستخدم بنجاح');
      fetchStatsData();
      
    } catch (error) {
      console.error('❌ خطأ في حذف المستخدم:', error);
      alert('❌ فشل في حذف المستخدم: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveReport = async (reportId, userId) => {
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

  const toggleExpand = (userId) => {
    setExpandedItems(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const getFilteredUsers = useMemo(() => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        const name = (user.name || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        return name.includes(term) || username.includes(term) || email.includes(term);
      });
    }

    if (filter === 'reported') {
      filtered = filtered.filter(user => getUserReportCount(user._id) > 0);
    } else if (filter === 'blocked') {
      filtered = filtered.filter(user => !user.isActive);
    } else if (filter === 'critical') {
      filtered = filtered.filter(user => isUserCritical(user._id));
    }

    return filtered;
  }, [users, searchTerm, filter, getUserReportCount, isUserCritical]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#d5006d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const reportedUsers = users.filter(u => getUserReportCount(u._id) > 0).length;
  const blockedUsers = users.filter(u => !u.isActive).length;
  const criticalUsers = users.filter(u => isUserCritical(u._id)).length;

  return (
    <div className="min-h-scree p-4 md:p-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {filter === 'reported' ? 'المستخدمون المبلغ عنهم' : 
               filter === 'critical' ? 'المستخدمون الحرجة' : 
               filter === 'blocked' ? 'المستخدمون المعلقين' :
               'إدارة المستخدمين'}
            </h1>
            <p className="text-gray-400">
              {totalUsers} مستخدم • {reports.filter(r => r.status === 'pending').length} بلاغ قيد المراجعة
              {stats.suspendedUsers > 0 && ` • ${stats.suspendedUsers} معلق تلقائياً`}
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div 
            onClick={() => { setFilter('all'); setSearchTerm(''); }}
            className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'all' ? 'border-[#d5006d]' : 'border-gray-700'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{stats.totalUsers || totalUsers}</h3>
            </div>
            <p className="text-gray-400 text-sm">كل المستخدمين</p>
          </div>
          
          <div 
            onClick={() => { setFilter('reported'); setSearchTerm(''); }}
            className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'reported' ? 'border-yellow-500' : 'border-gray-700'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-yellow-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{reportedUsers}</h3>
            </div>
            <p className="text-gray-400 text-sm">مبلغ عنهم</p>
          </div>
          
          <div 
            onClick={() => { setFilter('blocked'); setSearchTerm(''); }}
            className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'blocked' ? 'border-red-500' : 'border-gray-700'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-red-500/10 rounded-lg">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{stats.blockedUsers || blockedUsers}</h3>
            </div>
            <p className="text-gray-400 text-sm">معلقين</p>
          </div>
          
          <div 
            onClick={() => { setFilter('critical'); setSearchTerm(''); }}
            className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border cursor-pointer transition-all ${filter === 'critical' ? 'border-red-500 animate-pulse' : 'border-gray-700'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-red-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{stats.criticalUsers || criticalUsers}</h3>
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
            placeholder="ابحث في المستخدمين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl py-3.5 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {getFilteredUsers.length > 0 ? (
          getFilteredUsers.map((user) => {
            const reportCount = getUserReportCount(user._id);
            const uniqueReportersCount = getUserUniqueReportersCount(user._id);
            const isCritical = isUserCritical(user._id);
            const userReports = getUserReports(user._id);
            const pendingReports = userReports.filter(r => r.status === 'pending');
            const isExpanded = expandedItems[user._id];
            const hasReports = reportCount > 0;
            const isInReportedSection = filter === 'reported' || filter === 'critical';
            const isInBlockedSection = filter === 'blocked';

            return (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border overflow-hidden ${
                  isCritical ? 'border-red-500/50' :
                  hasReports ? 'border-yellow-500/30' :
                  !user.isActive ? 'border-gray-600' :
                  'border-gray-700'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                        <img 
                          src={user.profilePicture ? `http://localhost:5000${user.profilePicture}` : `https://ui-avatars.com/api/?name=${user.username}&background=d5006d&color=fff&size=128`}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=d5006d&color=fff&size=128`;
                          }}
                        />
                      </div>         
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-xl font-bold text-white">{user.name}</h3>
                            <div className="flex gap-2 flex-wrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.isActive 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {user.isActive ? 'نشط' : (user.isSuspended ? 'موقوف تلقائياً' : 'موقوف')}
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
                              
                              {user.isSuspended && (
                                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
                                  معلق تلقائياً
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-400" />
                              <span className="text-white font-medium">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">@{user.username}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(user.createdAt).toLocaleDateString('ar-EG')}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-xs ${
                              user.role === 'artist' ? 'bg-purple-500/20 text-purple-400' :
                              user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {user.role === 'artist' ? 'فنان' : 
                               user.role === 'admin' ? 'مدير' : 'مستخدم'}
                            </span>
                          </div>
                          
                          {user.suspendReason && !user.isActive && (
                            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-red-300 text-xs">
                                <strong>سبب التعليق:</strong> {user.suspendReason}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{user.statistics.artworksCount}</div>
                            <div className="text-xs text-gray-400">أعمال</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{user.statistics.followersCount}</div>
                            <div className="text-xs text-gray-400">متابعين</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{user.statistics.followingCount}</div>
                            <div className="text-xs text-gray-400">يتابع</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => toggleExpand(user._id)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors flex items-center gap-2"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                        </button>
                        
                        <button
                          onClick={() => window.open(`/profile/${user._id}`, '_blank')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          عرض الملف الشخصي
                        </button>    
                        
                        {isInBlockedSection && (
                          <button
                            onClick={() => handleActivateUser(user._id)}
                            disabled={actionLoading === user._id}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === user._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            تفعيل المستخدم
                          </button>
                        )}
                        
                        {isInReportedSection && !isCritical && hasReports && (
                          <button
                            onClick={() => handleSuspendUser(user._id)}
                            disabled={actionLoading === user._id}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === user._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                            تعليق المستخدم
                          </button>
                        )}
                        
                        {isCritical && (
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={actionLoading === user._id}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === user._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            حذف المستخدم
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
                          <h4 className="text-white font-bold text-lg mb-4">تفاصيل المستخدم</h4>
                          <div className="bg-gray-900/50 rounded-xl p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-gray-400 text-sm mb-1">الدور</div>
                                <div className="text-white font-medium">
                                  {user.role === 'admin' ? 'مدير' : 
                                   user.role === 'artist' ? 'فنان' : 'مستخدم'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm mb-1">الحالة</div>
                                <div className={`font-medium ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                  {user.isActive ? 'نشط' : (user.isSuspended ? 'موقوف تلقائياً' : 'موقوف')}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm mb-1">تاريخ التسجيل</div>
                                <div className="text-white font-medium">
                                  {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm mb-1">عدد الأعمال</div>
                                <div className="text-white font-medium">{user.statistics.artworksCount}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm mb-1">عدد المبلغين الفريدين</div>
                                <div className={`font-medium ${uniqueReportersCount >= 10 ? 'text-red-400' : 'text-white'}`}>
                                  {uniqueReportersCount} شخص
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm mb-1">البلاغات المعلقة</div>
                                <div className="text-white font-medium">{reportCount}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white font-bold text-lg mb-4">إحصائيات المستخدم</h4>
                          <div className="bg-gray-900/50 rounded-xl p-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{user.statistics.artworksCount}</div>
                                <div className="text-xs text-gray-400">أعمال</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{user.statistics.followersCount}</div>
                                <div className="text-xs text-gray-400">متابعين</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">{user.statistics.followingCount}</div>
                                <div className="text-xs text-gray-400">يتابع</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isInReportedSection && hasReports && (
                        <div>
                          <h4 className="text-white font-bold text-lg mb-4">
                            البلاغات ({pendingReports.length}/{userReports.length})
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
                                        onClick={() => handleResolveReport(report._id, user._id)}
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
            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">لا توجد مستخدمين</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `لم يتم العثور على مستخدمين تطابق "${searchTerm}"`
                : filter === 'reported'
                ? 'لا توجد مستخدمين مبلغ عنهم'
                : filter === 'blocked'
                ? 'لا توجد مستخدمين معلقين'
                : filter === 'critical'
                ? 'لا توجد مستخدمين حرجة (10+ بلاغ من 10+ شخص)'
                : 'لم يتم العثور على مستخدمين'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#d5006d] to-[#ff4081] text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              عرض جميع المستخدمين
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;