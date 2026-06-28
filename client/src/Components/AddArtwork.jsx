import React, { useState } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { useAuth } from "../context/AuthContext"; 
import { useWallet } from '../context/WalletContext';
import { useNavigate } from "react-router-dom"; 
import { Upload, Image, Tag, DollarSign, AlertCircle } from 'react-feather';

const API_BASE = "http://localhost:5000";

const AddArtwork = () => {
  const { currentUser } = useAuth(); 
  const { contract, wallet } = useWallet();
  const navigate = useNavigate(); 
  const [isSaved, setIsSaved] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: 0,
    image: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
console.log('📞 عنوان العقد من contract.target:', contract.target);
console.log('📞 عنوان العقد من contract.address:', contract.address);
    if (!currentUser) {
      alert('⚠️ يجب تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'artist') {
      alert('⚠️ يجب أن تكون فناناً لإضافة أعمال فنية');
      navigate(`/profile/${currentUser._id}`);
      return;
    }

    try {
      const token = localStorage.getItem("artAppToken");
      if (!token) {
        alert('⚠️ يجب تسجيل الدخول أولاً');
        navigate('/login');
        return;
      }

      setIsMinting(true);
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('category', formData.category);
      form.append('price', formData.price.toString());
      form.append('image', formData.image);
      form.append('artistId', currentUser._id);
      form.append('isForSale', (formData.price > 0).toString());

      const response = await axios.post(`${API_BASE}/api/artworks`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('✅ تم النشر على الباكند:', response.data);

      let tokenId = null;

      if (contract && wallet && formData.price > 0) {
        try {
          const priceInWei = ethers.parseEther(formData.price.toString());
          console.log('السعر بـ Wei:', priceInWei.toString());
          
 
          const metadata = {
            name: formData.title,
            description: formData.description,
            image: `http://localhost:5000${response.data.imageUrl}`,
            attributes: [
              {
                trait_type: "Category",
                value: formData.category
              }
            ]
          };
          
 
          const tx = await contract.mintArtwork(
            formData.title,
            formData.description,
            response.data.imageUrl,
            JSON.stringify(metadata),
            priceInWei
          );
          
          const receipt = await tx.wait();
          console.log('✅ تم Mint العمل الفني على العقد');
          console.log('Receipt:', receipt);
          

          try {
       
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
              console.log('✅ Token ID من حدث Transfer:', tokenId);
            }
 
            if (!tokenId) {
              const artworkEvent = receipt.logs.find(log => {
                try {
                  const parsedLog = contract.interface.parseLog(log);
                  return parsedLog?.name === 'ArtworkCreated' || parsedLog?.name === 'ArtworkMinted';
                } catch {
                  return false;
                }
              });
              
              if (artworkEvent) {
                const parsedLog = contract.interface.parseLog(artworkEvent);
                tokenId = Number(parsedLog?.args?.tokenId || parsedLog?.args[0]);
                console.log('✅ Token ID من حدث Artwork:', tokenId);
              }
            }
          } catch (eventError) {
            console.error('❌ فشل في استخراج tokenId من events:', eventError);
          }

          if (!tokenId) {
            try {
              const nextId = await contract.nextTokenId();
              tokenId = Number(nextId) - 1;
              console.log('✅ Token ID من nextTokenId:', tokenId);
            } catch (nextIdError) {
              console.error('❌ فشل في الحصول على tokenId من nextTokenId:', nextIdError);
            
              tokenId = Date.now() % 1000000;
              console.log('⚠️ تم إنشاء tokenId مؤقت:', tokenId);
            }
          }

          console.log('✅ Token ID النهائي:', tokenId);

    
          if (tokenId) {
            try {
              await axios.put(
                `http://localhost:5000/api/artworks/${response.data._id}/tokenId`,
                { tokenId: Number(tokenId) },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log('✅ تم حفظ tokenId في قاعدة البيانات');
            } catch (updateError) {
              console.error('❌ فشل في حفظ tokenId:', updateError);
            }
   
            try {
              const saleTx = await contract.putOnSale(tokenId, priceInWei);
              await saleTx.wait();
              console.log('✅ تم عرض العمل للبيع على البلوكشين');
            } catch (saleError) {
              console.error('❌ فشل في عرض العمل للبيع:', saleError);
            }
          } else {
            console.warn('⚠️ لم يتم الحصول على tokenId، سيتم حفظ العمل بدون NFT');
          }
          
        } catch (mintError) {
          console.error('❌ فشل في Mint:', mintError);
          alert('⚠️ تم حفظ العمل ولكن فشل في إنشاء NFT. سيتم حفظه كعمل عادي.');
        }
      }

      setIsMinting(false);
      setIsSaved(true);
      
      setTimeout(() => {
        navigate(`/profile/${currentUser._id}`);
      }, 3000);

    } catch (error) {
      setIsMinting(false);
      console.error('❌ فشل في النشر:', error.response?.data || error.message);
      alert(`❌ حدث خطأ أثناء النشر: ${error.response?.data?.message || error.message}`);
    }
  };

  if (isSaved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md transform transition-all animate-fade-in-up">
          <div className="text-green-500 text-7xl mb-6 animate-bounce">✨</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            تم حفظ العمل الفني بنجاح!
          </h2>
          <p className="text-gray-600 mb-8">
            سيتم توجيهك إلى ملفك الشخصي خلال لحظات...
          </p>
          <button
            onClick={() => navigate(`/profile/${currentUser._id}`)}
            className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            العودة للبروفايل الآن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all hover:shadow-3xl">
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-8 py-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Upload size={32} />
              إضافة عمل فني جديد
            </h1>
            <p className="text-pink-100 text-lg">
              شارك إبداعاتك مع العالم واحصل على فرصة البيع كـ NFT
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-gray-700 font-semibold text-lg">
                <Tag size={20} className="text-pink-600" />
                عنوان العمل *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-200 focus:border-pink-500 transition-all duration-300 text-lg"
                placeholder="أدخل عنواناً جذاباً لعملك"
                required
                disabled={isMinting}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-gray-700 font-semibold text-lg">
                <Image size={20} className="text-pink-600" />
                وصف العمل
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-200 focus:border-pink-500 transition-all duration-300 text-lg"
                rows="5"
                placeholder="صف عملك الفني، التقنية المستخدمة، الإلهام... (اختياري)"
                disabled={isMinting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-semibold text-lg">
                  <Tag size={20} className="text-pink-600" />
                  التصنيف *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-200 focus:border-pink-500 transition-all duration-300 text-lg bg-white"
                  required
                  disabled={isMinting}
                >
                  <option value="">اختر تصنيفاً</option>
                  <option value="رسم زيتي">رسم زيتي</option>
                  <option value="تصوير فوتوغرافي">تصوير فوتوغرافي</option>
                  <option value="نحت">نحت</option>
                  <option value="رسم رقمي">رسم رقمي</option>
                  <option value="خط عربي">خط عربي</option>
                  <option value="فن تجريدي">فن تجريدي</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-semibold text-lg">
                  <DollarSign size={20} className="text-pink-600" />
                  السعر (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-200 focus:border-pink-500 transition-all duration-300 text-lg pl-12"
                    placeholder="0.00"
                    disabled={isMinting}
                  />
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">ETH</span>
                </div>
                <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <AlertCircle size={16} className="text-yellow-500" />
                  إذا تركت 0، لن يكون العمل معروضاً للبيع
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-gray-700 font-semibold text-lg">
                <Upload size={20} className="text-pink-600" />
                صورة العمل *
              </label>
              <div className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center transition-colors cursor-pointer bg-gray-50 ${!isMinting ? 'hover:border-pink-500' : 'opacity-50 cursor-not-allowed'}`}>
                <input
                  type="file"
                  onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                  className="hidden"
                  id="image-upload"
                  accept="image/*"
                  required
                  disabled={isMinting}
                />
                <label htmlFor="image-upload" className={`cursor-pointer block ${isMinting ? 'pointer-events-none' : ''}`}>
                  <Upload size={40} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 font-medium">اختر صورة لعملك الفني</p>
                  <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF حتى 10MB</p>
                </label>
              </div>
              {formData.image && (
                <p className="text-green-600 mt-2 flex items-center gap-1">
                  <span>✓</span> تم اختيار الملف: {formData.image.name}
                </p>
              )}
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isMinting}
                className={`w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 ${
                  isMinting ? 'opacity-50 cursor-not-allowed hover:translate-y-0' : 'hover:from-pink-700 hover:to-purple-700'
                }`}
              >
                {isMinting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري النشر و إنشاء NFT...
                  </>
                ) : (
                  <>
                    <Upload size={24} />
                    نشر العمل الفني 🎨
                  </>
                )}
              </button>
            </div>

            {(!contract || !wallet) && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-yellow-700 flex items-center gap-2">
                  <AlertCircle size={20} />
                  ⚠️ العقد الذكي غير متصل. سيتم حفظ العمل بدون تحويله إلى NFT.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddArtwork;