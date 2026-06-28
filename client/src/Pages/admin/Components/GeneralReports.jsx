import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Palette, 
  BarChart3, 
  Shield, 
  Settings,
  Bell,
  Search,
  Menu,
  X,
  DollarSign,
  FileText,
  Download,
  UserPlus,
  Lock,
  Unlock,
  Trash2,
  Calendar,
  Building,
  LogOut,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const SuperAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [admins, setAdmins] = useState([]);

  // states خاصة بالتقارير فقط
  const [selectedReports, setSelectedReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'financial_admin',
    permissions: {
      canViewFinancial: false,
      canViewReports: false,
      canViewUsers: false,
      canViewArtworks: false,
      canManageAdmins: false,
      canGenerateReports: false
    }
  });
  const [createLoading, setCreateLoading] = useState(false);

  // جلب بيانات السوبر أدمن
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          window.location.href = '/admin/login';
          return;
        }

        const adminData = JSON.parse(localStorage.getItem('adminData'));
        
        if (adminData && adminData.role === 'superadmin') {
          setCurrentAdmin(adminData);
          fetchDashboardStats();
          fetchAdminsList();
        } else {
          window.location.href = '/admin/dashboard';
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

    fetchAdminData();
  }, []);

  // جلب إحصائيات الداشبورد
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // جلب قائمة الأدمن
  const fetchAdminsList = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('http://localhost:5000/api/admin/admins', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📡 Fetch response:', data);

      if (data.success) {
        setAdmins(data.data);
      } else {
        console.error('API error:', data.message);
      }

    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  // دوال التقارير البسيطة
  const generateReport = async (reportType, reportTitle) => {
    try {
      setReportLoading(true);
      console.log('🚀 جاري إنشاء تقرير:', reportType, reportTitle);
      
      // بيانات التقرير
      const reportData = {
        type: reportType,
        title: reportTitle,
        data: getReportData(reportType),
        generatedAt: new Date().toISOString(),
        generatedBy: currentAdmin?.username || 'superadmin'
      };

      const token = localStorage.getItem('adminToken');
      
      // إرسال طلب إنشاء التقرير
      const response = await axios.post('http://localhost:5000/api/admin/reports', 
        reportData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`✅ تم إنشاء التقرير "${reportTitle}" بنجاح`);
        
        // إذا كان فيه رابط تحميل، نفتحه
        if (response.data.downloadUrl) {
          window.open(response.data.downloadUrl, '_blank');
        }
        
        return true;
      } else {
        throw new Error(response.data.message || 'فشل إنشاء التقرير');
      }

    } catch (error) {
      console.error('❌ Error generating report:', error);
      alert(`❌ فشل إنشاء التقرير: ${error.response?.data?.message || error.message}`);
      return false;
    } finally {
      setReportLoading(false);
    }
  };

  // دالة لتحضير بيانات التقرير
  const getReportData = (reportType) => {
    const baseData = {
      totalUsers: stats.totalUsers || 0,
      newUsers: stats.newUsers || 0,
      artists: stats.artists || 0,
      regularUsers: stats.regularUsers || 0,
      totalAdmins: stats.totalAdmins || 0,
      totalArtworks: stats.totalArtworks || 0,
      totalRevenue: stats.totalRevenue || 0,
      totalSales: stats.totalSales || 0
    };

    switch(reportType) {
      case 'users':
        return {
          ...baseData,
          recentUsers: admins.slice(0, 5).map(admin => ({
            username: admin.username,
            email: admin.email,
            role: admin.role,
            status: admin.isActive ? 'نشط' : 'موقوف'
          }))
        };
      case 'admins':
        return {
          ...baseData,
          admins: admins.map(admin => ({
            username: admin.username,
            email: admin.email,
            role: admin.role,
            status: admin.isActive ? 'نشط' : 'موقوف',
            lastActivity: admin.lastActive
          }))
        };
      case 'financial':
        return {
          ...baseData,
          platformEarnings: Math.round((baseData.totalRevenue || 0) * 0.2),
          averageSale: Math.round((baseData.totalRevenue || 0) / (baseData.totalSales || 1))
        };
      case 'sales':
        return {
          ...baseData,
          averageSale: Math.round((baseData.totalRevenue || 0) / (baseData.totalSales || 1)),
          growthRate: '15%'
        };
      case 'artworks':
        return {
          ...baseData,
          categories: [
            { name: 'رسم', count: 120 },
            { name: 'تصوير', count: 85 },
            { name: 'نحت', count: 45 },
            { name: 'فن رقمي', count: 60 }
          ]
        };
      default:
        return baseData;
    }
  };

  // دالة التقرير السريع
  const handleQuickReport = async (type, title) => {
    await generateReport(type, title);
  };

  // التصدير الجماعي
  const handleBulkExport = async () => {
    if (selectedReports.length === 0) {
      alert('⚠️ الرجاء اختيار تقارير للتصدير');
      return;
    }

    try {
      setReportLoading(true);
      let successCount = 0;
      
      for (const reportId of selectedReports) {
        const report = availableReports.find(r => r.id === reportId);
        if (report) {
          const success = await generateReport(report.type, report.title);
          if (success) successCount++;
        }
      }
      
      setSelectedReports([]);
      alert(`✅ تم إنشاء ${successCount} من ${selectedReports.length} تقرير بنجاح`);
      
    } catch (error) {
      console.error('Error in bulk export:', error);
      alert('❌ فشل إنشاء بعض التقارير');
    } finally {
      setReportLoading(false);
    }
  };

  // دوال مساعدة للتقارير
  const getReportTypeArabic = (type) => {
    const types = {
      'users': 'المستخدمين',
      'sales': 'المبيعات', 
      'admins': 'الأدمن',
      'financial': 'المالية',
      'artworks': 'الأعمال الفنية'
    };
    return types[type] || type;
  };

  const toggleReportSelection = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  // دوال الأدمن (كما كانت)
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/admin/login';
  };

  const createAdmin = async () => {
    try {
      setCreateLoading(true);

      const token = localStorage.getItem('adminToken');
      const response = await axios.post('http://localhost:5000/api/admin/admins', newAdminData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('✅ تم إنشاء الأدمن بنجاح');
        setShowCreateModal(false);
        resetForm();
        fetchAdminsList();
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      alert(error.response?.data?.message || 'فشل إنشاء الأدمن');
    } finally {
      setCreateLoading(false);
    }
  };

  const resetForm = () => {
    setNewAdminData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'financial_admin',
      permissions: {
        canViewFinancial: false,
        canViewReports: false,
        canViewUsers: false,
        canViewArtworks: false,
        canManageAdmins: false,
        canGenerateReports: false
      }
    });
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const toggleAdminStatus = async (adminId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      const response = await axios.put(`http://localhost:5000/api/admin/admins/${adminId}`, {
        isActive: newStatus === 'active'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(`✅ تم ${newStatus === 'active' ? 'تفعيل' : 'تجميد'} الأدمن بنجاح`);
        fetchAdminsList();
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('❌ فشل تحديث حالة الأدمن');
    }
  };

  const deleteAdmin = async (adminId) => {
    if (window.confirm('⚠️ هل أنت متأكد من حذف هذا الأدمن؟')) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.delete(`http://localhost:5000/api/admin/admins/${adminId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          alert('✅ تم حذف الأدمن بنجاح');
          fetchAdminsList();
        }
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert('❌ فشل حذف الأدمن');
      }
    }
  };

  // البيانات الثابتة
  const availableReports = [
    { id: 1, title: 'تقرير المستخدمين', type: 'users' },
    { id: 2, title: 'تقرير المبيعات', type: 'sales' },
    { id: 3, title: 'تقرير الأدمن', type: 'admins' },
    { id: 4, title: 'تقرير مالي', type: 'financial' },
    { id: 5, title: 'تقرير الأعمال الفنية', type: 'artworks' }
  ];

  const menuItems = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'admins', label: 'إدارة الأدمن', icon: Users },
    { id: 'reports', label: 'التقارير', icon: FileText },
    { id: 'financial', label: 'التقارير المالية', icon: DollarSign },
    { id: 'settings', label: 'الإعدادات', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#d5006d] border-t-transparent rounded-full animate-spin"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!currentAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p>غير مصرح بالوصول</p>
          <button 
            onClick={handleLogout}
            className="mt-4 px-6 py-2 bg-[#d5006d] rounded-lg hover:bg-[#b3005c] transition-colors"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800 shadow-sm border-b border-gray-700 z-20">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
              
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث في النظام..."
                  className="w-96 pl-4 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button className="relative p-2 rounded-lg hover:bg-gray-700 transition-colors">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-10 h-10 bg-gradient-to-r from-[#d5006d] to-[#ff4081] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {currentAdmin.fullName?.charAt(0) || currentAdmin.username?.charAt(0) || 'S'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium text-white">{currentAdmin.fullName || 'سوبر أدمن'}</p>
                  <p className="text-sm text-gray-400">Full Access</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-900">
          {/* نظرة عامة */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
              >
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">لوحة التحكم الرئيسية</h1>
                  <p className="text-gray-400">نظرة شاملة على أداء المنصة وإحصائياتها</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    آخر 30 يوم
                  </button>
                  <button 
                    onClick={() => handleQuickReport('users', 'تقرير النظرة العامة')}
                    disabled={reportLoading}
                    className="px-4 py-2 bg-[#d5006d] text-white rounded-xl hover:bg-[#b3005c] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {reportLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {reportLoading ? 'جاري الإنشاء...' : 'تصدير التقرير'}
                  </button>
                </div>
              </motion.div>

              {/* الإحصائيات */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { 
                    title: 'إجمالي المستخدمين', 
                    value: stats.totalUsers || '0', 
                    change: '+12%', 
                    icon: Users,
                    color: 'from-blue-500 to-cyan-500',
                    description: 'مستخدم نشط'
                  },
                  { 
                    title: 'إجمالي الأدمن', 
                    value: stats.totalAdmins || '0', 
                    change: '+2', 
                    icon: Shield,
                    color: 'from-[#d5006d] to-[#ff4081]',
                    description: 'أدمن نشط'
                  },
                  { 
                    title: 'الأعمال الفنية', 
                    value: stats.totalArtworks || '0', 
                    change: '+8%', 
                    icon: Palette,
                    color: 'from-green-500 to-emerald-500',
                    description: 'عمل فني'
                  },
                  { 
                    title: 'الإيرادات', 
                    value: `$${stats.totalRevenue || '0'}`, 
                    change: '+23%', 
                    icon: DollarSign,
                    color: 'from-orange-500 to-amber-500',
                    description: 'آخر 30 يوم'
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800 rounded-2xl border border-gray-700 p-6 hover:border-gray-600 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        stat.change.startsWith('+') 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                    <p className="text-gray-300 font-medium mb-1">{stat.title}</p>
                    <p className="text-gray-400 text-sm">{stat.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* محتوى إضافي */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-[#d5006d]" />
                    آخر الأدمن
                  </h3>
                  <div className="space-y-4">
                    {admins.slice(0, 4).map((admin) => (
                      <div key={admin._id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {admin.username?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{admin.username}</p>
                            <p className="text-gray-400 text-xs">{admin.role}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          admin.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {admin.isActive ? 'نشط' : 'موقوف'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">نشاط النظام</h3>
                  <div className="h-64 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
                    <p className="text-gray-400">رسم بياني للنشاط</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* إدارة الأدمن */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
              >
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">إدارة الأدمن</h1>
                  <p className="text-gray-400">إدارة حسابات الأدمن والصلاحيات</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuickReport('admins', 'تقرير الأدمن')}
                    disabled={reportLoading}
                    className="px-4 py-2 bg-[#d5006d] text-white rounded-xl hover:bg-[#b3005c] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    تقرير الأدمن
                  </button>
                  <button
                    onClick={openCreateModal}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    إنشاء أدمن جديد
                  </button>
                </div>
              </motion.div>

              {/* قائمة الأدمن */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-right p-4 text-gray-400 font-medium">الأدمن</th>
                        <th className="text-right p-4 text-gray-400 font-medium">الدور</th>
                        <th className="text-right p-4 text-gray-400 font-medium">الحالة</th>
                        <th className="text-right p-4 text-gray-400 font-medium">آخر نشاط</th>
                        <th className="text-right p-4 text-gray-400 font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin._id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {admin.username?.charAt(0) || 'A'}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-medium">{admin.fullName || admin.username}</p>
                                <p className="text-gray-400 text-sm">{admin.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 bg-[#d5006d]/20 text-[#d5006d] rounded-full text-sm capitalize">
                              {admin.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              admin.isActive 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {admin.isActive ? 'نشط' : 'موقوف'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-300">
                            {admin.lastActive ? new Date(admin.lastActive).toLocaleDateString('ar-EG') : 'غير متوفر'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => toggleAdminStatus(admin._id, admin.isActive ? 'active' : 'suspended')}
                                className={`p-2 rounded-lg transition-colors ${
                                  admin.isActive 
                                    ? 'text-orange-400 hover:bg-orange-500/20' 
                                    : 'text-green-400 hover:bg-green-500/20'
                                }`}
                                title={admin.isActive ? 'تجميد' : 'تفعيل'}
                              >
                                {admin.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => deleteAdmin(admin._id)}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}

          {/* التقارير */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
              >
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">نظام التقارير</h1>
                  <p className="text-gray-400">إنشاء وتصدير التقارير المختلفة</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                  </button>
                  <button
                    onClick={handleBulkExport}
                    disabled={selectedReports.length === 0 || reportLoading}
                    className="px-6 py-2 bg-gradient-to-r from-[#d5006d] to-[#ff4081] text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {reportLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    تصدير PDF ({selectedReports.length})
                  </button>
                </div>
              </motion.div>

              {/* أزرار إنشاء التقارير السريعة */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableReports.map((report) => (
                  <motion.button
                    key={report.id}
                    onClick={() => handleQuickReport(report.type, report.title)}
                    disabled={reportLoading}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-[#d5006d] transition-all duration-300 disabled:opacity-50 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6 text-[#d5006d]" />
                    <span className="text-white font-medium">{report.title}</span>
                    <span className="text-gray-400 text-xs">إنشاء سريع</span>
                  </motion.button>
                ))}
              </div>

              {/* التقارير المتاحة للاختيار */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableReports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-gray-800 rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 ${
                      selectedReports.includes(report.id)
                        ? 'border-[#d5006d] bg-[#d5006d]/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => toggleReportSelection(report.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => {}}
                        className="w-5 h-5 text-[#d5006d] rounded focus:ring-[#d5006d] focus:ring-2"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{report.title}</h3>
                    <p className="text-gray-400 text-sm">تقرير مفصل عن {getReportTypeArabic(report.type)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* التقارير المالية */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
              >
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">التقارير المالية</h1>
                  <p className="text-gray-400">سيتم تطويره قريباً</p>
                </div>
                <button
                  onClick={() => handleQuickReport('financial', 'تقرير مالي')}
                  disabled={reportLoading}
                  className="px-6 py-2 bg-[#d5006d] text-white rounded-xl hover:bg-[#b3005c] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  إنشاء تقرير مالي
                </button>
              </motion.div>
            </div>
          )}

          {/* الإعدادات */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
              >
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">الإعدادات</h1>
                  <p className="text-gray-400">سيتم تطويره قريباً</p>
                </div>
              </motion.div>
            </div>
          )}
        </main>
      </div>

      {/* Sidebar */}
      <motion.div
        initial={{ x: 300 }}
        animate={{ x: sidebarOpen ? 0 : 300 }}
        className="fixed lg:relative bg-gray-800 shadow-xl z-30 w-80 h-full border-r border-gray-700 right-0"
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-[#d5006d] to-[#ff4081] rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ArtWay</h1>
              <p className="text-sm text-gray-400">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse p-4 rounded-xl mb-2 transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-[#d5006d] to-[#ff4081] text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* زر تسجيل الخروج */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </motion.div>

      {/* Modal إنشاء أدمن جديد */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">إنشاء أدمن جديد</h2>
                <button
                  onClick={closeCreateModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={newAdminData.fullName}
                    onChange={(e) => setNewAdminData({ ...newAdminData, fullName: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    اسم المستخدم
                  </label>
                  <input
                    type="text"
                    value={newAdminData.username}
                    onChange={(e) => setNewAdminData({ ...newAdminData, username: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={newAdminData.email}
                    onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    value={newAdminData.password}
                    onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                    placeholder="أدخل كلمة المرور"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    الدور
                  </label>
                  <select
                    value={newAdminData.role}
                    onChange={(e) => setNewAdminData({ ...newAdminData, role: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                  >
                    <option value="financial_admin">أدمن مالي</option>
                    <option value="reports_admin">أدمن تقارير</option>
                    <option value="users_admin">أدمن مستخدمين</option>
                    <option value="artworks_admin">أدمن أعمال فنية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    الصلاحيات
                  </label>
                  <div className="space-y-2">
                    {Object.entries(newAdminData.permissions).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-3 text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNewAdminData({
                            ...newAdminData,
                            permissions: {
                              ...newAdminData.permissions,
                              [key]: e.target.checked
                            }
                          })}
                          className="w-4 h-4 text-[#d5006d] rounded focus:ring-[#d5006d] focus:ring-2"
                        />
                        <span className="text-sm">
                          {key === 'canViewFinancial' && 'عرض التقارير المالية'}
                          {key === 'canViewReports' && 'عرض التقارير العامة'}
                          {key === 'canViewUsers' && 'عرض المستخدمين'}
                          {key === 'canViewArtworks' && 'عرض الأعمال الفنية'}
                          {key === 'canManageAdmins' && 'إدارة الأدمن'}
                          {key === 'canGenerateReports' && 'إنشاء تقارير'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={closeCreateModal}
                className="flex-1 py-3 px-4 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={createAdmin}
                disabled={createLoading || !newAdminData.username || !newAdminData.email || !newAdminData.password || !newAdminData.fullName}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    إنشاء أدمن
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;