import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ArtworkCard from '../Components/ArtworkCard';

const Explore = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); 
  
  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('http://localhost:5000/api/artworks');
        
        console.log('🎨 جميع الأعمال:', response.data);
        
        let artworksData = response.data.data || response.data.artworks || response.data || [];
        
        
        const availableArtworks = artworksData.filter(artwork => {
         
          const isSold = 
            artwork.soldAt ||                                         
            (artwork.owner && artwork.artist && 
             String(artwork.owner._id || artwork.owner) !== String(artwork.artist._id || artwork.artist)); 
          
      
          if (isSold) {
            console.log(`🔴 إخفاء العمل "${artwork.title}" - تم بيعه`);
          } else {
            console.log(`🟢 عرض العمل "${artwork.title}" - متاح`);
          }
          
          return !isSold; 
        });
        
        console.log(`✅ الأعمال المتاحة: ${availableArtworks.length}`);
        console.log(`🔴 الأعمال المباعة (مخفية): ${artworksData.length - availableArtworks.length}`);
        
        setArtworks(availableArtworks);
      } catch (error) {
        console.error("Error fetching artworks:", error);
        setError('تعذر تحميل الأعمال الفنية. يرجى المحاولة لاحقاً');
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, []); 
  
  const filteredArtworks = searchTerm 
    ? artworks.filter(artwork => 
        artwork.title && artwork.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : artworks;
    
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
   <div className="container mx-auto px-4 py-8">
  <div className="text-center mb-8">
    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">
      استكشف الأعمال الفنية
      <span className="block w-20 h-1 bg-gradient-to-r from-rose-500 to-pink-500 mx-auto mt-4 rounded-full"></span>
    </h1>
    <p className="text-slate-500 text-lg mt-4">
      اكتشف أعمالاً فنية مبدعة واستلهم من إبداعات الفنانين
    </p>
  </div>
    {/* شريط البحث */}
<div className="mb-12 max-w-xl mx-auto">
  <div className="relative">
    <input
      type="text"
      placeholder="ابحث عن عمل فني..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full px-6 py-4 pr-14 bg-white border border-rose-200 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent shadow-md text-base"
    />
    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 flex items-center">
      {searchTerm ? (
        <button
          onClick={clearSearch}
          className="text-gray-400 hover:text-rose-500 transition-colors p-1"
          title="مسح البحث"
        >
          ✕
        </button>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )}
    </div>
  </div>
</div>

      {/* حالة التحميل */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d5006d]"></div>
          <p className="ml-4 text-gray-600">جاري تحميل الأعمال الفنية...</p>
        </div>
      )}

      {/* حالة الخطأ */}
      {error && (
        <div className="text-center py-10">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#d5006d] text-white rounded-lg hover:bg-[#b0005a] transition-colors"
          >
            حاول مرة أخرى
          </button>
        </div>
      )}

      {/* حالة عدم وجود أعمال فنية */}
      {!loading && !error && artworks.length === 0 && (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg mb-4">لا توجد أعمال فنية متاحة حالياً</p>
        </div>
      )}

      {/* حالة عدم وجود نتائج بحث */}
      {!loading && !error && artworks.length > 0 && searchTerm && filteredArtworks.length === 0 && (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg mb-4">لا توجد أعمال تطابق بحثك "{searchTerm}"</p>
          <button 
            onClick={clearSearch}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            عرض جميع الأعمال
          </button>
        </div>
      )}

      {/* عرض الأعمال الفنية */}
      {!loading && !error && filteredArtworks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtworks.map(artwork => (
            <ArtworkCard 
              key={artwork._id || artwork.id} 
              artwork={artwork}
              viewMode="grid"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;