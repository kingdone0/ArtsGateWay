import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Calendar, User, DollarSign } from 'react-feather';

const API_BASE = "http://localhost:5000";

const PurchasesTab = ({ userId, viewMode = "grid", onDataRefresh }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, [userId, onDataRefresh]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('artAppToken');
 
      const response = await axios.get(`${API_BASE}/api/artworks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📊 كل الأعمال:', response.data.data);
      console.log('👤 userId:', userId);
      
const userPurchases = response.data.data.filter(artwork => {
    const ownerId = artwork.owner?._id || artwork.owner;
    const ownerUserId = artwork.owner?.user?._id || artwork.owner?.user;
    
    const isOwner = 
        String(ownerId) === String(userId) ||
        String(ownerUserId) === String(userId) ||
        String(artwork.owner) === String(userId);
    
    if (isOwner) {
        console.log(`✅ العمل "${artwork.title}" مملوك للمستخدم`, { ownerId, userId });
    }
    
    return isOwner;
});
      
      console.log('✅ المشتريات التي تم العثور عليها:', userPurchases.length);
      setPurchases(userPurchases);
      
    } catch (error) {
      console.error('❌ خطأ في جلب المشتريات:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-bold text-gray-700 mb-1">لا توجد مشتريات بعد</h3>
        <p className="text-gray-500 text-sm">الأعمال التي تشتريها ستظهر هنا</p>
        <Link 
          to="/explore" 
          className="inline-block mt-4 bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700 transition"
        >
          استكشف الأعمال
        </Link>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {purchases.map((artwork) => (
          <Link 
            key={artwork._id} 
            to={`/artwork/${artwork._id}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group"
          >
            <div className="relative h-40 overflow-hidden">
              <img 
                src={`${API_BASE}${artwork.imageUrl}`}
                alt={artwork.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                onError={(e) => e.target.src = '/default-artwork.jpg'}
              />
              {artwork.soldAt && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {new Date(artwork.soldAt).toLocaleDateString('ar-EG')}
                </div>
              )}
            </div>
            
            <div className="p-3">
              <h3 className="font-bold text-gray-800 mb-1 truncate">{artwork.title}</h3>
              
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <User size={12} />
                <span className="truncate">{artwork.artist?.name || artwork.artist?.username || 'فنان'}</span>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-green-600 font-bold text-sm">
                  <DollarSign size={14} />
                  <span>{artwork.price} ETH</span>
                </div>
                <span className="text-xs text-gray-400">
                  <Calendar size={10} className="inline ml-1" />
                  {new Date(artwork.soldAt || artwork.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {purchases.map((artwork) => (
        <Link 
          key={artwork._id} 
          to={`/artwork/${artwork._id}`}
          className="flex bg-white rounded-lg shadow p-3 hover:shadow-md transition"
        >
          <img 
            src={`${API_BASE}${artwork.imageUrl}`}
            alt={artwork.title}
            className="w-20 h-20 object-cover rounded-lg"
            onError={(e) => e.target.src = '/default-artwork.jpg'}
          />
          <div className="mr-3 flex-1">
            <h3 className="font-bold text-gray-800">{artwork.title}</h3>
            <p className="text-sm text-gray-600">{artwork.artist?.name || artwork.artist?.username || 'فنان'}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-green-600 font-bold">{artwork.price} ETH</span>
              <span className="text-xs text-gray-400">
                {new Date(artwork.soldAt || artwork.createdAt).toLocaleDateString('ar-EG')}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default PurchasesTab;