import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Bell, Check, ArrowLeft, RefreshCw, Filter, 
  Calendar, Clock, User, Image, CalendarDays, Flag, AlertCircle
} from 'lucide-react';

const API_BASE = "http://localhost:5000";

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const getToken = () => localStorage.getItem('adminToken');

  useEffect(() => {
    fetchNotifications();
  }, []);
  useEffect(() => {
  const token = getToken();
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  
  const newSocket = io('http://localhost:5000', {
    auth: { token, role: adminData.role }
  });
  
  newSocket.on('admin-notification', (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  });
  
  return () => newSocket.disconnect();
}, []);

  const fetchNotifications = async () => {
    setIsRefreshing(true);
    try {
      const token = getToken();
      const res = await axios.get(`${API_BASE}/api/notifications/admin-notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch (err) {
      console.error('❌ فشل جلب الإشعارات:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = getToken();
      await axios.put(
        `${API_BASE}/api/notifications/admin/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('❌ فشل تحديث الإشعار:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getToken();
      await axios.put(
        `${API_BASE}/api/notifications/admin/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('❌ فشل تحديث الإشعارات:', err);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'read') return notifications.filter(n => n.read);
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();

  const getNotificationConfig = (type, category) => {
    const configs = {
      new_user: {
        icon: User,
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        badge: 'bg-blue-500',
        label: 'مستخدم جديد'
      },
      new_artwork: {
        icon: Image,
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        badge: 'bg-purple-500',
        label: 'عمل فني'
      },
      new_event: {
        icon: CalendarDays,
        bg: 'bg-green-50',
        border: 'border-green-200',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        badge: 'bg-green-500',
        label: 'فعالية'
      },
      new_report: {
        icon: Flag,
        bg: 'bg-red-50',
        border: 'border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        badge: 'bg-red-500',
        label: 'بلاغ'
      },
      system_alert: {
        icon: AlertCircle,
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        badge: 'bg-amber-500',
        label: 'تنبيه نظام'
      }
    };

    return configs[type] || configs[category] || {
      icon: Bell,
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      badge: 'bg-gray-500',
      label: 'إشعار'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">جاري تحميل الإشعارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* هيدر - مطابق تماماً لهيدر SuperAdminDashboard */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/super-dashboard"
                className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">الإشعارات</h1>
                <p className="text-sm text-gray-500">
                  {adminData?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* فلتر */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200 cursor-pointer"
                >
                  <option value="all">كل الإشعارات</option>
                  <option value="unread">غير مقروءة</option>
                  <option value="read">مقروءة</option>
                </select>
                <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>

              {/* تحديث */}
              <button
                onClick={fetchNotifications}
                disabled={isRefreshing}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>

              {/* تعيين الكل كمقروء */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md flex items-center gap-2"
                >
                  <Check size={16} />
                  <span>تعيين الكل كمقروء</span>
                </button>
              )}
            </div>
          </div>

          {/* شريط التنبيه - نفس تدرج السايد بار */}
          {unreadCount > 0 && (
            <div className="mt-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-3 flex items-center gap-3">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700 text-sm">
                لديك <span className="font-bold text-pink-600">{unreadCount}</span> إشعارات جديدة
              </span>
            </div>
          )}
        </div>
      </header>

      {/* المحتوى - نفس خلفية main في SuperAdminDashboard */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">لا توجد إشعارات</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'أنت على اطلاع بكل شيء' 
                  : filter === 'unread' 
                    ? 'جميع الإشعارات مقروءة' 
                    : 'لا توجد إشعارات مقروءة'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const config = getNotificationConfig(notif.type, notif.category);
                const IconComponent = config.icon;
                
                return (
                  <div
                    key={notif._id}
                    className={`group bg-white rounded-2xl border ${config.border} p-5 transition-all hover:shadow-md ${!notif.read ? 'shadow-sm' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}>
                        <IconComponent size={22} className={config.iconColor} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badge} text-white`}>
                            {config.label}
                          </span>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                          )}
                        </div>
                        
                        <h4 className="font-bold text-gray-800 mb-1">{notif.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{notif.message}</p>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar size={12} />
                            {new Date(notif.createdAt).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={12} />
                            {new Date(notif.createdAt).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-pink-500 hover:border-pink-200 shrink-0"
                          title="تحديد كمقروء"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;