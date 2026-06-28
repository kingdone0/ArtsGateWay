import React, { useState, useEffect } from "react";
import axios from "axios";
import { Heart, Grid, List } from "react-feather";
import { useNavigate } from "react-router-dom";
import ArtworkCard from "./ArtworkCard"; 

const API_BASE = "http://localhost:5000";

const Favorites = ({ viewMode, setViewMode, onDataRefresh, isCurrentUser = true }) => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSaved = async () => {
      const token = localStorage.getItem("artAppToken");
      try {
        const res = await axios.get(`${API_BASE}/api/user/saved-artworks`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setSaved(res.data.savedArtworks || []);
        }
      } catch (error) {
        console.error("❌ خطأ في جلب المحفوظات:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, []);
  const handleRemoveFavorite = async (artworkId) => {
    if (!window.confirm("هل تريد إزالة هذا العمل من المفضلة؟")) return;

    const token = localStorage.getItem("artAppToken");
    try {
      await axios.post(
        `${API_BASE}/api/user/artworks/${artworkId}/save`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSaved((prev) => prev.filter((a) => a._id !== artworkId));
      if (onDataRefresh) onDataRefresh();
    } catch (error) {
      console.error("❌ خطأ في إزالة المفضلة:", error);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-b-2 border-pink-600 rounded-full" />
      </div>
    );
  }
  if (saved.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Heart size={56} className="mx-auto mb-4 text-gray-300" />
        لا توجد أعمال محفوظة
      </div>
    );
  }
  const handleLike = (id) => {
   
    if (onDataRefresh) setTimeout(onDataRefresh, 500);
  };
  const handleSave = (id, isSaved) => {
    
    handleRemoveFavorite(id);
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">الأعمال المحفوظة ({saved.length})</h2>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow text-pink-600" : ""}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow text-pink-600" : ""}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {saved.map((artwork) => (
          <ArtworkCard
            key={artwork._id}
            artwork={artwork}
            viewMode={viewMode}
            isCurrentUser={isCurrentUser}
            onLike={handleLike}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  );
};

export default Favorites;
