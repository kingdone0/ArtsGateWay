import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";

const FollowingTab = ({ userId }) => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowingArtists();
  }, [userId]);

  const fetchFollowingArtists = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/api/user/${userId}/following-artists`
      );

      if (res.data.success) {
        setArtists(res.data.followingArtists || []);
      }
    } catch (err) {
      console.error("❌ error fetching following artists", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>جاري التحميل...</p>;

  if (artists.length === 0)
    return <p className="text-center">لا تتابع أي فنان</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {artists.map((artistProfile) => {
        const artistUser = artistProfile.user; 

        return (
          <div
            key={artistProfile._id}
            className="border rounded-xl p-4 flex items-center gap-4"
          >
            <img
              src={
                artistUser.profilePicture
                  ? `${API_BASE}${artistUser.profilePicture}`
                  : `https://ui-avatars.com/api/?name=${artistUser.username}`
              }
              className="w-14 h-14 rounded-full object-cover"
            />

            <div className="flex-1">
              <h3 className="font-bold">{artistUser.username}</h3>
              <p className="text-sm text-gray-500">🎨 فنان</p>
            </div>
            <Link
              to={`/profile/${artistUser._id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              عرض الملف
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default FollowingTab;
