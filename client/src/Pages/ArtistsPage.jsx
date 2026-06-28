import { useState, useEffect } from 'react';
import axios from 'axios';
import ArtistCard from '../Components/ArtistCard';
import { useAuth } from '../context/AuthContext';

const ArtistsPage = () => {
  const { currentUser } = useAuth();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const clearSearch = () => setSearchTerm('');

  useEffect(() => {
    if (currentUser) { 
      fetchArtists();
    }
  }, [currentUser]); 

  const fetchArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/api/artist/getArtist');
      
      let fetchedArtists = response.data.data || [];
      
      if (currentUser) {
        fetchedArtists = fetchedArtists.filter(artist => 
          String(artist.user?._id) !== String(currentUser._id) &&
          String(artist._id) !== String(currentUser.artistProfile?._id)
        );
      }
      
      setArtists(fetchedArtists);
    } catch (err) {
      console.error('Error fetching artists:', err);
      setError('فشل في تحميل بيانات الفنانين');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowSuccess = (artistId, data) => {
    setArtists(prev =>
      prev.map(artist =>
        artist._id === artistId
          ? { ...artist, followersCount: data.followersCount }
          : artist
      )
    );
  };

  const filteredArtists = artists.filter(artist =>
    artist.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center">
          {error}
          <button 
            onClick={fetchArtists}
            className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">
          الفنانين المبدعين
          <span className="block w-20 h-1 bg-gradient-to-r from-rose-500 to-pink-500 mx-auto mt-4 rounded-full"></span>
        </h1>
        <p className="text-slate-500 text-lg mt-4">
          اكتشف مواهب فنية رائعة من مختلف أنحاء العالم   
        </p>
      </div>

      <div className="mb-8 max-w-md mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث عن فنان..."
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

      {filteredArtists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtists.map(artist => (
            <ArtistCard
              key={artist._id}
              artist={artist}
              onFollowSuccess={handleFollowSuccess} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-xl">لا يوجد فنانين متطابقين مع بحثك</p>
        </div>
      )}
    </div>
  );
};

export default ArtistsPage;