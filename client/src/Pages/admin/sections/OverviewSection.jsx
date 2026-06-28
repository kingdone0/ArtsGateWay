import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Palette, 
  FileText,
  Download,
  Building,
  Eye,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import axios from 'axios';

const OverviewSection = (props) => {
  const {
    stats,
    generatedReports,
    getToken,
    handleLogout,
    saveReportsToStorage,
    setGeneratedReports,
    currentAdmin
  } = props;

  const [reportLoading, setReportLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await axios.get('http://localhost:5000/api/notifications/admin-notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = getToken();
      await axios.patch(`http://localhost:5000/api/notifications/${notificationId}/read`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('خطأ في تحديث الإشعار:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const generateReport = async (reportType, reportTitle) => {
    if (!hasPermissionToGenerateReport(reportType)) {
      alert('❌ غير مصرح لك بإنشاء هذا النوع من التقارير');
      return false;
    }
    if (reportLoading) {
      alert('⚠️ يرجى الانتظار حتى انتهاء التقرير الحالي');
      return false;
    }
    try {
      setReportLoading(true);
      const token = getToken();
      if (!token) {
        alert('❌ لم يتم العثور على رمز الدخول');
        handleLogout();
        return false;
      }
      const response = await axios.post('http://localhost:5000/api/reports', {
        type: reportType,
        title: reportTitle,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        filters: {}
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        const reportId = response.data.data.reportId;
        const newReport = {
          _id: reportId,
          type: reportType,
          title: reportTitle,
          createdAt: new Date(),
          downloadUrl: `http://localhost:5000/api/reports/download/${reportId}`,
          viewUrl: `http://localhost:5000/api/reports/view/${reportId}`
        };
        const updatedReports = [newReport, ...generatedReports];
        setGeneratedReports(updatedReports);
        saveReportsToStorage(updatedReports);
        alert(`✅ تم إنشاء التقرير "${reportTitle}" بنجاح`);
        return true;
      } else {
        throw new Error(response.data.message || 'فشل إنشاء التقرير');
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء التقرير:', error);
      if (error.response?.status === 401) {
        alert('❌ انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى');
        handleLogout();
      } else {
        alert('❌ فشل إنشاء التقرير: ' + (error.response?.data?.message || error.message));
      }
      return false;
    } finally {
      setReportLoading(false);
    }
  };

  const hasPermissionToGenerateReport = (reportType) => {
    const permissionMap = {
      'users': 'canViewUsers',
      'artworks': 'canViewArtworks',
      'reports': 'canViewReports'
    };
    const requiredPermission = permissionMap[reportType];
    return currentAdmin?.permissions?.[requiredPermission] === true;
  };

  const downloadReport = async (reportId, reportTitle) => {
    try {
      const token = getToken();
      if (!token) {
        alert('❌ لم يتم العثور على رمز الدخول');
        handleLogout();
        return;
      }
      const response = await axios.get(`http://localhost:5000/api/reports/download/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      let filename = `${reportTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ خطأ في تحميل التقرير:', error);
      if (error.response?.status === 401) {
        alert('❌ انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى');
        handleLogout();
      } else if (error.response?.status === 404) {
        alert('❌ التقرير غير موجود');
      } else {
        alert('❌ فشل تحميل التقرير: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const viewReport = async (reportId, reportTitle) => {
    try {
      const token = getToken();
      if (!token) {
        alert('❌ لم يتم العثور على رمز الدخول');
        handleLogout();
        return;
      }
      const viewUrl = `http://localhost:5000/api/reports/view/${reportId}?token=${encodeURIComponent(token)}`;
      window.open(viewUrl, '_blank', 'width=1200,height=800');
    } catch (error) {
      console.error('❌ خطأ في فتح التقرير:', error);
      alert('❌ فشل فتح التقرير: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* الهيدر - العنوان في المنتصف */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-right"
      >
        <h1 className="text-3xl font-bold text-white mb-2">لوحة التحكم الرئيسية</h1>
        <p className="text-gray-400">نظرة شاملة على أداء المنصة وإحصائياتها</p>
      </motion.div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            title: 'إجمالي المستخدمين', 
            value: stats.totalUsers || '0', 
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            description: 'مستخدم نشط',
            permission: 'canViewUsers'
          },
          { 
            title: 'الأعمال الفنية', 
            value: stats.totalArtworks || '0', 
            icon: Palette,
            color: 'from-green-500 to-emerald-500',
            description: 'عمل فني',
            permission: 'canViewArtworks'
          },
          { 
            title: 'الفعاليات', 
            value: stats.totalEvents || '0', 
            icon: Calendar,
            color: 'from-yellow-500 to-orange-500',
            description: 'فعالية قادمة',
            permission: 'canViewEvents'
          },
          { 
            title: 'التقارير', 
            value: stats.totalReports || '0', 
            icon: FileText,
            color: 'from-[#d5006d] to-[#ff4081]',
            description: 'تقرير منشأ',
            permission: 'canViewReports'
          }
        ]
        .filter(stat => currentAdmin?.permissions?.[stat.permission] !== false)
        .map((stat, index) => (
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
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-gray-300 font-medium mb-1">{stat.title}</p>
            <p className="text-gray-400 text-sm">{stat.description}</p>
          </motion.div>
        ))}
      </div>

      {/* التقارير */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#d5006d]" />
            آخر التقارير
          </h3>
          <div className="space-y-3">
            {generatedReports.slice(0, 4).map((report) => (
              <div key={report._id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                <div>
                  <p className="text-white font-medium text-sm">{report.title}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(report.createdAt).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => viewReport(report._id, report.title)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs flex items-center gap-1"
                    title="عرض التقرير"
                  >
                    <Eye className="w-3 h-3" />
                    فتح
                  </button>
                  <button
                    onClick={() => downloadReport(report._id, report.title)}
                    className="px-3 py-1 bg-[#d5006d] text-white rounded-lg hover:bg-[#b3005c] transition-colors text-xs flex items-center gap-1"
                    title="تحميل التقرير"
                  >
                    <Download className="w-3 h-3" />
                    تحميل
                  </button>
                </div>
              </div>
            ))}
            {generatedReports.length === 0 && (
              <p className="text-gray-400 text-center py-4">لا توجد تقارير بعد</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewSection;