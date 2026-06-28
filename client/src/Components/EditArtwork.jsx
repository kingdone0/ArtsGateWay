import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { Upload, Image as ImageIcon, Tag, DollarSign, AlertCircle, X } from 'react-feather';

const API_BASE = "http://localhost:5000";

const EditArtwork = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { contract, address, isMetaMaskConnected, fetchBalances } = useWallet();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: 0,
    isForSale: false,
    image: null,
    imagePreview: null
  });
  const [currentImage, setCurrentImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [errors, setErrors] = useState({});
  const [authorized, setAuthorized] = useState(false);
  const [artwork, setArtwork] = useState(null);

  useEffect(() => {
    fetchArtworkData();
  }, [id]);

  const fetchArtworkData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('artAppToken');
      
      const response = await axios.get(`${API_BASE}/api/artworks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const artworkData = response.data.data || response.data;
      setArtwork(artworkData);
      
      const isOwner = currentUser?.id === artworkData.owner?._id || 
                currentUser?.artistProfile?._id === artworkData.owner?._id;
      
      console.log('🔍 Check ownership:', {
        currentUserArtistId: currentUser?.artistProfile?._id,
        artworkOwnerId: artworkData.owner?._id,
        isOwner: isOwner
      });
      
      if (!isOwner) {
        alert('❌ لا يمكنك تعديل هذا العمل. فقط المالك الحالي يمكنه التعديل.');
        navigate(`/artwork/${id}`);
        return;
      }
      
      setAuthorized(true);
      
      setFormData({
        title: artworkData.title || '',
        description: artworkData.description || '',
        category: artworkData.category || '',
        price: artworkData.price || 0,
        isForSale: artworkData.isForSale || false,
        image: null,
        imagePreview: null
      });
      
      setCurrentImage(`${API_BASE}${artworkData.imageUrl}`);
    } catch (error) {
      console.error('Error fetching artwork:', error);
      alert('حدث خطأ في تحميل بيانات العمل');
      navigate(`/artwork/${id}`);
    } finally {
      setLoading(false);
    }
  };

const mintArtworkOnChain = async (artworkData, priceInWei) => {
  if (!contract) throw new Error('العقد الذكي غير متصل');
  
  const metadata = {
    name: artworkData.title,
    description: artworkData.description,
    image: `http://localhost:5000${artworkData.imageUrl}`,
    attributes: [
      {
        trait_type: "Category",
        value: artworkData.category
      }
    ]
  };
  
  const tx = await contract.mintArtwork(
    artworkData.title,
    artworkData.description,
    artworkData.imageUrl,
    JSON.stringify(metadata),
    priceInWei
  );
  
  const receipt = await tx.wait();
  
  let tokenId = null;
  const transferEvent = receipt.logs.find(log => {
    try {
      const parsedLog = contract.interface.parseLog(log);
      return parsedLog?.name === 'Transfer';
    } catch {
      return false;
    }
  });
  
  if (transferEvent) {
    const parsedLog = contract.interface.parseLog(transferEvent);
    tokenId = Number(parsedLog?.args?.tokenId || parsedLog?.args[2]);
  }
  
  return { receipt, tokenId };
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, image: 'نوع الملف غير مدعوم. استخدم JPG, PNG, أو WebP' }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'حجم الملف كبير جداً. الحد الأقصى 5MB' }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
      
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'العنوان مطلوب';
    if (formData.title.length < 3) newErrors.title = 'العنوان قصير جداً';
    if (formData.title.length > 100) newErrors.title = 'العنوان طويل جداً';
    
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'الوصف طويل جداً (الحد الأقصى 2000 حرف)';
    }
    
    if (!formData.category.trim()) newErrors.category = 'التصنيف مطلوب';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  try {
    setUploading(true);
    const token = localStorage.getItem('artAppToken');
 
    const jsonData = {
      title: formData.title,
      description: formData.description || '',
      category: formData.category,
      price: formData.price,
      isForSale: formData.isForSale
    };
    
    console.log('📤 البيانات المرسلة:', jsonData);
    
    const response = await axios.put(
      `${API_BASE}/api/artworks/${id}`,
      jsonData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const updatedArtwork = response.data.artwork || response.data;
    
    if (!artwork?.tokenId && contract && address && formData.isForSale && formData.price > 0) {
      const shouldMint = window.confirm('🖼️ هل تريد نشر هذا العمل كـ NFT على البلوكشين؟');
      if (shouldMint) {
        setMinting(true);
        try {
          const priceInWei = ethers.parseEther(formData.price.toString());
          const { tokenId } = await mintArtworkOnChain(updatedArtwork, priceInWei);
          
          await axios.put(
            `${API_BASE}/api/artworks/${id}/tokenId`,
            { tokenId: Number(tokenId) },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          alert('✅ تم نشر العمل كـ NFT بنجاح!');
        } catch (mintError) {
          console.error('❌ فشل في Mint:', mintError);
          alert('⚠️ تم تحديث العمل ولكن فشل في نشره كـ NFT');
        } finally {
          setMinting(false);
        }
      }
    }
    
    if (fetchBalances) await fetchBalances(address);
    alert('✅ تم تحديث العمل بنجاح!');
    navigate(`/artwork/${id}`);
    
  } catch (error) {
    console.error('Error updating artwork:', error);
    console.error('Response data:', error.response?.data);
    const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء تحديث العمل';
    alert(`❌ ${errorMsg}`);
  } finally {
    setUploading(false);
  }
};

  const handleResetImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      imagePreview: null
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5006d] mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات العمل...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">تعديل العمل الفني</h1>
            <p className="text-gray-600 text-center">يمكنك تعديل أي تفاصيل تريد تغييرها</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
    
            <div className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-xl font-bold text-gray-800 mb-4">الصورة</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الصورة الحالية
                  </label>
                  <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                    <img
                      src={currentImage}
                      alt="الصورة الحالية"
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.src = '/default-artwork.jpg'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                      <span className="text-white text-sm font-medium">الصورة الأصلية</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.image ? 'الصورة الجديدة' : 'رفع صورة جديدة (اختياري)'}
                  </label>
                  
                  {formData.imagePreview ? (
                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-500">
                      <img
                        src={formData.imagePreview}
                        alt="معاينة الصورة الجديدة"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-4">
                        <span className="text-white text-sm font-medium mb-2">الصورة الجديدة</span>
                        <button
                          type="button"
                          onClick={handleResetImage}
                          className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition"
                        >
                          إلغاء التغيير
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-[#d5006d] hover:bg-gray-50 transition cursor-pointer p-4"
                      >
                        <div className="text-gray-400 mb-3">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium mb-1">اضغط لرفع صورة جديدة</p>
                        <p className="text-gray-500 text-sm text-center">JPG, PNG, WebP (حد أقصى 5MB)</p>
                      </label>
                    </div>
                  )}
                  
                  {errors.image && (
                    <p className="mt-2 text-sm text-red-600">{errors.image}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                💡 <strong>ملاحظة:</strong> يمكنك رفع صورة جديدة أو الاحتفاظ بالصورة الحالية
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  عنوان العمل *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#d5006d] focus:border-transparent`}
                  placeholder="أدخل عنوان العمل"
                  maxLength={100}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
                <div className="mt-1 text-xs text-gray-500 text-left">
                  {formData.title.length}/100 حرف
                </div>
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  التصنيف *
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#d5006d] focus:border-transparent`}
                  placeholder="أدخل تصنيف العمل (مثال: رسم زيتي، تصوير فوتوغرافي...)"
                  maxLength={50}
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  وصف العمل
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#d5006d] focus:border-transparent`}
                  placeholder="أدخل وصفاً للعمل (اختياري)"
                  maxLength={2000}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                <div className="mt-1 text-xs text-gray-500 text-left">
                  {formData.description.length}/2000 حرف
                </div>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  السعر (ETH)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isForSale"
                  name="isForSale"
                  checked={formData.isForSale}
                  onChange={handleCheckboxChange}
                  className="w-5 h-5 text-[#d5006d] border-gray-300 rounded focus:ring-[#d5006d]"
                />
                <label htmlFor="isForSale" className="text-sm font-medium text-gray-700">
                  عرض العمل للبيع
                </label>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={uploading || minting}
                className={`flex-1 py-3 px-6 rounded-xl font-medium transition ${(uploading || minting) ? 'bg-[#d5006d]/70' : 'bg-[#d5006d] hover:bg-[#b0005a]'} text-white`}
              >
                {uploading || minting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {minting ? 'جاري النشر على البلوكشين...' : 'جاري الحفظ...'}
                  </span>
                ) : 'حفظ التعديلات'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate(`/artwork/${id}`)}
                className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                العودة للعمل
              </button>
            </div>
            
            <div className="text-sm text-gray-500 text-center pt-4">
              * الحقول المطلوبة
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EditArtwork;