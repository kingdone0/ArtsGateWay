import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bell, Check, Calendar, Clock, ArrowLeft, RefreshCw, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000";

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem("artAppToken");
      const res = await axios.get(`${API_BASE}/api/notifications/my-notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) {
      console.error("❌ فشل جلب الإشعارات:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("artAppToken");
      await axios.patch(
        `${API_BASE}/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (err) {
      console.error("❌ فشل تحديث الإشعار:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("artAppToken");
      await axios.post(
        `${API_BASE}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (err) {
      console.error("❌ فشل تحديث الإشعارات:", err);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === "unread") return notifications.filter(n => !n.read);
    if (filter === "read") return notifications.filter(n => n.read);
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'event_approved':
        return {
          bg: 'from-green-50 to-green-100/50',
          border: 'border-green-200',
          icon: '✅',
          badge: 'bg-green-500',
          text: 'text-green-700',
          hover: 'hover:border-green-300'
        };
      case 'event_rejected':
        return {
          bg: 'from-red-50 to-red-100/50',
          border: 'border-red-200',
          icon: '❌',
          badge: 'bg-red-500',
          text: 'text-red-700',
          hover: 'hover:border-red-300'
        };
      case 'booking_confirmed':
        return {
          bg: 'from-purple-50 to-purple-100/50',
          border: 'border-purple-200',
          icon: '🎨',
          badge: 'bg-purple-500',
          text: 'text-purple-700',
          hover: 'hover:border-purple-300'
        };
      default:
        return {
          bg: 'from-pink-50 to-pink-100/50',
          border: 'border-pink-200',
          icon: '🎭',
          badge: 'bg-pink-500',
          text: 'text-pink-700',
          hover: 'hover:border-pink-300'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl animate-pulse">🎨</span>
            </div>
          </div>
          <p className="mt-6 text-gray-600 text-lg font-medium">جاري تحميل الإشعارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
 
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/profile/${currentUser?._id}`}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all hover:scale-110 text-pink-600 hover:text-pink-700 border border-pink-100"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  الإشعارات
                </h1>
                <p className="text-sm text-gray-500">كل ما يخص فعالياتك وأعمالك الفنية</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* فلتر فني */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-white text-gray-700 border border-pink-200 rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                  <option value="all">🎨 كل الإشعارات</option>
                  <option value="unread">✨ الغير مقروءة</option>
                  <option value="read">📖 المقروءة</option>
                </select>
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 pointer-events-none" size={16} />
              </div>

              {/* زر التحديث */}
              <button
                onClick={fetchNotifications}
                disabled={isRefreshing}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all hover:scale-110 text-pink-600 hover:text-pink-700 border border-pink-100 disabled:opacity-50"
                title="تحديث"
              >
                <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
              </button>

              {/* زر تحديد الكل كمقروء */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 rounded-xl transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <Check size={18} />
                  <span className="hidden sm:inline">تحديد الكل كمقروء</span>
                </button>
              )}
            </div>
          </div>

          {/* عداد إشعارات فني */}
          {unreadCount > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 p-3 rounded-xl border border-pink-200">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700">
                لديك <span className="text-pink-600 font-bold">{unreadCount}</span> إشعارات جديدة
              </span>
              <span className="text-xl mr-2">✨</span>
            </div>
          )}
        </div>
      </div>

      {/* الإشعارات */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-16 text-center border-2 border-pink-100 shadow-xl">
            <div className="relative w-40 h-40 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative bg-white rounded-full p-8 shadow-2xl">
                <span className="text-7xl">🎨</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">لا توجد إشعارات!</h2>
            <p className="text-gray-500 text-lg mb-6">
              {filter === "all"
                ? "كل شيء هادئ... استمتع بفنك"
                : filter === "unread"
                  ? "مبروك! كل الإشعارات مقروءة ✨"
                  : "لا توجد إشعارات مقروءة بعد"}
            </p>
            <div className="flex justify-center gap-2 text-4xl opacity-50">
              <span>🎭</span>
              <span>🎪</span>
              <span>🖼️</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notif, index) => {
              const style = getNotificationStyle(notif.type);
              return (
                <div
                  key={notif._id}
                  className={`group relative bg-gradient-to-r ${style.bg} backdrop-blur-sm rounded-2xl p-6 border-2 ${style.border} ${style.hover} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`,
                    opacity: 0,
                    transform: 'translateY(20px)'
                  }}
                >
                  <style>{`
                    @keyframes fadeInUp {
                      to {
                        opacity: 1;
                        transform: translateY(0);
                      }
                    }
                  `}</style>

                  {/* خط فني جانبي */}
                  <div className={`absolute right-0 top-4 bottom-4 w-1 rounded-full ${style.badge}`}></div>

                  <div className="flex items-start gap-4 pr-4">
                    {/* أيقونة فنية */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-white shadow-md border ${style.border}`}>
                      {style.icon}
                    </div>

                    {/* المحتوى */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-bold text-lg truncate ${style.text}`}>
                          {notif.title}
                        </h3>
                        {!notif.read && (
                          <span className={`px-3 py-1 ${style.badge} text-white text-xs rounded-full shadow-sm`}>
                            جديد
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock size={14} />
                          {new Date(notif.createdAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* زر تحديد كمقروء */}
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif._id)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg hover:scale-110 text-pink-600 hover:text-pink-700 border border-pink-200"
                        title="تحديد كمقروء"
                      >
                        <Check size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* عناصر زخرفية */}
      <div className="fixed bottom-0 left-0 opacity-5 text-9xl pointer-events-none select-none">
        🎨
      </div>
      <div className="fixed top-20 right-0 opacity-5 text-9xl pointer-events-none select-none transform rotate-12">
        🖼️
      </div>
    </div>
  );
};

export default Notifications;