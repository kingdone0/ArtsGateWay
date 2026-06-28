import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Palette, BarChart3, Shield, Settings, Bell, Menu, X, 
  FileText, Calendar, LogOut
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

import OverviewSection from './sections/OverviewSection';
import UsersManagement from './Components/UsersManagement';
import ArtworksManagement from './Components/ArtworksManagement';
import SettingsSection from './sections/SettingsSection';
import EventsManagement from './Components/EventsManagement';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [generatedReports, setGeneratedReports] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  
  const bgMain = 'bg-gradient-to-br from-gray-900 via-[#1a1a2e] to-[#16213e]';
  const bgCard = 'bg-gray-800/90 backdrop-blur-lg';
  const bgSidebar = 'bg-gray-800/20 backdrop-blur-lg';
  const bgHeader = 'bg-gray-800/20 backdrop-blur-lg';
  const borderColor = 'border-gray-700/50';
  const textColor = 'text-white';
  const textMuted = 'text-gray-400';
  const hoverBg = 'hover:bg-gray-700/50';
  const cardBorder = 'border-gray-700/50';
  const inputBg = 'bg-gray-700/50';
  const inputBorder = 'border-gray-600';
  const pinkGradient = 'from-[#d5006d] to-[#ff4081]';
  const pinkHover = 'hover:from-[#b3005c] hover:to-[#e91e63]';

  const getToken = () => localStorage.getItem('adminToken');

  const fetchUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await axios.get('http://localhost:5000/api/notifications/admin/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setUnreadCount(response.data.data?.count || response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }
    
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    
    if (adminData && Object.keys(adminData).length > 0) {
      setCurrentAdmin(adminData);
      fetchDashboardStats();
      fetchGeneratedReports();
      fetchUnreadCount();
      setLoading(false);
    } else {
      fetchAdminProfile();
    }
    
    const newSocket = io('http://localhost:5000', {
      auth: { token, role: adminData.role }
    });
    
    newSocket.on('connect', () => {
      console.log('✅ أدمن متصل بـ Socket.IO');
    });
    
    newSocket.on('admin-notification', (notification) => {
      console.log('📨 إشعار جديد:', notification);
      setUnreadCount(prev => prev + 1);
      if (Notification.permission === 'granted') {
        new Notification(notification.title, { body: notification.message });
      }
    });
    
    setSocket(newSocket);
    
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const token = getToken();
      const response = await axios.get('http://localhost:5000/api/admin/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCurrentAdmin(response.data.data);
        localStorage.setItem('adminData', JSON.stringify(response.data.data));
        fetchDashboardStats();
        fetchGeneratedReports();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = getToken();
      const response = await axios.get('http://localhost:5000/api/admin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchGeneratedReports = () => {
    try {
      const savedReports = localStorage.getItem('generatedReports');
      if (savedReports) setGeneratedReports(JSON.parse(savedReports));
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  };

  const saveReportsToStorage = (reports) => {
    try {
      localStorage.setItem('generatedReports', JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving reports:', error);
    }
  };

  const handleLogout = () => {
    if (socket) socket.disconnect();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('generatedReports');
    window.location.href = '/admin/login';
  };

  const getMenuItems = () => {
    if (!currentAdmin) return [];

    const baseItems = [
      { id: 'overview', label: 'نظرة عامة', icon: BarChart3, permission: null },
      { id: 'users', label: 'المستخدمين', icon: Users, permission: 'canManageUsers' },
      { id: 'artworks', label: 'الأعمال الفنية', icon: Palette, permission: 'canViewArtworks' },
      { id: 'events', label: 'الفعاليات', icon: Calendar, permission: 'canApproveEvents' },
      { id: 'reports', label: 'الإبلاغات', icon: FileText, permission: 'canViewReports' },
      { id: 'settings', label: 'الإعدادات', icon: Settings, permission: null }
    ];

    if (currentAdmin.role === 'superadmin' || currentAdmin.role === 'super_admin') {
      return baseItems;
    }

    return baseItems.filter(item => {
      if (item.permission === null) return true;
      return currentAdmin.permissions?.[item.permission] === true;
    });
  };

  const menuItems = getMenuItems();

  const commonProps = {
    getToken,
    handleLogout,
    stats,
    setStats,
    generatedReports,
    setGeneratedReports,
    fetchDashboardStats,
    fetchGeneratedReports,
    saveReportsToStorage,
    currentAdmin,
    fetchUnreadCount,
    bgMain,
    bgCard,
    textColor,
    textMuted,
    borderColor: cardBorder,
    inputBg,
    inputBorder,
    pinkGradient,
    pinkHover
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${bgMain}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-[#d5006d] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!currentAdmin) {
    return (
      <div className={`flex items-center justify-center h-screen ${bgMain}`}>
        <div className="text-center">
          <p className={textColor}>غير مصرح بالوصول</p>
          <button 
            onClick={() => window.location.href = '/admin/login'}
            className={`mt-4 px-6 py-2 bg-gradient-to-r ${pinkGradient} rounded-lg ${pinkHover} transition-colors text-white`}
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${bgMain}`} dir="rtl">
      
      <motion.div
        initial={{ x: 300 }}
        animate={{ x: sidebarOpen ? 0 : 300 }}
        className={`fixed lg:relative ${bgSidebar} backdrop-blur-lg shadow-2xl z-30 w-80 h-full border-l ${borderColor} right-0`}
      >
        <div className={`p-3 border-b ${borderColor}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${pinkGradient} rounded-full flex items-center justify-center`}>
              <span className="text-white font-semibold">
                {currentAdmin?.fullName?.charAt(0) || currentAdmin?.username?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className={`font-medium ${textColor}`}>{currentAdmin?.fullName || currentAdmin?.username || 'Admin'}</p>
              <p className={`text-sm ${textMuted} capitalize`}>
                {currentAdmin?.role === 'users_admin' ? 'Users Admin' : 
                 currentAdmin?.role === 'artwork_admin' ? 'Artwork Admin' : 
                 currentAdmin?.role}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl mb-2 transition-all duration-200 ${
                activeTab === item.id
                  ? `bg-gradient-to-r ${pinkGradient} text-white shadow-lg`
                  : `${textMuted} ${hoverBg}`
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700/50">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-red-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </motion.div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* الهيدر */}
        <header className={`${bgHeader} backdrop-blur-lg shadow-sm border-b ${borderColor} z-20`}>
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {sidebarOpen ? <X className={`w-5 h-5 ${textColor}`} /> : <Menu className={`w-5 h-5 ${textColor}`} />}
            </button>
            
            <div className="flex-1"></div>

            <Link
              to="/admin/notifications"
              className={`relative p-2 rounded-lg ${hoverBg} transition-colors`}
            >
              <Bell className={`w-5 h-5 ${textMuted}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* المحتوى */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'overview' && <OverviewSection {...commonProps} />}
          {activeTab === 'users' && <UsersManagement {...commonProps} />}
          {activeTab === 'artworks' && <ArtworksManagement {...commonProps} />}
          {activeTab === 'events' && <EventsManagement {...commonProps} />}
          {activeTab === 'reports' && <ReportsMangemaent {...commonProps} />}
          {activeTab === 'settings' && <SettingsSection {...commonProps} />}
        </main>
      </div>

      {/* تأثيرات الخلفية */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="fixed -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-[#d5006d]/20 to-transparent rounded-full blur-xl pointer-events-none"
      ></motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="fixed -bottom-20 -left-20 w-60 h-60 bg-gradient-to-r from-[#00b4db]/10 to-transparent rounded-full blur-xl pointer-events-none"
      ></motion.div>
    </div>
  );
};

export default AdminDashboard;