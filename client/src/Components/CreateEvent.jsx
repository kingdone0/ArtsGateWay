import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { ethers } from "ethers";
import { Calendar, MapPin, DollarSign, Users, FileText, Image, AlertCircle, Upload, CheckCircle, UserCheck } from "react-feather";

const API_BASE = "http://localhost:5000";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { contract } = useWallet();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    price: "",
    capacity: "",
    image: null,
    identityDocument: null,      
    proofDocument: null        
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [identityDocName, setIdentityDocName] = useState("");
  const [proofDocName, setProofDocName] = useState("");
  const [identityPreview, setIdentityPreview] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);


  if (currentUser?.role !== "artist") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-8 rounded-2xl text-center max-w-md">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-2">غير مصرح</h2>
          <p className="text-red-600">يجب أن تكون فناناً لإنشاء فعاليات</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, image: 'نوع الملف غير مدعوم' }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'الحد الأقصى 5MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleIdentityDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, identityDocument: 'نوع الملف غير مدعوم (PDF, JPG, PNG)' }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, identityDocument: 'الحد الأقصى 5MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, identityDocument: file }));
      setIdentityDocName(file.name);
      
      if (file.type.startsWith('image/')) {
        setIdentityPreview(URL.createObjectURL(file));
      } else {
        setIdentityPreview(null);
      }
    }
  };

  const handleProofDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, proofDocument: 'نوع الملف غير مدعوم (PDF, JPG, PNG)' }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, proofDocument: 'الحد الأقصى 5MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, proofDocument: file }));
      setProofDocName(file.name);
      
      if (file.type.startsWith('image/')) {
        setProofPreview(URL.createObjectURL(file));
      } else {
        setProofPreview(null);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = "العنوان مطلوب";
    if (!formData.description.trim()) newErrors.description = "الوصف مطلوب";
    if (!formData.location.trim()) newErrors.location = "المكان مطلوب";
    if (!formData.date) newErrors.date = "التاريخ مطلوب";
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "السعر يجب أن يكون أكبر من 0";
    }
    
    if (!formData.capacity || parseInt(formData.capacity) < 1) {
      newErrors.capacity = "عدد المقاعد يجب أن يكون 1 على الأقل";
    }
    
 
    if (!formData.identityDocument) {
      newErrors.identityDocument = "صورة الهوية مطلوبة للتحقق من هويتك";
    }
  
    if (!formData.proofDocument) {
      newErrors.proofDocument = "إثبات الحجز أو إثبات الفعالية مطلوب للموافقة";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  setLoading(true);
  
  try {
    const token = localStorage.getItem("artAppToken");
    
    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("location", formData.location);
    formDataToSend.append("date", new Date(formData.date).toISOString());
    formDataToSend.append("price", formData.price);
    formDataToSend.append("capacity", formData.capacity);
    
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }
    
    if (formData.identityDocument) {
      formDataToSend.append("identityDocument", formData.identityDocument);
    }
    if (formData.proofDocument) {
      formDataToSend.append("proofDocument", formData.proofDocument);
    }
    
    console.log("📤 إرسال إلى الباكند:", {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      date: formData.date,
      price: formData.price,
      capacity: formData.capacity,
    });
    
    const response = await axios.post(
      `${API_BASE}/api/events`,
      formDataToSend,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log("✅ تم الإنشاء:", response.data);
    alert("✅ تم إنشاء الفعالية بنجاح!");
    navigate("/events");
    
  } catch (error) {
    console.error("❌ خطأ في الإنشاء:", error);
    console.error("❌ تفاصيل الخطأ من الباك إند:", error.response?.data);
    alert(`❌ ${error.response?.data?.message || error.message}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">إنشاء فعالية جديدة</h1>
            <p className="text-purple-100">شارك فعاليتك الفنية مع العالم</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* العنوان */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FileText size={20} className="text-purple-600" />
                عنوان الفعالية *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="مثلاً: معرض فني تشكيلي"
                className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 transition ${
                  errors.title ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>
            
            {/* الوصف */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FileText size={20} className="text-purple-600" />
                الوصف *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="صف تفاصيل الفعالية..."
                className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 transition ${
                  errors.description ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            
            {/* المكان */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <MapPin size={20} className="text-purple-600" />
                المكان *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="عنوان الفعالية"
                className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 transition ${
                  errors.location ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>
            
            {/* التاريخ */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <Calendar size={20} className="text-purple-600" />
                التاريخ والوقت *
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 transition ${
                  errors.date ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>
            
            {/* السعر والسعة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <DollarSign size={20} className="text-purple-600" />
                  السعر ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 transition ${
                    errors.price ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <Users size={20} className="text-purple-600" />
                  عدد المقاعد *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  placeholder="50"
                  className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-200 transition ${
                    errors.capacity ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
              </div>
            </div>
            
            {/* رفع الصورة */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <Image size={20} className="text-purple-600" />
                صورة الفعالية (اختياري)
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-500 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  {previewImage ? (
                    <div className="relative">
                      <img src={previewImage} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                      <p className="text-sm text-gray-500 mt-2">اضغط لتغيير الصورة</p>
                    </div>
                  ) : (
                    <>
                      <Image size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">اختر صورة للفعالية</p>
                      <p className="text-sm text-gray-400 mt-1">JPG, PNG, WebP (حد أقصى 5MB)</p>
                    </>
                  )}
                </label>
              </div>
              {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
            </div>
            
            {/* ✅ الوثيقة الأولى: صورة الهوية */}
            <div className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50">
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <UserCheck size={20} className="text-purple-600" />
                صورة الهوية <span className="text-red-500">*</span>
              </label>
              
              <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-500 transition cursor-pointer bg-white">
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  onChange={handleIdentityDocumentChange}
                  className="hidden"
                  id="identity-doc-upload"
                />
                <label htmlFor="identity-doc-upload" className="cursor-pointer block">
                  {identityDocName ? (
                    <div className="text-center">
                      {identityPreview ? (
                        <img src={identityPreview} alt="Identity preview" className="max-h-32 mx-auto rounded-lg mb-2" />
                      ) : (
                        <FileText size={48} className="mx-auto text-purple-500 mb-2" />
                      )}
                      <p className="text-purple-600 font-medium">{identityDocName}</p>
                      <p className="text-sm text-gray-500 mt-1">اضغط لتغيير الملف</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">اختر صورة الهوية</p>
                      <p className="text-sm text-gray-400 mt-1">PDF, JPG, PNG (حد أقصى 5MB)</p>
                    </>
                  )}
                </label>
              </div>
              
              <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                <AlertCircle size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
                <p>صورة الهوية (بطاقة شخصية، جواز سفر، رخصة قيادة) لإثبات هويتك</p>
              </div>
              {errors.identityDocument && <p className="text-red-500 text-sm mt-2">{errors.identityDocument}</p>}
            </div>
            
            {/* ✅ الوثيقة الثانية: إثبات الحجز/الفعالية */}
            <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50">
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FileText size={20} className="text-blue-600" />
                إثبات الحجز / إثبات الفعالية <span className="text-red-500">*</span>
              </label>
              
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center hover:border-blue-500 transition cursor-pointer bg-white">
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  onChange={handleProofDocumentChange}
                  className="hidden"
                  id="proof-doc-upload"
                />
                <label htmlFor="proof-doc-upload" className="cursor-pointer block">
                  {proofDocName ? (
                    <div className="text-center">
                      {proofPreview ? (
                        <img src={proofPreview} alt="Proof preview" className="max-h-32 mx-auto rounded-lg mb-2" />
                      ) : (
                        <FileText size={48} className="mx-auto text-blue-500 mb-2" />
                      )}
                      <p className="text-blue-600 font-medium">{proofDocName}</p>
                      <p className="text-sm text-gray-500 mt-1">اضغط لتغيير الملف</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">اختر إثبات الحجز</p>
                      <p className="text-sm text-gray-400 mt-1">PDF, JPG, PNG (حد أقصى 5MB)</p>
                    </>
                  )}
                </label>
              </div>
              
              <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p>إثبات حجز المكان، تذكرة، عقد، أو أي مستند يثبت أحقيتك بإقامة الفعالية</p>
              </div>
              {errors.proofDocument && <p className="text-red-500 text-sm mt-2">{errors.proofDocument}</p>}
            </div>
            
            {/* أزرار التحكم */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإنشاء...
                  </span>
                ) : "إنشاء الفعالية وإرسال الوثائق"}
              </button>
              
              <button
                type="button"
                onClick={() => navigate("/events")}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;