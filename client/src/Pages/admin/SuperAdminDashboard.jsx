import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, BarChart3, Shield, Settings, Bell, Menu, X, FileText, LogOut
} from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

import OverviewSection from './sections/OverviewSection';
import AdminsSection from './sections/AdminsSection';
import ReportsSection from './sections/ReportsSection';
import SettingsSection from './sections/SettingsSection';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [admins, setAdmins] = useState([]);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  
  const getToken = () => {
    return localStorage.getItem('adminToken');
  };

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
      navigate('/admin/login');
      return;
    }
    
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    
    if (adminData.role !== 'superadmin' && adminData.role !== 'super_admin') {
      navigate('/admin/dashboard');
      return;
    }
    
    setCurrentAdmin(adminData);
    fetchDashboardStats();
    fetchAdminsList();
    fetchGeneratedReports();
    fetchUnreadCount();
    setLoading(false);
    
    const newSocket = io('http://localhost:5000', {
      auth: { token, role: adminData.role }
    });
    
    newSocket.on('connect', () => {
      console.log('✅ سوبر أدمن متصل بـ Socket.IO');
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
  }, [navigate]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

  const fetchAdminsList = async () => {
    try {
      const token = getToken();
      const response = await axios.get('http://localhost:5000/api/admin/admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) setAdmins(response.data.data);
    } catch (error) {
      console.error('Fetch error:', error);
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
    navigate('/admin/login');
  };

  const menuItems = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'admins', label: 'إدارة الأدمن', icon: Users },
    { id: 'reports', label: 'التقارير', icon: FileText },
    { id: 'settings', label: 'الإعدادات', icon: Settings }
  ];

  const commonProps = {
    getToken,
    handleLogout,
    stats,
    setStats,
    admins,
    setAdmins,
    generatedReports,
    setGeneratedReports,
    fetchAdminsList,
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
          <p className="text-gray-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${bgMain}`} dir="rtl">
      {/* السايد بار */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className={`fixed lg:relative ${bgSidebar} backdrop-blur-lg shadow-2xl z-30 w-80 h-full border-r ${borderColor}`}
        style={{ left: sidebarOpen ? 0 : -300, right: 'auto' }}
      >
        {/* ✅ هيدر السايد بار - صار أصغر ونفس مستوى الهيدر الرئيسي */}
        <div className={`px-4 py-3 border-b ${borderColor}`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 bg-gradient-to-r ${pinkGradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${textColor}`}>
                {currentAdmin?.fullName || currentAdmin?.username || 'ArtWay'}
              </h1>
              <p className={`text-xs ${textMuted}`}>Super Admin</p>
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

        <div className={`p-4 border-t ${borderColor}`}>
          <button
            onClick={handleLogout}
            className={`w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-300`}
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
          {activeTab === 'admins' && <AdminsSection {...commonProps} />}
          {activeTab === 'reports' && <ReportsSection {...commonProps} />}
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

export default SuperAdminDashboard;