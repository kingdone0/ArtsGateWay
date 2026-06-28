import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Shield, Palette, Moon, Sun, Trash2, RotateCcw } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const SettingsSection = () => {
  const { theme: globalTheme, setTheme } = useTheme();
  
  const [tempTheme, setTempTheme] = useState(globalTheme);
  const [saving, setSaving] = useState(false);

  const changeTheme = (newTheme) => {
    setTempTheme(newTheme);
  };

  const handleSave = () => {
    setSaving(true);
    setTheme(tempTheme);
    setTimeout(() => {
      setSaving(false);
      alert('✅ تم حفظ الإعدادات بنجاح');
    }, 500);
  };

  // إعادة ضبط الإعدادات للافتراضي
  const resetToDefault = () => {
    if (window.confirm('⚠️ هل أنت متأكد؟ سيتم إعادة ضبط جميع الإعدادات للوضع الافتراضي')) {
      setTempTheme('dark');
      setTheme('dark');
      alert('✅ تم إعادة ضبط الإعدادات');
    }
  };

  // مسح الذاكرة المؤقتة
  const clearCache = () => {
    if (window.confirm('⚠️ هل أنت متأكد؟ سيتم مسح جميع البيانات المخزنة مؤقتاً')) {
      localStorage.clear();
      alert('✅ تم مسح الذاكرة المؤقتة، سيتم إعادة تحميل الصفحة');
      setTimeout(() => window.location.reload(), 1000);
    }
  };


  const cardBg = globalTheme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const cardBorder = globalTheme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const textColor = globalTheme === 'dark' ? 'text-white' : 'text-gray-900';
  const textMuted = globalTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const inputBg = globalTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';

  return (
    <div className={`min-h-screen p-6`}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div className="text-right">
            <h1 className={`text-3xl font-bold ${textColor} mb-2`}>الإعدادات</h1>
            <p className={textMuted}>إدارة إعدادات التطبيق</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetToDefault}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة ضبط
            </button>
            <button
              onClick={clearCache}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              مسح الذاكرة
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* المظهر */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${cardBg} rounded-2xl border ${cardBorder} p-6`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <h3 className={`text-xl font-semibold ${textColor}`}>المظهر</h3>
            </div>

            <div className="space-y-4">
              <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 ${inputBg} rounded-xl`}>
                <div>
                  <label className={`block font-medium ${textColor} mb-1`}>السمة (الثيم)</label>
                  <p className={`text-sm ${textMuted}`}>اختر الوضع المناسب لك</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => changeTheme('dark')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                      tempTheme === 'dark'
                        ? 'bg-pink-600 text-white'
                        : `${inputBg} ${textColor} hover:bg-gray-600`
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    داكن
                  </button>
                  <button
                    onClick={() => changeTheme('light')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                      tempTheme === 'light'
                        ? 'bg-pink-600 text-white'
                        : `${inputBg} ${textColor} hover:bg-gray-600`
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    فاتح
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* معلومات النظام */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${cardBg} rounded-2xl border ${cardBorder} p-6`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className={`text-lg font-semibold ${textColor}`}>معلومات النظام</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className={`flex justify-between p-3 ${inputBg} rounded-lg`}>
                <span className={textMuted}>إصدار النظام:</span>
                <span className={textColor}>v1.0.0</span>
              </div>
              <div className={`flex justify-between p-3 ${inputBg} rounded-lg`}>
                <span className={textMuted}>الوضع الحالي:</span>
                <span className={textColor}>{globalTheme === 'dark' ? 'داكن' : 'فاتح'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;