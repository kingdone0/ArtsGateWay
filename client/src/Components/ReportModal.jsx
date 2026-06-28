import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdWarning, MdReport, MdCheckCircle, MdError } from 'react-icons/md';
import axios from 'axios';

const ReportModal = ({ isOpen, onClose, targetType, targetId }) => {
  const [reportReason, setReportReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const reportTypes = [
    { id: 'spam', label: 'محتوى غير مرغوب / سبام' },
    { id: 'inappropriate', label: 'محتوى غير لائق' },
    { id: 'harassment', label: 'مضايقة أو تنمر' },
    { id: 'impersonation', label: 'انتحال شخصية' },
    { id: 'other', label: 'سبب آخر' }
  ];

  const getTargetLabel = () => {
    switch(targetType) {
      case 'user': return 'مستخدم';
      case 'artwork': return 'عمل فني';
      case 'comment': return 'تعليق';
      case 'event': return 'فعالية';
      default: return 'محتوى';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!reportReason) {
      setErrorMessage('الرجاء اختيار سبب الإبلاغ');
      return;
    }

    setLoading(true);

    try {

      const token = localStorage.getItem('artAppToken');
      
      console.log('🔑 Token found:', token ? 'Yes' : 'No');
      console.log('🔑 Token value:', token ? token.substring(0, 50) + '...' : 'null');
      
      if (!token) {
        setErrorMessage('الرجاء تسجيل الدخول أولاً');
        setLoading(false);
        return;
      }
      
      const reportData = {
        targetType,
        targetId,
        reason: reportReason,
        details: details || undefined
      };

      console.log('📤 Sending report to:', 'http://localhost:5000/api/report');
      console.log('📤 Report data:', reportData);

      const response = await axios.post('http://localhost:5000/api/report', reportData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Response:', response.data);

      if (response.data.success) {
        setSuccessMessage('✅ تم الإبلاغ بنجاح! سيتم مراجعة البلاغ من قبل الإدارة.');
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      } else {
        throw new Error(response.data.message || 'فشل في الإبلاغ');
      }

    } catch (error) {
      console.error('❌ Error submitting report:', error);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Response status:', error.response?.status);
      
      if (error.response?.status === 401) {
        setErrorMessage('انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مرة أخرى');
   
      } else if (error.response?.status === 409) {
        setErrorMessage('⚠️ لقد قمت بالإبلاغ عن هذا المحتوى مسبقاً');
      } else if (error.response?.status === 400) {
        setErrorMessage(error.response.data?.message || 'البيانات المرسلة غير صحيحة');
      } else {
        setErrorMessage(error.response?.data?.message || 'حدث خطأ أثناء الإبلاغ. الرجاء المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReportReason('');
    setDetails('');
    setSubmitted(false);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200"
          >
            <div className="flex items-center justify-between p-4 border-b bg-red-50">
              <div className="flex items-center gap-2">
                <MdReport className="text-red-600" size={20} />
                <h3 className="text-sm font-bold text-gray-800">
                  الإبلاغ عن {getTargetLabel()}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                disabled={loading}
              >
                <MdClose size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {submitted ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
                    <MdCheckCircle className="text-green-600" size={28} />
                  </div>
                  <h4 className="text-lg font-bold text-green-700 mb-2">تم الإبلاغ بنجاح!</h4>
                  <p className="text-sm text-gray-600 mb-2">{successMessage}</p>
                  <p className="text-xs text-gray-400 mt-3">سيتم إغلاق النافذة تلقائياً...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {errorMessage && (
                    <div className="flex items-start gap-2 p-3 mb-3 bg-red-50 rounded-lg border border-red-200">
                      <MdError className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-3 mb-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <MdWarning className="text-yellow-600 mt-0.5 flex-shrink-0" size={16} />
                    <p className="text-xs text-yellow-800">
                      ⚠️ الإبلاغ الكاذب قد يؤدي إلى تعليق حسابك
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      سبب الإبلاغ <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {reportTypes.map((type) => (
                        <label
                          key={type.id}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                            reportReason === type.id
                              ? 'border-red-500 bg-red-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reportReason"
                            value={type.id}
                            checked={reportReason === type.id}
                            onChange={(e) => {
                              setReportReason(e.target.value);
                              setErrorMessage('');
                            }}
                            className="ml-3 text-red-600 focus:ring-red-500 w-4 h-4"
                            disabled={loading}
                          />
                          <span className="text-gray-700 text-sm">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تفاصيل إضافية <span className="text-gray-400 text-xs">(اختياري)</span>
                    </label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="اكتب تفاصيل إضافية تساعد في فهم المشكلة..."
                      className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      rows="3"
                      disabled={loading}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400">
                        {details.length}/500 حرف
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      disabled={loading}
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !reportReason}
                      className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        loading || !reportReason
                          ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                          : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-md'
                      }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          جاري الإرسال...
                        </>
                      ) : (
                        'إرسال الإبلاغ'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;