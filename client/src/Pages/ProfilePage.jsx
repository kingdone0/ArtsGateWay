import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ArtworksTab from "../Components/ArtworksTab";
import FollowingTab from "../Components/FollowingTab";
import FollowersTab from "../Components/FollowersTab";
import SavedTab from "../Components/Favorites";
import PurchasesTab from "../Components/PurchasesTab";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { Camera, Bell, MessageCircle, ArrowLeft, Edit2, UserPlus, UserCheck, Image } from "react-feather";

const API_BASE = "http://localhost:5000";

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { conversations } = useChat() || {};
  const [artworksCount, setArtworksCount] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [purchasesCount, setPurchasesCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  
  const chatUnreadCount = conversations?.reduce((total, conv) => total + (conv.unreadCount || 0), 0) || 0;


  const fetchArtworksCount = async (artistId) => {
    if (!artistId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/artworks`);
      const count = res.data.data.filter(
        artwork => artwork.artist?._id === artistId && artwork.owner?._id === artistId
      ).length;
      console.log('✅ عدد الأعمال التي يملكها الفنان:', count);
      setArtworksCount(count);
    } catch (err) {
      console.log("⚠️ لا يمكن جلب عدد الأعمال:", err);
    }
  };

  const fetchPurchasesCount = async () => {
    try {
      const token = localStorage.getItem("artAppToken");
      const res = await axios.get(`${API_BASE}/api/artworks/purchases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPurchasesCount(res.data.count || 0);
    } catch (err) {
      console.log("⚠️ لا يمكن جلب عدد المشتريات:", err);
    }
  };

  const fetchUnreadNotifCount = async () => {
    try {
      const token = localStorage.getItem("artAppToken");
      const res = await axios.get(`${API_BASE}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadNotifCount(res.data.data?.count || 0);
    } catch (err) {
      console.log("⚠️ لا يمكن جلب عدد الإشعارات:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);    
        const res = await axios.get(`${API_BASE}/api/user/${id}`);
        
        if (res.data.success) {
          const userData = res.data.user;
          setUser(userData);
          
          const userIsArtist = userData.role === "artist";
          
          if (userIsArtist) {
            setActiveTab("artworks");
         
            if (userData.artistProfile?._id) {
              fetchArtworksCount(userData.artistProfile._id);
            }
          } else {
            setActiveTab("following");
          }
          
          if (userIsArtist && userData.artistProfile && currentUser) {
            try {
              const artistRes = await axios.get(
                `${API_BASE}/api/artist/${userData.artistProfile._id}`
              );
              if (artistRes.data.success) {
                const artistData = artistRes.data.artist;
                const isUserFollowing = artistData.followers?.some(
                  f => f._id === currentUser._id
                );
                setIsFollowing(isUserFollowing);
              }
            } catch (err) {
              console.log("⚠️ لا يمكن التحقق من المتابعة:", err.message);
            }
          }

          if (currentUser?._id === id) {
            fetchPurchasesCount();
            fetchUnreadNotifCount();
          }
        }
      } catch (error) {
        console.error("❌ خطأ في جلب البيانات:", error);
      } finally {
        setLoading(false);
      }
    };   
    fetchData();
  }, [id, refreshKey, currentUser]);

  const isArtist = user?.role === "artist";
  const isCurrentUser = currentUser?._id === id;

  const getUserType = () => {
    if (isArtist) return `🎨 فنان`;
    if (user?.followingArtists?.length > 5) return "👥 مشاهد نشط";
    if (user?.followingArtists?.length > 0) return "👀 مشاهد";
    return "👤 مستخدم";
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
    fetchUnreadNotifCount();
    if (user?.artistProfile?._id) {
      fetchArtworksCount(user.artistProfile._id);
    }
  };

  const stats = {
    artworks: artworksCount, 
    followers: user?.artistProfile?.followers?.length || 0,
    following: user?.followingArtists?.length || 0,
    saved: user?.favorites?.length || 0,
    purchases: purchasesCount
  };

  const handleFollow = async () => {
    if (!currentUser || !user?.artistProfile?._id) return;  
    const token = localStorage.getItem("artAppToken");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}/api/artist/${user.artistProfile._id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      ); 
      setIsFollowing(!isFollowing);
      refreshData();
    } catch (err) {
      console.error("❌ خطأ في المتابعة:", err);
    }
  };

  const handleOpenEditModal = () => {
    setEditBio(user?.bio || user?.artistProfile?.bio || "");
    setImagePreview("");
    setEditImage(null);
    setIsEditModalOpen(true);
  };

 const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {

    if (file.size > 2 * 1024 * 1024) {
      alert("⚠️ الصورة كبيرة جداً! الحد الأقصى 2 ميجابايت");
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("⚠️ نوع الصورة غير مدعوم. استخدم JPG, PNG, أو WEBP فقط");
      return;
    }
    
    setEditImage(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  }
};

const handleSaveEdit = async () => {
  if (!isCurrentUser) return;
  
  try {
    const token = localStorage.getItem("artAppToken");
    if (!token) {
      alert("⚠️ يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }
  
    if (editImage) {  
      const formData = new FormData();
      formData.append("image", editImage);
      
      
      const response = await axios.put(
        `${API_BASE}/api/user/${currentUser._id}`,  
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`
          } 
        }
      );
      
      console.log("✅ تم تحديث الصورة:", response.data);
    }
    
    if (isArtist && editBio !== (user.artistProfile?.bio || "")) {
      const bioResponse = await axios.put(
        `${API_BASE}/api/artist/${currentUser.artistProfile._id}/bio`,
        { bio: editBio, userId: currentUser._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ تم تحديث البايو:", bioResponse.data);
    }
    
    setIsEditModalOpen(false);
    
    refreshData();
    const res = await axios.get(`${API_BASE}/api/user/${id}`);
    if (res.data.success) {
      setUser(res.data.user);
    }
    
    alert("✅ تم تحديث البروفايل بنجاح");
    
  } catch (err) {
    console.error("❌ خطأ في التحديث:", err);
    alert("❌ فشل في تحديث البروفايل");
  }
};

  const goToChats = () => {
    navigate("/chat");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image size={32} className="text-pink-400 animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-gray-600 text-lg font-medium">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎨</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">المستخدم غير موجود</h2>
          <p className="text-gray-500 mb-6">عذراً، لم نتمكن من العثور على هذا المستخدم</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-full hover:from-pink-600 hover:to-purple-600 transition-all"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  const profilePicture = imagePreview || (user.profilePicture 
    ? `${API_BASE}${user.profilePicture.startsWith('/') ? '' : '/'}${user.profilePicture}`
    : `https://ui-avatars.com/api/?name=${user.username}&background=d5006d&color=fff&size=128`);

  const getGridCols = () => {
    if (isCurrentUser && isArtist) return 'grid-cols-5';
    if (isCurrentUser && !isArtist) return 'grid-cols-3';
    if (!isCurrentUser && isArtist) return 'grid-cols-3';
    return 'grid-cols-1';
  };

  return (
    <div className="min-h-screen">
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-5 left-10 w-20 h-20 bg-white rounded-full blur-2xl"></div>
            <div className="absolute bottom-5 right-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
          </div>
        </div>
        
        <div className="absolute top-0 left-0 right-0 px-4 pt-6 pb-2 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all hover:scale-110 text-white border border-white/30 group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-md">الصفحة الرئيسية</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCurrentUser && (
                <Link
                  to="/notifications"
                  className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all hover:scale-110 text-white border border-white/30"
                >
                  <Bell size={18} />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 -mt-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* العمود الجانبي */}
          <div className="lg:w-1/3 mt-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 text-center border border-pink-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full blur-2xl opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full blur-2xl opacity-50"></div>
              
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur opacity-20"></div>
                <img
                  src={profilePicture}
                  alt={user.username}
                  className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-xl object-cover relative"
                />
              </div>
              <h1 className="text-2xl font-bold mt-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent font-Chewy">
                {user.username}
              </h1>          
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-pink-50 rounded-full">
                <span className="text-sm">{getUserType()}</span>
                {user.age && <span className="text-xs text-purple-600">• {user.age} سنة</span>}
              </div>
              
              {user.bio && (
                <p className="mt-4 text-gray-600 text-sm leading-relaxed">{user.bio}</p>
              )}
              {isArtist && user.artistProfile?.bio && !user.bio && (
                <p className="mt-4 text-gray-600 text-sm leading-relaxed">{user.artistProfile.bio}</p>
              )}
              
              <div className="mt-6 space-y-3">
                {isCurrentUser && (
                  <button
                    onClick={goToChats}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2.5 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <MessageCircle size={18} />
                    <span>المحادثات</span>
                    {chatUnreadCount > 0 && (
                      <span className="bg-white/20 text-white text-xs rounded-full px-2 py-0.5">
                        {chatUnreadCount}
                      </span>
                    )}
                  </button>
                )}

                {!isCurrentUser && isArtist && (
                  <button
                    onClick={handleFollow}
                    className={`w-full py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isFollowing 
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200" 
                        : "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-md hover:shadow-lg"
                    }`}
                  >
                    {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                    {isFollowing ? "متابَع" : "متابعة الفنان"}
                  </button>
                )}

                {isCurrentUser && (
                  <button
                    onClick={handleOpenEditModal}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2.5 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Edit2 size={18} />
                    <span>تعديل البروفايل</span>
                  </button>
                )}
                
                {isCurrentUser && isArtist && (
                  <button
                    onClick={() => navigate("/add-artwork")}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2.5 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Image size={18} />
                    <span>إضافة عمل فني</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* العمود الرئيسي */}
          <div className="lg:w-2/3">
            {/* التبويبات */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-pink-100 mt-10">
              <div className={`grid ${getGridCols()} gap-4 text-center`}>
                {isArtist && (
                  <div
                    onClick={() => setActiveTab("artworks")}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      activeTab === "artworks" 
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg transform scale-105" 
                        : "bg-white/50 border border-pink-100 hover:bg-pink-50 hover:shadow-md"
                    }`}
                  >
                    <div className={`text-2xl font-bold ${activeTab === "artworks" ? "text-white" : "text-pink-600"}`}>
                      {artworksCount}
                    </div>
                    <div className={`text-sm ${activeTab === "artworks" ? "text-white/90" : "text-gray-500"}`}>أعمال</div>
                  </div>
                )}
                
                <div
                  onClick={() => setActiveTab("following")}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    activeTab === "following" 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105" 
                      : "bg-white/50 border border-pink-100 hover:bg-pink-50 hover:shadow-md"
                  }`}
                >
                  <div className={`text-2xl font-bold ${activeTab === "following" ? "text-white" : "text-blue-600"}`}>
                    {stats.following}
                  </div>
                  <div className={`text-sm ${activeTab === "following" ? "text-white/90" : "text-gray-500"}`}>متابعة</div>
                </div>
                
                {isArtist && (
                  <div
                    onClick={() => setActiveTab("followers")}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      activeTab === "followers" 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105" 
                        : "bg-white/50 border border-pink-100 hover:bg-pink-50 hover:shadow-md"
                    }`}
                  >
                    <div className={`text-2xl font-bold ${activeTab === "followers" ? "text-white" : "text-purple-600"}`}>
                      {stats.followers}
                    </div>
                    <div className={`text-sm ${activeTab === "followers" ? "text-white/90" : "text-gray-500"}`}>متابعين</div>
                  </div>
                )}

                {isCurrentUser && (
                  <div
                    onClick={() => setActiveTab("saved")}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      activeTab === "saved" 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105" 
                        : "bg-white/50 border border-pink-100 hover:bg-pink-50 hover:shadow-md"
                    }`}
                  >
                    <div className={`text-2xl font-bold ${activeTab === "saved" ? "text-white" : "text-green-600"}`}>
                      {stats.saved}
                    </div>
                    <div className={`text-sm ${activeTab === "saved" ? "text-white/90" : "text-gray-500"}`}>محفوظات</div>
                  </div>
                )}
                
                {isCurrentUser && (
                  <div
                    onClick={() => setActiveTab("purchases")}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      activeTab === "purchases" 
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg transform scale-105" 
                        : "bg-white/50 border border-pink-100 hover:bg-pink-50 hover:shadow-md"
                    }`}
                  >
                    <div className={`text-2xl font-bold ${activeTab === "purchases" ? "text-white" : "text-indigo-600"}`}>
                      {stats.purchases}
                    </div>
                    <div className={`text-sm ${activeTab === "purchases" ? "text-white/90" : "text-gray-500"}`}>مشترياتي</div>
                  </div>
                )}
              </div>
            </div>

            {/* محتوى التبويبات */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-pink-100">
              {activeTab === "artworks" && isArtist && (
                <ArtworksTab
                  artistId={user.artistProfile?._id}
                  viewMode="grid"
                  isCurrentUser={isCurrentUser}
                  onDataRefresh={refreshData}
                  onCountChange={setArtworksCount}
                />
              )}
              
              {activeTab === "following" && (
                <FollowingTab
                  userId={id}
                  isCurrentUser={isCurrentUser}
                  onDataRefresh={refreshData}
                />
              )}
              
              {activeTab === "saved" && isCurrentUser && (
                <SavedTab
                  userId={id}
                  viewMode="grid"
                  onDataRefresh={refreshData}
                />
              )}
              
              {activeTab === "followers" && isArtist && (
                <FollowersTab
                  artistId={user.artistProfile?._id}
                  onDataRefresh={refreshData}
                  isCurrentUser={isCurrentUser}
                />
              )}

              {activeTab === "purchases" && isCurrentUser && (
                <PurchasesTab
                  userId={id}
                  viewMode="grid"
                  onDataRefresh={refreshData}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* مودال تعديل البروفايل */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />
          
          <div className="relative w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 bg-white rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Edit2 size={22} />
                  تعديل البروفايل
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-white hover:text-gray-200 text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32 mb-4">
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <label className="absolute bottom-0 right-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-2 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-gray-500 text-sm">اضغط على الكاميرا لتغيير الصورة</p>
              </div>

              {isArtist && (
                <div className="mb-6">
                  <label className="block mb-2 font-medium text-gray-700">نبذة عنك</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows="4"
                    className="w-full border border-gray-200 rounded-xl p-3 text-gray-700 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50"
                    placeholder="اكتب نبذة عن نفسك..."
                  />
                </div>
              )}

              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-md"
                >
                  حفظ التغييرات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* عناصر زخرفية */}
      <div className="fixed bottom-0 left-0 opacity-5 text-9xl pointer-events-none select-none">🎨</div>
      <div className="fixed top-1/3 right-0 opacity-5 text-9xl pointer-events-none select-none transform rotate-12">🖼️</div>
    </div>
  );
};

export default ProfilePage;