import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText,
  Download,
  Eye,
  Calendar,
  Users,
  Shield,
  Palette,
  Flag,
  Trash2,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const ReportsSection = (props) => {
  const {
    generatedReports,
    setGeneratedReports,
    getToken,
    handleLogout,
    saveReportsToStorage
  } = props;

  const [selectedReports, setSelectedReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [creatingReports, setCreatingReports] = useState({});
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localReports, setLocalReports] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // تحميل التقارير من localStorage عند بدء التشغيل
  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = () => {
    try {
      const savedReports = localStorage.getItem('adminGeneratedReports');
      console.log('📦 التقارير المحفوظة:', savedReports);
      
      if (savedReports) {
        const parsed = JSON.parse(savedReports);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = [...parsed].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setLocalReports(sorted);
          setGeneratedReports(sorted);
          console.log('✅ تم تحميل', sorted.length, 'تقرير');
          return;
        }
      }
      fetchReportsFromServer();
    } catch (error) {
      console.error('❌ خطأ في تحميل التقارير:', error);
    }
  };

  // حفظ التقارير مباشرة في localStorage
  const saveToLocalStorage = (reports) => {
    try {
      localStorage.setItem('adminGeneratedReports', JSON.stringify(reports));
      if (saveReportsToStorage) {
        saveReportsToStorage(reports);
      }
      console.log('💾 تم حفظ', reports.length, 'تقرير في localStorage');
    } catch (err) {
      console.error('❌ خطأ في حفظ التقارير:', err);
    }
  };

  // جلب التقارير من الخادم
  const fetchReportsFromServer = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await axios.get('http://localhost:5000/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.data) {
        const serverReports = response.data.data.map(report => ({
          _id: report._id,
          type: report.type,
          title: report.title,
          createdAt: report.createdAt,
          downloadUrl: `/api/reports/download/${report._id}`,
          viewUrl: `/api/reports/view/${report._id}`
        }));
        
        if (serverReports.length > 0) {
          const unique = [...serverReports];
          const sorted = unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setLocalReports(sorted);
          setGeneratedReports(sorted);
          saveToLocalStorage(sorted);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب التقارير من الخادم:', error);
    }
  };

  // إضافة تقرير جديد
  const addNewReport = (newReport) => {
    const existingReports = [...localReports];
    const reportExists = existingReports.some(r => r._id === newReport._id);
    
    if (!reportExists) {
      const updatedReports = [newReport, ...existingReports];
      const sorted = updatedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const limited = sorted.slice(0, 10);
      
      setLocalReports(limited);
      setGeneratedReports(limited);
      saveToLocalStorage(limited);
      console.log('➕ تم إضافة تقرير جديد:', newReport.title);
      return true;
    }
    return false;
  };

  // تحديث التقارير من الخادم
  const refreshReportsFromServer = async () => {
    setIsRefreshing(true);
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await axios.get('http://localhost:5000/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.data) {
        const serverReports = response.data.data.map(report => ({
          _id: report._id,
          type: report.type,
          title: report.title,
          createdAt: report.createdAt,
          downloadUrl: `/api/reports/download/${report._id}`,
          viewUrl: `/api/reports/view/${report._id}`
        }));
        
        const allReports = [...serverReports, ...localReports];
        const unique = [];
        const ids = new Set();
        for (const report of allReports) {
          if (!ids.has(report._id)) {
            ids.add(report._id);
            unique.push(report);
          }
        }
        const sorted = unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const limited = sorted.slice(0, 10);
        
        setLocalReports(limited);
        setGeneratedReports(limited);
        saveToLocalStorage(limited);
      }
    } catch (error) {
      console.error('خطأ في تحديث التقارير:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const availableReports = [
    { id: 1, title: 'تقرير المستخدمين', type: 'users', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { id: 2, title: 'تقرير الأدمن', type: 'admins', icon: Shield, color: 'from-purple-500 to-indigo-500' },
    { id: 3, title: 'تقرير الأعمال الفنية', type: 'artworks', icon: Palette, color: 'from-green-500 to-emerald-500' },
    { id: 4, title: 'تقرير الفعاليات', type: 'events', icon: Calendar, color: 'from-yellow-500 to-orange-500' },
    { id: 5, title: 'تقرير الإبلاغات', type: 'reports', icon: Flag, color: 'from-red-500 to-pink-500' }
  ];

  const generateReport = async (reportType, reportTitle, reportId) => {
    if (reportLoading || creatingReports[reportId]) {
      return false;
    }

    setCreatingReports(prev => ({ ...prev, [reportId]: true }));

    try {
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
        const reportId_from_api = response.data.data.reportId;
        
        const newReport = {
          _id: reportId_from_api,
          type: reportType,
          title: reportTitle,
          createdAt: new Date().toISOString(),
          downloadUrl: `http://localhost:5000/api/reports/download/${reportId_from_api}`,
          viewUrl: `http://localhost:5000/api/reports/view/${reportId_from_api}`
        };
        
        const savedReports = localStorage.getItem('adminGeneratedReports');
        let existingReports = savedReports ? JSON.parse(savedReports) : [];
        
        const exists = existingReports.some(r => r._id === newReport._id);
        if (!exists) {
          const updatedReports = [newReport, ...existingReports];
          const sorted = updatedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const limited = sorted.slice(0, 10);
          
          localStorage.setItem('adminGeneratedReports', JSON.stringify(limited));
          setLocalReports(limited);
          setGeneratedReports(limited);
          if (saveReportsToStorage) saveReportsToStorage(limited);
          
          console.log('➕ تم إضافة تقرير:', reportTitle, 'المجموع:', limited.length);
        }
        
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
        const errorMsg = error.response?.data?.message || error.message;
        setError(`فشل إنشاء تقرير ${reportTitle}: ${errorMsg}`);
        setTimeout(() => setError(null), 5000);
      }
      return false;
    } finally {
      setCreatingReports(prev => ({ ...prev, [reportId]: false }));
    }
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
      
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
     
      
      if (error.response?.status === 401) {
        alert('❌ انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى');
        handleLogout();
      } else if (error.response?.status === 404) {
        alert('❌ التقرير غير موجود');
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

  const deleteReport = (reportId) => {
    if (isDeleting) return;
    setIsDeleting(true);
    
    // التحقق من وجود التقرير قبل الحذف
    const reportExists = localReports.some(r => r._id === reportId);
    if (!reportExists) {
      setIsDeleting(false);
      return;
    }
    
    const updatedReports = localReports.filter(r => r._id !== reportId);
    setLocalReports(updatedReports);
    setGeneratedReports(updatedReports);
    saveToLocalStorage(updatedReports);
    console.log('🗑️ تم حذف التقرير:', reportId, 'المتبقي:', updatedReports.length);
    
    setTimeout(() => setIsDeleting(false), 500);
  };

  const handleBulkExport = async () => {
    if (selectedReports.length === 0) {
      alert('⚠️ الرجاء اختيار تقارير للتصدير');
      return;
    }

    setReportLoading(true);
    let successCount = 0;
    const failedReports = [];
    
    for (const reportId of selectedReports) {
      const report = availableReports.find(r => r.id === reportId);
      if (report) {
        const success = await generateReport(report.type, report.title, reportId);
        if (success) {
          successCount++;
        } else {
          failedReports.push(report.title);
        }
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
    
    setSelectedReports([]);
    setReportLoading(false);
    
    if (successCount === selectedReports.length) {
      alert(`✅ تم إنشاء ${successCount} تقرير بنجاح`);
    } else if (successCount > 0) {
      alert(`✅ تم إنشاء ${successCount} من ${selectedReports.length} تقرير بنجاح\n❌ فشل: ${failedReports.join(', ')}`);
    } else {
      alert('❌ فشل إنشاء جميع التقارير. تأكد من اتصال الخادم');
    }
  };

  const getReportTypeArabic = (type) => {
    const types = {
      'users': 'المستخدمين',
      'admins': 'الأدمن',
      'artworks': 'الأعمال الفنية',
      'events': 'الفعاليات',
      'reports': 'الإبلاغات'
    };
    return types[type] || type;
  };

  const getReportIcon = (type) => {
    const iconMap = {
      'users': Users,
      'admins': Shield,
      'artworks': Palette,
      'events': Calendar,
      'reports': Flag
    };
    const Icon = iconMap[type] || FileText;
    return <Icon className="w-5 h-5 text-white" />;
  };

  const getReportColor = (type) => {
    const colorMap = {
      'users': 'from-blue-500 to-cyan-500',
      'admins': 'from-purple-500 to-indigo-500',
      'artworks': 'from-green-500 to-emerald-500',
      'events': 'from-yellow-500 to-orange-500',
      'reports': 'from-red-500 to-pink-500'
    };
    return colorMap[type] || 'from-gray-500 to-gray-600';
  };

  const toggleReportSelection = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  return (
    <div className="space-y-6">
      {/* الهيدر - العنوان على اليمين، التحديث على اليسار */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="text-right">
          <h1 className="text-3xl font-bold text-white mb-2">نظام التقارير</h1>
          <p className="text-gray-400">إنشاء وتحميل التقارير المختلفة</p>
        </div>
        <button
          onClick={refreshReportsFromServer}
          disabled={isRefreshing}
          className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </motion.div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl text-right">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableReports.map((report) => {
          const IconComponent = report.icon;
          return (
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
                <div className={`w-12 h-12 bg-gradient-to-r ${report.color} rounded-xl flex items-center justify-center`}>
                  <IconComponent className="w-6 h-6 text-white" />
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
          );
        })}
      </div>

      {selectedReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <button
            onClick={handleBulkExport}
            disabled={reportLoading}
            className="px-8 py-3 bg-gradient-to-r from-[#d5006d] to-[#ff4081] text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xl"
          >
            {reportLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FileText className="w-5 h-5" />
            )}
            إنشاء التقارير المحددة ({selectedReports.length})
          </button>
        </motion.div>
      )}

      {localReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl border border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">آخر التقارير ({localReports.length}/10)</h3>
            <p className="text-gray-400 text-sm">يتم الاحتفاظ بآخر 10 تقارير فقط</p>
          </div>
          <div className="space-y-3">
            {localReports.map((report, idx) => {
              const reportColor = getReportColor(report.type);
              return (
                <div key={report._id || idx} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${reportColor} rounded-lg flex items-center justify-center`}>
                      {getReportIcon(report.type)}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{report.title}</h4>
                      <p className="text-gray-400 text-sm">
                        {new Date(report.createdAt).toLocaleDateString('ar-EG')} - {getReportTypeArabic(report.type)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewReport(report._id, report.title);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                      title="عرض التقرير"
                    >
                      <Eye className="w-3 h-3" />
                      فتح
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadReport(report._id, report.title);
                      }}
                      className="px-3 py-1.5 bg-[#d5006d] text-white rounded-lg hover:bg-[#b3005c] transition-colors flex items-center gap-1 text-sm"
                      title="تحميل التقرير"
                    >
                      <Download className="w-3 h-3" />
                      تحميل
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReport(report._id);
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-sm"
                      title="حذف التقرير"
                    >
                      <Trash2 className="w-3 h-3" />
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ReportsSection;