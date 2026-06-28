import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart } from 'react-feather';

const LatestArtworks = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredArtwork, setHoveredArtwork] = useState(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    fetchTopArtworks();
  }, []);
  const fetchTopArtworks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:5000/api/artworks');
      
      console.log('🎨 الأعمال الفنية من الـAPI:', response.data);
      
      const artworksData = response.data.data || response.data.artworks || response.data || [];

      const sortedArtworks = artworksData
        .filter(artwork => artwork && (artwork._id || artwork.id))
        .map(artwork => ({
          ...artwork,
          id: artwork._id || artwork.id,
          title: artwork.title || "عمل فني",
          likesCount: artwork.likesCount || 
                     artwork.likes?.length || 
                     0,

          artistName: artwork.artist?.username || 
                    artwork.user?.username || 
                    artwork.artistName || 
                    "فنان",
          imageUrl: artwork.imageUrl || 
                   artwork.image || 
                   artwork.artworkImage || 
                   null
        }))
        .sort((a, b) => b.likesCount - a.likesCount) 
        .slice(0, 3);
      
      console.log('🏆 الأعمال الأكثر إعجاباً:', sortedArtworks);
      setArtworks(sortedArtworks);
    } catch (err) {
      console.error('❌ Error fetching artworks:', err);
      setError('فشل في تحميل الأعمال الفنية');
    } finally {
      setLoading(false);
    }
  };
  const handleLike = async (artworkId, e) => {
    e.stopPropagation(); 
    
    try {
      const token = localStorage.getItem("artAppToken");
      if (!token) {
        alert('⚠️ يجب تسجيل الدخول أولاً');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/artworks/${artworkId}/like`,
        {},
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.success) {
  
        setArtworks(prevArtworks => {
          const updatedArtworks = prevArtworks.map(artwork =>
            artwork.id === artworkId
              ? {
                  ...artwork,
                  likesCount: response.data.data?.likesCount || artwork.likesCount + 1
                }
              : artwork
          );
          
      
          return updatedArtworks.sort((a, b) => b.likesCount - a.likesCount);
        });
      }
    } catch (err) {
      console.error('❌ Error liking artwork:', err);
      alert('❌ حدث خطأ في الإعجاب، حاول مرة أخرى');
    }
  };
  const getArtworkImageUrl = (artwork) => {
    if (!artwork || !artwork.imageUrl) return null;
    
    const imageUrl = artwork.imageUrl;
    if (imageUrl.startsWith('/uploads') || imageUrl.startsWith('/')) {
      return `http://localhost:5000${imageUrl}`;
    }
    
    return imageUrl;
  };
  const goToArtworkPage = (artworkId) => {
    navigate(`/artwork/${artworkId}`);
  };
  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d5006d] mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الأعمال الأكثر إعجاباً...</p>
        </div>
      </section>
    );
  }
  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
            {error}
            <button 
              onClick={fetchTopArtworks}
              className="mt-2 block mx-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </section>
    );
  }
  if (artworks.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg mb-4">لا توجد أعمال فنية حالياً</p>
          <Link 
            to="/explore"
            className="inline-block px-6 py-3 bg-[#d5006d] text-white rounded-lg hover:bg-[#b0005a] transition-colors"
          >
            تصفح الأعمال الفنية
          </Link>
        </div>
      </section>
    );
  }
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12 text-[#333]"
        >
          الأعمال الأكثر إعجاباً
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {artworks.map((artwork) => {
            const imageUrl = getArtworkImageUrl(artwork);
            const isHovered = hoveredArtwork === artwork.id;
            
            return (
              <motion.div
                key={artwork.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                onMouseEnter={() => setHoveredArtwork(artwork.id)}
                onMouseLeave={() => setHoveredArtwork(null)}
                className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => goToArtworkPage(artwork.id)} 
              >
             
                {imageUrl ? (
                  <div className="relative w-full h-64 overflow-hidden">
                   {imageUrl ? (
  <div className="relative w-full h-64 overflow-hidden">
   {imageUrl ? (
  <div className="relative w-full h-80 overflow-hidden"> 
    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
      <img 
        src={imageUrl} 
        alt={artwork.title}
        className="w-full h-full object-cover object-center" 
        style={{ 
          maxHeight: '320px',
          objectPosition: 'center'
        }}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <div class="w-20 h-20 mb-4 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span class="text-sm font-medium">${artwork.title}</span>
            </div>
          `;
        }}
      />
    </div>
  </div>
) : (
  <div className="w-full h-80 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center">
    <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
    <span className="text-gray-400 text-sm font-medium">{artwork.title}</span>
  </div>
)}
  </div>
) : (
  <div className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <span className="text-gray-400 text-sm">{artwork.title}</span>
  </div>
)}
                  </div>
                ) : (
                  <div 
                    className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => goToArtworkPage(artwork.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-400 text-sm">{artwork.title}</span>
                  </div>
                )}
                
              
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
            
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-bold mb-1">{artwork.title}</h3>
                  
              
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <button 
                        onClick={(e) => handleLike(artwork.id, e)}
                        className="flex items-center space-x-1 space-x-reverse hover:text-pink-300 transition-colors bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full"
                      >
                        <Heart size={18} className={artwork.isLiked ? "fill-current" : ""} />
                        <span className="text-sm font-bold">{artwork.likesCount}</span>
                      </button>
                    </div>
                  
                  </div>
                </div>
         
                {isHovered && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
                  />
                )}
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
            to="/explore"
            className="inline-block px-6 py-3 bg-[#d5006d] text-white rounded-lg hover:bg-[#b0005a] transition-colors"
          >
            عرض جميع الأعمال
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default LatestArtworks;