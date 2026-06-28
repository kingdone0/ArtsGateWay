import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Share, MessageCircle, UserPlus, UserCheck, Flag } from "react-feather";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import ReportModal from "../Components/ReportModal"; 

const ArtistCard = ({ artist, onFollowSuccess }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [ownedArtworksCount, setOwnedArtworksCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchOwnedArtworksCount = async () => {
    if (!artist?._id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/artworks`);
      const count = res.data.data.filter(
        artwork => artwork.artist?._id === artist._id && artwork.owner?._id === artist._id
      ).length;
      setOwnedArtworksCount(count);
    } catch (err) {
      console.log("⚠️ لا يمكن جلب عدد الأعمال:", err);
    }
  };
  
useEffect(() => {
  if (!artist) return;

  setFollowersCount(artist.followers?.length || 0);

  setFollowingCount(artist.user?.followingArtistsCount || 0);

  if (currentUser && artist.followers) {
    const followed = artist.followers.some(follower => {
      const followerId = typeof follower === 'object' ? follower._id || follower.id : follower;
      return String(followerId) === String(currentUser._id);
    });
    setIsFollowing(followed);
  }
  
  fetchOwnedArtworksCount();
}, [artist, currentUser]);

const handleFollow = async () => {
  if (!currentUser) return;
  setLoading(true);
  const newFollowing = !isFollowing;
  setIsFollowing(newFollowing);
  setFollowersCount(prev => newFollowing ? prev + 1 : Math.max(0, prev - 1));

  try {
    const token = localStorage.getItem("artAppToken");
    if (token) {
      await axios.post(
        `http://localhost:5000/api/artist/${artist._id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
    
      if (onFollowSuccess) {
        await onFollowSuccess(); 
      }
    }
  } catch (err) {
    console.error(err);
    setIsFollowing(!newFollowing);
    setFollowersCount(prev => newFollowing ? prev - 1 : prev + 1);
    alert("❌ حدث خطأ، حاول مرة أخرى");
  } finally {
    setLoading(false);
  }
};
  const handleReport = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!currentUser) {
      alert('يجب تسجيل الدخول للإبلاغ عن الفنان');
      return;
    }
    
    if (artist._id === currentUser._id) {
      alert('لا يمكنك الإبلاغ عن نفسك');
      return;
    }
    
    setShowReportModal(true);
  };
  const handleLike = () => {
    setIsLiked((prev) => !prev);
  };
  const handleShare = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/artist/${artist._id}`
    );
    alert("تم نسخ رابط الفنان! ✅");
  };
  const handleCloseReportModal = () => {
    setShowReportModal(false);
  };
  const handleStartChat = async (e) => {
    e.stopPropagation();
    
    if (!currentUser) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      const token = localStorage.getItem("artAppToken");
      const recipientId = artist.user?._id || artist.userId;
      
      console.log('🚀 بدء محادثة مع:', recipientId);
      if (!recipientId) {
        alert('لا يمكن العثور على معرف المستخدم للفنان');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/chat/start',
        { recipientId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        const conversationId = response.data.data._id;
        navigate(`/chat/${conversationId}`);
      }
    } catch (err) {
      console.error('❌ خطأ في بدء المحادثة:', err);
      alert('حدث خطأ في بدء المحادثة، يرجى المحاولة لاحقاً');
    }
  };
  const getProfilePicture = () => {
    if (imgError) return "http://localhost:5000/uploads/default-avatar.jpg";
    
    if (artist.user?.profilePicture) {
      if (artist.user.profilePicture.startsWith('http')) {
        return artist.user.profilePicture;
      }
      return `http://localhost:5000${artist.user.profilePicture}`;
    }
    
    return "http://localhost:5000/uploads/default-avatar.jpg";
  };
  const gradients = [
    "from-pink-500 via-rose-500 to-red-500",
    "from-purple-500 via-violet-500 to-indigo-500",
    "from-blue-500 via-cyan-500 to-teal-500",
    "from-emerald-500 via-green-500 to-lime-500",
    "from-amber-500 via-orange-500 to-red-500"
  ];
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
  const FollowButton = () => {
    if (!currentUser) return null;

    const artistUserId = artist.user?._id || artist._id;
    if (String(artistUserId) === String(currentUser._id)) return null;

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleFollow();
        }}
        disabled={loading}
        className={`absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transition-all duration-300 ${
          isFollowing
            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl"
            : "bg-gradient-to-r from-white to-gray-50 text-gray-800 border border-gray-200 shadow-md hover:shadow-lg"
        } ${loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105 active:scale-95"}`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
            <span className="text-xs font-medium">...</span>
          </>
        ) : isFollowing ? (
          <>
            <UserCheck size={16} />
            <span className="text-xs font-medium">متابَع</span>
          </>
        ) : (
          <>
            <UserPlus size={16} />
            <span className="text-xs font-medium">متابعة</span>
          </>
        )}
      </button>
    );
  };
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`relative h-48 bg-gradient-to-r ${randomGradient} overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-8 left-8 w-20 h-20 bg-white rounded-full"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 bg-white rounded-full"></div>
          </div>
          <FollowButton />
          <button
            onClick={handleReport}
            disabled={!currentUser || artist._id === currentUser?._id}
            className={`absolute top-[70px] left-4 z-10 p-2.5 rounded-full shadow-md transition-all duration-300 hover:scale-110 ${
              !currentUser || artist._id === currentUser?._id 
                ? "bg-gray-100/80 backdrop-blur-sm text-gray-400 cursor-not-allowed"
                : "bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-red-500"
            }`}
            title={!currentUser ? "سجل الدخول للإبلاغ" : artist._id === currentUser?._id ? "لا يمكنك الإبلاغ عن نفسك" : "الإبلاغ عن الفنان"}
          >
            <Flag size={18} />
          </button>

          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow text-sm font-medium text-gray-800">
            <span className="text-pink-600 font-bold">{followersCount}</span> متابع
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`absolute bottom-4 left-4 p-2.5 rounded-full shadow-md transition-all duration-300 hover:scale-110 ${
              isLiked 
                ? "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg" 
                : "bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white"
            }`}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          </button>

          {isHovered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
            />
          )}
        </div>

        <div className="p-5 bg-gradient-to-b from-white to-gray-50">
          <div className="flex justify-center -mt-20 mb-4 relative">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
              <img
                src={getProfilePicture()}
                onError={() => setImgError(true)}
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover relative group-hover:scale-105 transition-transform duration-500"
                alt="صورة الفنان"
              />
              <div className="absolute bottom-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow"></div>
            </div>
          </div>

          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {artist.user?.name || artist.name || "فنان"}
            </h3>
            <p className="text-pink-600 text-2xl font-Chewy">
              {artist.user?.username || artist.username || "artist"}
            </p>
            {artist.category && (
              <span className="inline-block mt-2 px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-xs font-medium">
                {artist.category}
              </span>
            )}
          </div>

          <div className="flex justify-around border-y border-gray-100 py-3 mb-4">
            <div className="text-center">
              <p className="font-bold text-xl text-gray-800">{ownedArtworksCount}</p>
              <p className="text-xs text-gray-500 mt-1">أعمال</p>
            </div>

            <div className="text-center">
              <p className="font-bold text-xl text-gray-800">{followersCount}</p>
              <p className="text-xs text-gray-500 mt-1">متابعون</p>
            </div>

            <div className="text-center">
              <p className="font-bold text-xl text-gray-800">{followingCount}</p>
              <p className="text-xs text-gray-500 mt-1">يتابع</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="p-2.5 rounded-lg text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-all duration-300"
              title="مشاركة"
            >
              <Share size={18} />
            </button>

            <Link
              to={`/profile/${artist.user._id}`}
              onClick={(e) => e.stopPropagation()}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-medium hover:from-pink-700 hover:to-purple-700 hover:shadow-lg transition-all duration-300"
            >
              عرض الملف
            </Link>

            <button 
              onClick={handleStartChat}
              className="p-2.5 rounded-lg text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-all duration-300"
              title="مراسلة"
            >
              <MessageCircle size={18} />
            </button>
          </div>
        </div>
      </motion.div>
      <ReportModal
        isOpen={showReportModal}
        onClose={handleCloseReportModal}
        targetType="user"
        targetId={artist.user?._id || artist._id}
      />
    </>
  );
};

export default ArtistCard;