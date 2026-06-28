import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const FeaturedArtists = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopArtists();
  }, []);
  const fetchTopArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:5000/api/artist/getArtist');
      const allArtists = response.data.data || [];
      
      const sortedArtists = allArtists
        .filter(artist => artist.user)
        .map(artist => ({
          ...artist,
          followersCount: artist.followersCount || 
                         artist.artistProfile?.followersCount || 
                         artist.followers?.length || 
                         0
        }))
        .sort((a, b) => b.followersCount - a.followersCount);
      
      const topArtists = sortedArtists.slice(0, 3);
      setArtists(topArtists);
    } catch (err) {
      console.error('❌ Error fetching artists:', err);
      setError('فشل في تحميل بيانات الفنانين');
    } finally {
      setLoading(false);
    }
  };
  const handleFollow = async (artist, e) => {
    if (e) e.stopPropagation();
    
    if (!currentUser) {
      alert('⚠️ يجب تسجيل الدخول أولاً');
      return;
    }

    const artistUserId = artist.user?._id || artist._id;
    if (String(artistUserId) === String(currentUser._id)) {
      alert('⚠️ لا يمكنك متابعة نفسك');
      return;
    }

    const token = localStorage.getItem("artAppToken");
    if (!token) {
      alert('⚠️ يجب تسجيل الدخول أولاً');
      return;
    }

    const wasFollowing = artist.followers?.some(f => 
      String(f._id || f) === String(currentUser._id)
    );
    const newFollowersCount = wasFollowing 
      ? (artist.followersCount || 0) - 1 
      : (artist.followersCount || 0) + 1;

    setArtists(prevArtists => 
      prevArtists.map(a => 
        a._id === artist._id 
          ? { 
              ...a, 
              followersCount: newFollowersCount,
              followers: wasFollowing 
                ? (a.followers || []).filter(f => String(f._id || f) !== String(currentUser._id))
                : [...(a.followers || []), currentUser._id]
            } 
          : a
      )
    );

    try {
      const response = await axios.post(
        `http://localhost:5000/api/artist/${artist._id}/follow`,
        {},
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.success) {
        if (response.data.data?.followersCount !== undefined) {
          setArtists(prevArtists => 
            prevArtists.map(a => 
              a._id === artist._id 
                ? { 
                    ...a, 
                    followersCount: response.data.data.followersCount,
                    followers: response.data.data.followers || a.followers
                  } 
                : a
            )
          );
        }
      }
    } catch (err) {
      console.error('❌ Error following artist:', err);
      
      setArtists(prevArtists => 
        prevArtists.map(a => 
          a._id === artist._id 
            ? { 
                ...a, 
                followersCount: artist.followersCount,
                followers: artist.followers
              } 
            : a
        )
      );
      
      alert('❌ حدث خطأ في المتابعة، حاول مرة أخرى');
    }
  };
  const goToArtistProfile = (artist) => {
  
    const userId = artist.user?._id;
    
    if (!userId) {
      console.error('❌ لا يمكن العثور على ID المستخدم للفنان:', artist);
      alert('⚠️ لا يمكن فتح صفحة الفنان');
      return;
    }
    
    navigate(`/profile/${userId}`);
  };
  const getProfileImageUrl = (artist) => {
    if (!artist) return null;
    
    const profileImage = artist.user?.profilePicture || 
                        artist.user?.profileImage || 
                        artist.profilePicture ||
                        artist.artistProfile?.imageUrl;
    
    if (!profileImage) return null;
    
    if (profileImage.startsWith('/uploads')) {
      return `http://localhost:5000${profileImage}`;
    }
    
    return profileImage;
  };
  const isFollowingArtist = (artist) => {
    if (!currentUser) return false;
    
    return artist.followers?.some(follower => {
      const followerId = typeof follower === 'object' ? follower._id || follower.id : follower;
      return String(followerId) === String(currentUser._id);
    }) || false;
  };
  return (
    <section className="py-16 bg-gradient-to-b from-[#f8f9fa] to-white">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12 text-[#333]"
        >
          الفنانين الأكثر متابعة
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {artists.map((artist) => {
            const profileImageUrl = getProfileImageUrl(artist);
            const username = artist.user?.username || artist.username || "فنان";
            const category = artist.category || artist.artistProfile?.category || "";
            const followersCount = artist.followersCount || 0;
            const isFollowing = isFollowingArtist(artist);
            const isCurrentUser = currentUser && 
              String(artist.user?._id) === String(currentUser._id);
            
            return (
              <motion.div
                key={artist._id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => goToArtistProfile(artist)} 
              >
                <div className="relative">
                  <div className="relative h-72">
                    {profileImageUrl ? (
                      <div className="w-full h-full overflow-hidden rounded-t-xl">
                        <img 
                          src={profileImageUrl} 
                          alt={username}
                          className="w-full h-full object-cover object-center"
                          style={{ objectPosition: 'center' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.classList.add('bg-gradient-to-br', 'from-pink-100', 'to-purple-100');
                            e.target.parentNode.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center">
                                <div class="w-32 h-32 rounded-full bg-gradient-to-r from-[#d5006d] to-pink-500 flex items-center justify-center">
                                  <span class="text-white text-4xl font-bold">${username.charAt(0)}</span>
                                </div>
                              </div>
                            `;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-[#d5006d] to-pink-500 flex items-center justify-center">
                          <span className="text-white text-4xl font-bold">{username.charAt(0)}</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-2xl font-bold drop-shadow-lg">{username}</h3>
                      {category && (
                        <p className="text-sm mt-1 drop-shadow">{category}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span className="text-gray-600 font-semibold">
                      {followersCount.toLocaleString()} متابع
                    </span>
                  </div>
                  
                  {!isCurrentUser && currentUser ? (
                    <button 
                      onClick={(e) => handleFollow(artist, e)}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                        isFollowing
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                          : 'bg-[#d5006d] text-white hover:bg-[#b0005a]'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          متابَع
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          متابعة
                        </>
                      )}
                    </button>
                  ) : !currentUser ? (
                    <Link 
                      to="/login"
                      className="px-4 py-2 bg-[#d5006d] text-white rounded-lg hover:bg-[#b0005a] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      تسجيل الدخول للمتابعة
                    </Link>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link 
            to="/artists"
            className="inline-block px-6 py-3 bg-[#d5006d] text-white rounded-lg hover:bg-[#b0005a] transition-colors"
          >
            عرض جميع الفنانين
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedArtists;