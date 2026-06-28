import React, { useState, useEffect } from 'react';
import { Grid, List } from 'react-feather';
import ArtworkCard from './ArtworkCard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = "http://localhost:5000";

const ArtworksTab = ({ artistId, viewMode, setViewMode, isCurrentUser = false, onDataRefresh, onCountChange }) => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtworks = async () => {
      if (!artistId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);

        const response = await axios.get(`${API_BASE}/api/artworks`);
  
        const artistArtworks = response.data.data.filter(
          artwork => 
            artwork.artist?._id === artistId && 
            artwork.owner?._id === artistId
        );
        
        setArtworks(artistArtworks);
   
        if (onCountChange) {
          onCountChange(artistArtworks.length);
        }
        
      } catch (error) {
        console.error('❌ خطأ في جلب الأعمال:', error);
        setArtworks([]);
        if (onCountChange) onCountChange(0);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [artistId, onDataRefresh, onCountChange]);

  const isValidArtwork = (artwork) => {
    return artwork && (artwork._id || artwork.id);
  };

  const validArtworks = artworks.filter(isValidArtwork);
  const artworksCount = validArtworks.length;

  const handleLike = async (artworkId) => {
    if (onDataRefresh) {
      setTimeout(() => {
        onDataRefresh();
      }, 500);
    }
  };

  const handleSave = async (artworkId, isSaved) => {
    if (onDataRefresh) {
      setTimeout(() => {
        onDataRefresh();
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-xl font-bold text-gray-800">الأعمال الفنية</h3>
          {artworksCount > 0 && (
            <span className="mr-3 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {artworksCount}
            </span>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode && setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#d5006d] text-white' : 'bg-gray-100'}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode && setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#d5006d] text-white' : 'bg-gray-100'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      
      {artworksCount > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {validArtworks.map(artwork => (
            <ArtworkCard 
              key={artwork._id || artwork.id} 
              artwork={artwork} 
              viewMode={viewMode}
              isCurrentUser={isCurrentUser}
              onLike={handleLike}
              onSave={handleSave}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            {isCurrentUser ? 'ليس لديك أعمال فنية بعد' : 'لا يوجد أعمال فنية'}
          </h3>
          <p className="text-gray-500">
            {isCurrentUser 
              ? 'ابدأ بنشر أول عمل فني لك ومشاركته مع العالم'
              : 'هذا الفنان لم ينشر أي أعمال فنية بعد'
            }
          </p>
          {isCurrentUser && (
            <button 
              onClick={() => navigate('/add-artwork')}
              className="mt-4 px-6 py-2 bg-[#d5006d] text-white rounded-lg hover:bg-[#b0005a] transition"
            >
              إضافة عمل فني
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtworksTab;