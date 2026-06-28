import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, Share2, Bookmark, Star, Flag } from 'react-feather';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ArtworkCard = ({ artwork, viewMode, isCurrentUser, onLike, onSave }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const { currentUser } = useAuth();

  const artworkId = artwork._id || artwork.id;

  const getFavoriteFromStorage = useCallback(() => {
    if (!currentUser) {
      return false;
    }
    
    try {
      const storageKey = `art_fav_${currentUser.id}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        return false;
      }
      
      const favorites = JSON.parse(storedData);
      const isFav = favorites[artworkId] === true;
      ;
      
      return isFav;
    } catch (error) {
      console.error('❌ خطأ في قراءة localStorage:', error);
      return false;
    }
  }, [currentUser, artworkId]);
  const saveFavoriteToStorage = useCallback((favoriteState) => {
    if (!currentUser) {
      return;
    }
    
    try {
      const storageKey = `art_fav_${currentUser.id}`;
      const existingData = localStorage.getItem(storageKey);
      const favorites = existingData ? JSON.parse(existingData) : {};
      

      favorites[artworkId] = favoriteState;
      
   
      favorites._lastUpdated = Date.now();
      

      localStorage.setItem(storageKey, JSON.stringify(favorites));
      ;
    
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(favorites)
      }));
      
    } catch (error) {
      console.error('❌ خطأ في حفظ localStorage:', error);
    }
  }, [currentUser, artworkId]);
  const saveReportToLocalStorage = (reportData) => {
  if (!currentUser) {
    return;
  }
  
  try {
    const storageKey = `art_reports_${currentUser.id}`;
    const existingReports = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const isDuplicate = existingReports.some(report => 
      report.targetId === reportData.targetId && 
      report.targetType === reportData.targetType
    );
    
    if (!isDuplicate) {
      existingReports.push({
        ...reportData,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending_local'
      });
      
      localStorage.setItem(storageKey, JSON.stringify(existingReports));
      ;
      
      return true;
    } else {
      console.log('⚠️ هذا الإبلاغ موجود مسبقاً محلياً');
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في حفظ الإبلاغ محلياً:', error);
    return false;
  }
  };
  useEffect(() => {
    
   
    const calculatedLikeCount = artwork.likesCount || artwork.likes?.length || 0;
    setLikeCount(calculatedLikeCount);
    
    const calculatedCommentCount = artwork.commentsCount || artwork.comments?.length || 0;
    setCommentCount(calculatedCommentCount);
    
    if (currentUser) {
      const likes = artwork.likes || [];
      let userLiked = false;
      
      if (likes.length > 0) {
        if (typeof likes[0] === 'string') {
          userLiked = likes.some(like => like === currentUser.id);
        } else if (likes[0] && typeof likes[0] === 'object') {
          userLiked = likes.some(like => {
            const likeId = like._id || like.id || like.user;
            return likeId === currentUser.id;
          });
        }
      }
      
      setIsLiked(userLiked);
    } else {
      setIsLiked(false);
    }
    
 
    const favoriteState = getFavoriteFromStorage();
    setIsFavorite(favoriteState);

    return () => {
    };
  }, [artwork, currentUser, artworkId, getFavoriteFromStorage]);
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (!currentUser) return;
      
      const storageKey = `art_fav_${currentUser.id}`;
      if (event.key === storageKey) {
        const favoriteState = getFavoriteFromStorage();
        setIsFavorite(favoriteState);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser, getFavoriteFromStorage]);
  const getImageUrl = () => {
    const imageFields = ['imageUrl', 'image', 'picture', 'photo', 'url'];
    
    for (const field of imageFields) {
      if (artwork[field]) {
        const imageValue = artwork[field];
        
        if (typeof imageValue === 'string' && imageValue.startsWith('http')) {
          return imageValue;
        }
        
        if (typeof imageValue === 'string' && imageValue.startsWith('/')) {
          return `http://localhost:5000${imageValue}`;
        }
        
        if (typeof imageValue === 'string') {
          return `http://localhost:5000/uploads/${imageValue}`;
        }
      }
    }
    
    return '/default-artwork.png';
  };
  const imageUrl = getImageUrl();
  const handleLike = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const response = await axios.post(`http://localhost:5000/api/artworks/${artworkId}/like`);
      setLikeCount(response.data.likesCount);
      setIsLiked(!isLiked);

      if (currentUser) {
        const storageKey = `art_like_${currentUser.id}`;
        const likes = JSON.parse(localStorage.getItem(storageKey) || '{}');
        likes[artworkId] = !isLiked;
        localStorage.setItem(storageKey, JSON.stringify(likes));
      }
      
    } catch (error) {
      console.error('❌ خطأ في الإعجاب:', error);
    }
  };
  const handleFavorite = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!currentUser) {
      alert('يجب تسجيل الدخول لإضافة الأعمال إلى المفضلة');
      return;
    }
   
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    setIsProcessing(true);
    
    console.log('🎯 تبديل المفضلة:', {
      artworkId,
      userId: currentUser.id,
      from: isFavorite,
      to: newFavoriteState
    });
  
    saveFavoriteToStorage(newFavoriteState);
    
    try {

      const response = await axios.post(
        `http://localhost:5000/api/user/artworks/${artworkId}/save`,
        {},
        { 
          headers: { 
            'Content-Type': 'application/json'
          }
        }
      );
      

      
      if (response.data.success) {
        const backendFavoriteState = response.data.isFavorite !== undefined 
          ? response.data.isFavorite 
          : response.data.saved;
        
        if (backendFavoriteState !== newFavoriteState) {
          setIsFavorite(backendFavoriteState);
          saveFavoriteToStorage(backendFavoriteState);
        }

        if (backendFavoriteState) {
          console.log('❤️ تم إضافة العمل إلى المفضلة');
        } else {
          console.log('💔 تم إزالة العمل من المفضلة');
        }
      }
      
    } catch (error) {
      console.error('❌ خطأ في الـ Backend:', error);
      console.log('✅ الحالة محفوظة في localStorage فقط');
      
    } finally {
      setIsProcessing(false);
    }
  };
  const handleReport = async (e) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  console.log('🔍 بدء عملية الإبلاغ...');
 
  if (!currentUser) {
    alert('يجب تسجيل الدخول للإبلاغ عن الأعمال');
    return;
  }
 
  setShowReportModal(true);
  console.log('✅ فتح نافذة الإبلاغ للمستخدم:', currentUser.id);
  };
  const confirmReport = async () => {
  if (!reportReason.trim()) {
    alert('يرجى اختيار سبب الإبلاغ');
    return;
  }
  
  setReportLoading(true);
  
  try {
    let reasonType = 'other';
    const reasonMapping = {
      'محتوى غير لائق': 'inappropriate',
      'انتهاك حقوق النشر': 'copyright',
      'محتوى مسيء': 'hate_speech',
      'حملة تنمر': 'harassment',
      'محتوى غير مرتبط بالفن': 'spam',
      'سبب آخر': 'other'
    };
    
    if (reasonMapping[reportReason]) {
      reasonType = reasonMapping[reportReason];
    }
    
    const reportData = {
      targetType: 'artwork',
      targetId: artworkId,
      reason: reasonType,
      details: reportReason === 'سبب آخر' ? reportReason : `${reportReason}`,
      artworkTitle: artwork.title || 'بدون عنوان',
      userId: currentUser?.id,
      userEmail: currentUser?.email, 
      timestamp: Date.now()
    };
    
    console.log('📤 إرسال إبلاغ:', reportData);
    
    try {
      const response = await axios.post(
        'http://localhost:5000/api/report',
        reportData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      
      if (response.data.success) {
        alert('شكراً لك! تم الإبلاغ عن العمل بنجاح.');
        setShowReportModal(false);
        setReportReason('');
      } else {
        alert(response.data.message || 'حدث خطأ أثناء الإبلاغ');
      }
      
    } catch (noTokenError) {
      
  
      saveReportToLocalStorage(reportData);
      
      alert('تم حفظ إبلاغك محلياً. سيتم إرساله تلقائياً عند اتصالك بالإنترنت.');
      setShowReportModal(false);
      setReportReason('');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الإبلاغ:', error);
    

    try {
      const reportData = {
        targetType: 'artwork',
        targetId: artworkId,
        reason: reportReason,
        artworkTitle: artwork.title || 'بدون عنوان',
        userId: currentUser?.id,
        timestamp: Date.now()
      };
      
      saveReportToLocalStorage(reportData);
      alert('تم حفظ إبلاغك محلياً.');
      
    } catch (storageError) {
      alert('حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.');
    }
    
    setShowReportModal(false);
    setReportReason('');
    
  } finally {
    setReportLoading(false);
  }
  };
  const artworkData = {
    id: artworkId,
    title: artwork.title || 'بدون عنوان',
    description: artwork.description || 'لا يوجد وصف',
    category: artwork.category || 'غير مصنف',
    rating: artwork.rating || artwork.ratingAverage || 0,
    createdAt: artwork.createdAt || new Date()
  };
  const renderStars = () => {
    if (!artworkData.rating || artworkData.rating === 0) return null;
    
    return (
      <div className="flex items-center mt-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < Math.floor(artworkData.rating) ? 
              'text-yellow-400 fill-yellow-400' : 
              'text-gray-300'
            }
          />
        ))}
        <span className="text-xs text-gray-500 mr-1">({artworkData.rating.toFixed(1)})</span>
      </div>
    );
  };
  const FavoriteButton = () => (
  <button 
    onClick={handleFavorite}
    disabled={isProcessing}
    className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
      isFavorite
        ? 'text-[#d5006d] bg-[#d5006d]/10' 
        : 'text-gray-600 hover:text-[#d5006d] hover:bg-gray-100'
    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
    title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
  >
    <Bookmark className={isFavorite ? 'fill-[#d5006d]' : ''} size={18} />
  </button>
  );
  if (viewMode === 'grid') {
    return (
      <>
        <div className="relative group">
          <Link to={`/artwork/${artworkData.id}`} className="block">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition duration-300"
            >
              <div className="relative h-64 bg-gray-100 overflow-hidden">
                <img
                  src={imageUrl}
                  alt={artworkData.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = '/default-artwork.png';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <h3 className="text-white font-bold text-lg">{artworkData.title}</h3>
                  <p className="text-white text-sm opacity-90">{artworkData.category}</p>
                  {renderStars()}
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-gray-700 text-sm line-clamp-2">
                  {artworkData.description}
                </p>
              </div>
            </motion.div>
          </Link>
          
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 flex justify-between items-center">
              <button 
                onClick={handleLike}
                disabled={isProcessing}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                  isLiked 
                    ? 'text-[#d5006d] bg-[#d5006d]/10' 
                    : 'text-gray-600 hover:text-[#d5006d] hover:bg-gray-100'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={isLiked ? 'fill-[#d5006d]' : ''} size={18} />
                <span className="text-sm font-medium">{likeCount}</span>
              </button>
              
              <div className="flex items-center space-x-2 text-gray-600 p-2">
                <MessageSquare size={18} />
                <span className="text-sm">{commentCount}</span>
              </div>
              
              <FavoriteButton />
              
              <button 
                className="p-2 text-gray-600 hover:text-[#d5006d] hover:bg-gray-100 rounded-lg transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard.writeText(`${window.location.origin}/artwork/${artworkData.id}`);
                  alert('تم نسخ رابط العمل إلى الحافظة');
                }}
              >
                <Share2 size={18} />
              </button>
              
              <button 
                onClick={handleReport}
                disabled={isProcessing}
                className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="الإبلاغ عن العمل"
              >
                <Flag size={18} />
              </button>
            </div>
          </div>
        </div>

        {showReportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4 text-center">الإبلاغ عن العمل</h3>
              
              <p className="text-gray-600 mb-4 text-center">
                <span className="font-semibold">{artworkData.title}</span>
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سبب الإبلاغ:
                </label>
                <select 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                >
                  <option value="">اختر السبب</option>
                  <option value="محتوى غير لائق">محتوى غير لائق</option>
                  <option value="انتهاك حقوق النشر">انتهاك حقوق النشر</option>
                  <option value="محتوى مسيء">محتوى مسيء</option>
                  <option value="محتوى غير مناسب">محتوى غير مناسب</option>
                  <option value="حملة تنمر">حملة تنمر</option>
                  <option value="محتوى غير مرتبط بالفن">محتوى غير مرتبط بالفن</option>
                  <option value="سبب آخر">سبب آخر</option>
                </select>
                
                {reportReason === 'سبب آخر' && (
                  <textarea
                    placeholder="يرجى توضيح السبب..."
                    className="w-full border border-gray-300 rounded-lg p-3 mt-2 focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                    rows="3"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                )}
              </div>
              
              <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason('');
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={reportLoading}
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmReport}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  disabled={reportLoading}
                >
                  {reportLoading ? 'جاري الإبلاغ...' : 'تأكيد الإبلاغ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <Link to={`/artwork/${artworkData.id}`} className="block">
          <motion.div 
            whileHover={{ x: 5 }}
            className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-6 border border-gray-100 hover:shadow-lg transition duration-300"
          >
            <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt={artworkData.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/default-artwork.png';
                }}
              />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-xl mb-1">{artworkData.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{artworkData.category}</p>
                  {renderStars()}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(artworkData.createdAt).toLocaleDateString('ar-SA')}
                </span>
              </div>
              
              <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                {artworkData.description}
              </p>
              
              <div className="flex items-center space-x-6 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Heart size={16} />
                  <span className="text-sm">{likeCount} إعجاب</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MessageSquare size={16} />
                  <span className="text-sm">{commentCount} تعليق</span>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
        
        <div className="absolute top-6 right-6 flex space-x-2 z-10">
          <button 
            onClick={handleLike}
            disabled={isProcessing}
            className={`p-3 rounded-lg transition-colors ${
              isLiked 
                ? 'text-[#d5006d] bg-[#d5006d]/10' 
                : 'text-gray-600 hover:text-[#d5006d] hover:bg-gray-100'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className={isLiked ? 'fill-[#d5006d]' : ''} size={20} />
          </button>
          
          <FavoriteButton />
          
          <button 
            className="p-3 text-gray-600 hover:text-[#d5006d] hover:bg-gray-100 rounded-lg transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/artwork/${artworkData.id}`);
              alert('تم نسخ رابط العمل إلى الحافظة');
            }}
          >
            <Share2 size={20} />
          </button>
          
          <button 
            onClick={handleReport}
            disabled={isProcessing}
            className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="الإبلاغ عن العمل"
          >
            <Flag size={20} />
          </button>
        </div>
      </div>

      {/* نفس نافذة الإبلاغ */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-center">الإبلاغ عن العمل</h3>
            
            <p className="text-gray-600 mb-4 text-center">
              <span className="font-semibold">{artworkData.title}</span>
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                سبب الإبلاغ:
              </label>
              <select 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
              >
                <option value="">اختر السبب</option>
                <option value="محتوى غير لائق">محتوى غير لائق</option>
                <option value="انتهاك حقوق النشر">انتهاك حقوق النشر</option>
                <option value="محتوى مسيء">محتوى مسيء</option>
                <option value="محتوى غير مناسب">محتوى غير مناسب</option>
                <option value="حملة تنمر">حملة تنمر</option>
                <option value="محتوى غير مرتبط بالفن">محتوى غير مرتبط بالفن</option>
                <option value="سبب آخر">سبب آخر</option>
              </select>
              
              {reportReason === 'سبب آخر' && (
                <textarea
                  placeholder="يرجى توضيح السبب..."
                  className="w-full border border-gray-300 rounded-lg p-3 mt-2 focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                  rows="3"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                />
              )}
            </div>
            
            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={reportLoading}
              >
                إلغاء
              </button>
              <button
                onClick={confirmReport}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={reportLoading}
              >
                {reportLoading ? 'جاري الإبلاغ...' : 'تأكيد الإبلاغ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArtworkCard;