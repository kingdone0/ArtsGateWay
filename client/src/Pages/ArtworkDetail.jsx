import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Heart, MessageSquare, Bookmark, Share2, Edit, Trash2, Flag, DollarSign } from 'react-feather';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';
import axios from 'axios';
import ReportModal from '../Components/ReportModal';

const ArtworkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    wallet, 
    address, 
    contract, 
    usdBalance,
    isConnected,
    fetchBalances 
  } = useWallet();

  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showCommentMenu, setShowCommentMenu] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCommentReportModal, setShowCommentReportModal] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  
  const [txStatus, setTxStatus] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  const [isArtist, setIsArtist] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showBuyButton, setShowBuyButton] = useState(false);

  const token = localStorage.getItem('artAppToken');

  console.log("🔍 Wallet Data:", {
    address,
    usdBalance,
    isConnected,
    hasContract: !!contract
  });

  useEffect(() => {
    if (contract) {
      console.log("📋 methods:", contract.interface.fragments.map(f => f.name));
    }
  }, [contract]);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/artworks/${id}`);
        setArtwork(response.data);
        
        console.log('🔍 قيم المستخدم:', {
          isArtist,
          isPurchased,
          currentUserArtistId: currentUser?.artistProfile?._id,
          artworkOwnerId: response.data.owner?._id,
          shouldShowButtons: isPurchased && !isArtist
        });
        
        console.log('🔍 قيم الصلاحية:', {
          isArtist,
          isPurchased,
          currentUserId: currentUser?.id,
          currentUserArtistId: currentUser?.artistProfile?._id,
          artistUserId: response.data.artist?.user?._id,
          ownerId: response.data.owner?._id,
          ownerUserId: response.data.owner?.user?._id,
          showButtons: isPurchased && currentUser?.artistProfile?._id === response.data.owner?._id
        });
        console.log('👑 المالك الحالي:', response.data.owner?._id);
console.log('👤 معرف الفنان الخاص بك:', currentUser?.artistProfile?._id);
console.log('🔍 هل أنت المالك؟:', currentUser?.artistProfile?._id === response.data.owner?._id);
        console.log('🔍 بيانات العمل:', {
          artistId: response.data.artist?._id,
          ownerId: response.data.owner?._id,
          currentUserId: currentUser?.id,
          currentUserArtistId: currentUser?.artistProfile?._id,
          isArtist: currentUser?.id === response.data.artist?.user?._id,
          isOwner: currentUser?.artistProfile?._id === response.data.owner?._id,
          hasBeenPurchased: response.data.owner && 
                           response.data.owner !== response.data.artist?._id &&
                           response.data.soldAt
        });
        
    
const isUserArtist = currentUser?.id === response.data.artist?.user?._id || 
                     currentUser?.artistProfile?._id === response.data.artist?._id;


const ownerId = response.data.owner?._id || response.data.owner;
const isUserOwner = 
  currentUser?.id === ownerId ||                               
  currentUser?.artistProfile?._id === ownerId ||               
  currentUser?.id === response.data.owner?.user?._id ||      
  currentUser?.artistProfile?._id === response.data.owner?.user?._id; 

console.log('🔍 فحص الملكية:', {
  ownerId,
  currentUserId: currentUser?.id,
  currentArtistId: currentUser?.artistProfile?._id,
  isUserOwner
});
        
        setIsArtist(isUserArtist);
        setIsOwner(isUserOwner);

        console.log('🔍 الملكية:', {
          isArtist: isUserArtist,
          isOwner: isUserOwner,
          currentUserArtistId: currentUser?.artistProfile?._id,
          artworkOwnerId: response.data.owner?._id
        });
        
const hasBeenPurchased = !!(response.data.owner && 
                   response.data.owner !== response.data.artist?._id &&
                   response.data.soldAt);
setIsPurchased(hasBeenPurchased);

console.log('🔍 هل العمل مشترى؟', {
  owner: response.data.owner,
  artistId: response.data.artist?._id,
  soldAt: response.data.soldAt,
  hasBeenPurchased
});

const showBuyButtonCalc = !isUserOwner && response.data.isForSale && response.data.price > 0;
        setShowBuyButton(showBuyButtonCalc);

        console.log('🔍 شروط الزر:', {
          isOwner: isUserOwner,
          isArtist: isUserArtist,
          isForSale: response.data.isForSale,
          price: response.data.price,
          showBuyButton: showBuyButtonCalc
        });

        if (response.data.likes && currentUser?.id) {
          const userLiked = response.data.likes.some(like =>
            like === currentUser.id || like._id === currentUser.id
          );
          setLiked(userLiked);
        }

        const favoriteState = getFavoriteFromStorage();
        setIsFavorite(favoriteState);
      } catch (error) {
        console.error('Error fetching artwork:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id, currentUser]);

 
  useEffect(() => {
    if (wallet && address) {
      fetchBalances(address);
    }
  }, [wallet, address, fetchBalances]);

  const getFavoriteFromStorage = useCallback(() => {
    if (!currentUser) return false;
    try {
      const storageKey = `art_fav_${currentUser.id}`;
      const storedData = localStorage.getItem(storageKey);
      if (!storedData) return false;
      const favorites = JSON.parse(storedData);
      return favorites[id] === true;
    } catch (error) {
      return false;
    }
  }, [currentUser, id]);

  const saveFavoriteToStorage = useCallback(
    (favoriteState) => {
      if (!currentUser) return;
      try {
        const storageKey = `art_fav_${currentUser.id}`;
        const existingData = localStorage.getItem(storageKey);
        const favorites = existingData ? JSON.parse(existingData) : {};
        favorites[id] = favoriteState;
        localStorage.setItem(storageKey, JSON.stringify(favorites));
      } catch (error) {}
    },
    [currentUser, id]
  );

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/artworks/${artwork._id}/comment/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setArtwork((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c._id !== commentId),
      }));
      setShowCommentMenu(null);
      alert('تم حذف التعليق بنجاح');
    } catch (error) {
      console.error('❌ خطأ في حذف التعليق:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء حذف التعليق');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) {
      alert('يرجى كتابة نص التعليق');
      return;
    }
    try {
      await axios.put(
        `http://localhost:5000/api/artworks/${artwork._id}/comment/${commentId}`,
        { text: editCommentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setArtwork((prev) => ({
        ...prev,
        comments: prev.comments.map((c) =>
          c._id === commentId ? { ...c, text: editCommentText, edited: true } : c
        ),
      }));
      setEditingCommentId(null);
      setEditCommentText('');
      setShowCommentMenu(null);
      alert('تم تعديل التعليق بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تعديل التعليق:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء تعديل التعليق');
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentText(comment.text);
    setShowCommentMenu(null);
  };

  const handleFavorite = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!currentUser) {
      alert('يجب تسجيل الدخول لإضافة الأعمال إلى المفضلة');
      return;
    }

    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    setIsProcessing(true);
    saveFavoriteToStorage(newFavoriteState);

    try {
      await axios.post(
        `http://localhost:5000/api/user/artworks/${id}/save`,
        {},
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error saving favorite:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await axios.post(`http://localhost:5000/api/artworks/${artwork._id}/like`);
      setLiked(!liked);
      setArtwork((prev) => ({
        ...prev,
        likes: response.data.likes,
        likesCount: response.data.likesCount,
      }));
    } catch (error) {
      if (error.response?.status === 401) {
        alert('يجب تسجيل الدخول للإعجاب');
      }
    }
  };

  const handleRating = async (rating) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/artworks/${artwork._id}/rate`, {
        value: rating,
      });
      setUserRating(rating);
      setArtwork((prev) => ({
        ...prev,
        ratingAverage: response.data.avrage,
        ratings: response.data.rate,
      }));
    } catch (error) {
      if (error.response?.status === 401) {
        alert('يجب تسجيل الدخول للتقييم');
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/api/artworks/${artwork._id}/comment`,
        { text: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newComment = {
        _id: Date.now().toString(),
        text: comment,
        user: {
          _id: currentUser.id,
          username: currentUser.username,
          profilePicture: currentUser.profilePicture,
        },
        createdAt: new Date().toISOString(),
        edited: false,
      };

      setArtwork((prev) => ({
        ...prev,
        comments: [newComment, ...prev.comments],
      }));
      setComment('');
    } catch (error) {
      if (error.response?.status === 401) {
        alert('يجب تسجيل الدخول لإضافة تعليق');
      } else {
        console.error('Error adding comment:', error);
        alert('حدث خطأ أثناء إضافة التعليق');
      }
    }
  };

  const handleDelete = async () => {
  
    if (!isPurchased && !isArtist) {
      alert('❌ فقط المالك الحالي يمكنه حذف العمل');
      return;
    }
    
    if (!window.confirm('هل أنت متأكد من حذف هذا العمل؟')) return;
    
    try {
      setIsDeleting(true);
      await axios.delete(`http://localhost:5000/api/artworks/${artwork._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('تم حذف العمل بنجاح');
      navigate(`/profile/${currentUser._id}`);
    } catch (error) {
      alert('حدث خطأ أثناء حذف العمل');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('تم نسخ الرابط إلى الحافظة');
  };

  const ReportArtworkButton = () => {
    
    if (isArtist || isPurchased) return null;
    return (
      <button
        onClick={() => setShowReportModal(true)}
        className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
      >
        <Flag size={20} />
        <span>إبلاغ</span>
      </button>
    );
  };

  const ReportCommentButton = ({ commentId, commentUserId }) => {
    if (commentUserId === currentUser?.id) return null;
    return (
      <button
        onClick={() => {
          setSelectedCommentId(commentId);
          setShowCommentReportModal(true);
        }}
        className="text-gray-400 hover:text-red-500 transition p-1"
        title="الإبلاغ عن التعليق"
      >
        <Flag size={16} />
      </button>
    );
  };

  const openPurchaseConfirm = () => {
    if (!wallet) {
      alert('⚠️ الرجاء فتح المحفظة أولاً');
      return;
    }
    if (!contract) {
      alert('⚠️ العقد الذكي غير متصل');
      return;
    }
    
    const price = parseFloat(artwork.price || 0);
    const balance = parseFloat(usdBalance || 0);
    
    if (balance < price) {
      alert(`❌ رصيدك غير كافٍ. الرصيد الحالي: $${balance.toFixed(2)} USD`);
      return;
    }
    setShowConfirmModal(true);
  };

const handlePurchase = async () => {
  setShowConfirmModal(false);
  setTxStatus('⏳ جاري المعالجة على البلوكشين...');
  
  try {
    console.log('بدء عملية الشراء...');
    
    if (!contract) throw new Error('العقد الذكي غير متاح');
    if (!artwork?.tokenId) throw new Error('هذا العمل ليس NFT بعد');

    const priceInWei = ethers.parseEther(artwork.price.toString());
    const tokenId = artwork.tokenId;
    
    console.log('🔍 Token ID:', tokenId);
    
    const tx = await contract.purchaseArtwork(tokenId, { value: priceInWei });
    console.log('📝 معاملة الشراء مرسلة:', tx.hash);
    setTxStatus('⏳ في انتظار تأكيد المعاملة...');
    
    await tx.wait();
    console.log('✅ المعاملة مؤكدة');
    
    const token = localStorage.getItem('artAppToken');
    await axios.post(
      `http://localhost:5000/api/artworks/${artwork._id}/purchase`,
      { 
        transactionHash: tx.hash,
        newOwner: address 
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (fetchBalances) await fetchBalances(address);

    setTxStatus('✅ تمت عملية الشراء بنجاح!');
    alert('🎉 تم شراء العمل بنجاح!');
  
    const ownerData = {
      _id: currentUser?.artistProfile?._id || currentUser?.id,
      user: {
        _id: currentUser?.id,
        username: currentUser?.username || 'مستخدم',
        profilePicture: currentUser?.profilePicture || '/default-avatar.jpg'
      },
      bio: currentUser?.artistProfile?.bio || currentUser?.bio || ''
    };
    
    console.log('📝 تحديث المالك إلى:', ownerData);
    
    setArtwork(prev => ({
      ...prev,
      owner: ownerData,
      isForSale: false,
      soldAt: new Date().toISOString()
    }));
    
  
    setIsPurchased(true);
    setIsOwner(true);
    setShowBuyButton(false);
    
  } catch (err) {
    console.error('❌ خطأ في الشراء:', err);
    setTxStatus('❌ فشلت المعاملة: ' + (err.reason || err.message));
  }
};

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-4 border-[#d5006d] border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-gray-600">جاري تحميل العمل...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">العمل غير موجود</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-[#d5006d] text-white px-6 py-2 rounded-lg"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(http://localhost:5000${artwork.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px) brightness(0.7)',
          opacity: 0.4,
        }}
      />
      <div className="fixed inset-0 z-1 bg-gradient-to-b from-transparent via-transparent to-gray-900/30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* الصورة */}
          <div className="flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <img
                src={`http://localhost:5000${artwork.imageUrl}`}
                alt={artwork.title}
                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                onError={(e) => (e.target.src = '/default-artwork.jpg')}
              />
            </motion.div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{artwork.title}</h1>
            
<div className="flex items-center mb-6">
  <img
    src={`http://localhost:5000${
      
      (isPurchased || artwork.soldAt)
        ? (artwork.owner?.user?.profilePicture || currentUser?.profilePicture || '/default-avatar.jpg')
        : (artwork.artist?.user?.profilePicture || '/default-avatar.jpg')
    }`}
    alt={
      (isPurchased || artwork.soldAt)
        ? (artwork.owner?.user?.username || currentUser?.username || 'مستخدم')
        : (artwork.artist?.user?.username || 'فنان')
    }
    className="w-14 h-14 rounded-full border-4 border-white shadow-lg object-cover"
    onError={(e) => (e.target.src = '/default-avatar.jpg')}
  />
  <div className="mr-4">
    <h3 className="font-bold text-lg text-gray-800">
      {(isPurchased || artwork.soldAt)
        ? (artwork.owner?.user?.username || currentUser?.username || 'مستخدم')
        : (artwork.artist?.user?.username || 'فنان')}
    </h3>
    <p className="text-gray-600 text-sm mt-1 whitespace-pre-line">
      {(isPurchased || artwork.soldAt)
        ? (artwork.owner?.bio || currentUser?.artistProfile?.bio || '')
        : (artwork.artist?.bio || '')}
    </p>
  </div>
</div>

              <div className="space-y-4">
                {artwork.category && (
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700">التصنيف:</span>
                    <span className="mr-3 bg-[#d5006d]/10 text-[#d5006d] px-4 py-1 rounded-full text-sm font-medium">
                      {artwork.category}
                    </span>
                  </div>
                )}
                {artwork.description && (
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 mb-2">وصف العمل</h3>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl">
                      {artwork.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* تقييم العمل */}
            <div className="mb-8">
              <h3 className="font-bold text-lg text-gray-800 mb-4">تقييم العمل</h3>
              <div className="flex items-center space-x-6">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        size={32}
                        className={
                          star <= (hoverRating || userRating || Math.floor(artwork.ratingAverage || 0))
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {(artwork.ratingAverage || 0).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">من 5</div>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                ({artwork.ratings?.length || 0} تقييمات)
              </div>
            </div>

            {/* أزرار التفاعل */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition ${
                  liked ? 'bg-[#d5006d] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart size={20} fill={liked ? 'white' : 'none'} />
                <span>إعجاب ({artwork.likesCount || 0})</span>
              </button>

              <button
                onClick={handleFavorite}
                disabled={isProcessing}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition ${
                  isFavorite ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Bookmark size={20} fill={isFavorite ? 'white' : 'none'} />
                <span>{isProcessing ? 'جاري...' : isFavorite ? 'مفضل ✓' : 'إضافة للمفضلة'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
              >
                <Share2 size={20} />
                <span>مشاركة</span>
              </button>

              <ReportArtworkButton />

            {isOwner && (
    <div className="flex gap-3">
     
<button
  onClick={() => {
    console.log("🔍 جاري التوجه للتعديل - artwork ID:", id);
    console.log("🔍 isOwner:", isOwner);
    navigate(`/edit-artwork/${id}`);
  }}
  className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
>
  <Edit size={20} />
  <span>تعديل</span>
</button>
      
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition disabled:opacity-50"
      >
        <Trash2 size={20} />
        <span>{isDeleting ? 'جاري الحذف...' : 'حذف'}</span>
      </button>
    </div>
  )}
</div>
            {/* ✅ قسم الشراء - يظهر فقط حسب شرط showBuyButton */}
            {showBuyButton && (
              <div className="mt-8 p-6 border-t border-gray-200">
                {/* السعر */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl mb-2 shadow-lg">
                  <div className="text-center">
                    <span className="text-lg text-white/80 block">السعر</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-5xl font-bold text-white">
                        ${parseFloat(artwork.price || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                      <span className="text-white/80 text-lg">USD</span>
                    </div>
                  </div>
                </div>

                {/* رصيد المستخدم */}
                {isConnected && (
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-4">
                    <div className="flex items-center justify-end">
                      <span className={`text-2xl font-bold ${parseFloat(usdBalance) >= parseFloat(artwork.price) ? 'text-green-600' : 'text-red-500'}`}>
                        ${parseFloat(usdBalance || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} USD
                      </span>
                      <span className="text-gray-600"> .  : رصيدك</span>
                    </div>
                  </div>
                )}

                {/* زر الشراء */}
                {!isConnected ? (
                  <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-yellow-700">⚠️ الرجاء الاتصال بالمحفظة أولاً</p>
                  </div>
                ) : parseFloat(usdBalance) < parseFloat(artwork.price) ? (
                  <div className="text-center">
                    <button
                      disabled
                      className="w-full bg-gray-200 text-gray-500 py-4 rounded-xl font-medium cursor-not-allowed"
                    >
                      رصيد غير كافٍ
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={openPurchaseConfirm}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition font-bold text-lg shadow-md"
                  >
                    💰 شراء الآن ({artwork.price} ETH)
                  </button>
                )}

                {txStatus && (
                  <div className={`mt-4 p-3 rounded-xl text-center ${
                    txStatus.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {txStatus}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>

        {/* نافذة تأكيد الشراء */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">تأكيد عملية الشراء</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">العمل:</span>
                  <span className="font-medium">{artwork.title}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">السعر:</span>
                  <span className="font-medium text-green-600 font-bold text-xl">
                    ${parseFloat(artwork.price).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} USD
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">رصيدك:</span>
                  <span className="font-medium text-green-600 font-bold">
                    ${parseFloat(usdBalance).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} USD
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">المحفظة:</span>
                  <span className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  سيتم فتح MetaMask لتأكيد المعاملة. هذه المعاملة تتطلب غاز (Gas) ولا رجعة فيها.
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handlePurchase}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                >
                  تأكيد الشراء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* قسم التعليقات */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            التعليقات ({artwork.comments?.length || 0})
          </h2>
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="flex items-center mb-4">
              <img
                src={
                  currentUser?.profilePicture
                    ? `http://localhost:5000${currentUser.profilePicture}`
                    : '/default-avatar.jpg'
                }
                alt={currentUser?.username}
                className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                onError={(e) => (e.target.src = '/default-avatar.jpg')}
              />
              <div className="flex-1 mx-4">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="اكتب تعليقك هنا..."
                  className="w-full border border-gray-300 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-[#d5006d] text-white px-8 py-3 rounded-full hover:bg-[#b0005a] transition font-medium"
              >
                نشر التعليق
              </button>
            </div>
          </form>

          <div className="space-y-6">
            {artwork.comments?.map((commentItem) => {
              const isCommentOwner = currentUser?.id === commentItem.user?._id;
              return (
                <div key={commentItem._id} className="flex space-x-4 p-6 bg-gray-50/50 rounded-2xl">
                  <img
                    src={
                      commentItem.user?.profilePicture
                        ? `http://localhost:5000${commentItem.user.profilePicture}`
                        : '/default-avatar.jpg'
                    }
                    alt={commentItem.user?.username}
                    className="w-14 h-14 rounded-full border-2 border-white flex-shrink-0"
                    onError={(e) => (e.target.src = '/default-avatar.jpg')}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800">
                          {commentItem.user?.username || 'مستخدم'}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span>{new Date(commentItem.createdAt).toLocaleDateString('ar-EG')}</span>
                          {commentItem.edited && (
                            <span className="mr-2 text-xs bg-gray-100 px-2 py-1 rounded">
                              تم التعديل
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ReportCommentButton
                          commentId={commentItem._id}
                          commentUserId={commentItem.user?._id}
                        />
                        {isCommentOwner && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowCommentMenu(
                                  showCommentMenu === commentItem._id ? null : commentItem._id
                                )
                              }
                              className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>

                            {showCommentMenu === commentItem._id && (
                              <div className="absolute left-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <button
                                  onClick={() => startEditComment(commentItem)}
                                  className="w-full text-right px-4 py-2 hover:bg-gray-100 text-blue-600 transition rounded-t-lg"
                                >
                                  تعديل
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(commentItem._id)}
                                  className="w-full text-right px-4 py-2 hover:bg-gray-100 text-red-600 transition rounded-b-lg"
                                >
                                  حذف
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {editingCommentId === commentItem._id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#d5006d] focus:border-transparent"
                          rows="3"
                        />
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditCommentText('');
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          >
                            إلغاء
                          </button>
                          <button
                            onClick={() => handleEditComment(commentItem._id)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                          >
                            حفظ التعديل
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 text-lg">{commentItem.text}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {(!artwork.comments || artwork.comments.length === 0) && (
              <div className="text-center py-12">
                <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">لا توجد تعليقات بعد</h3>
                <p className="text-gray-500">كن أول من يعلق على هذا العمل!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="artwork"
        targetId={artwork._id}
      />
      <ReportModal
        isOpen={showCommentReportModal}
        onClose={() => {
          setShowCommentReportModal(false);
          setSelectedCommentId(null);
        }}
        targetType="comment"
        targetId={selectedCommentId}
      />
    </div>
  );
};

export default ArtworkDetail;