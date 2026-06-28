import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

const FollowersTab = ({ artistId }) => {
  const [artistFollowers, setArtistFollowers] = useState([]);
  const [userFollowers, setUserFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!artistId) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API_BASE}/api/user/${artistId}/followers-artists`
        );

        if (res.data?.success) {
          const followers = res.data.followersArtists || [];

          const artists = followers.filter(f => f.role === "artist");
          const users = followers.filter(f => f.role !== "artist");

          setArtistFollowers(artists);
          setUserFollowers(users);
        }
      } catch (err) {
        console.error("❌ خطأ جلب المتابعين", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [artistId]);

  const getProfileImage = (profilePicture, username) => {
    if (profilePicture) {
      if (profilePicture.startsWith("http")) return profilePicture;
      return `${API_BASE}${profilePicture}`;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      username || "User"
    )}&background=ddd&color=555`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-pink-600" />
      </div>
    );
  }

  if (artistFollowers.length === 0 && userFollowers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        لا يوجد متابعين
      </div>
    );
  }

  const renderFollowers = (list) =>
    list.map((user) => (
      <div
        key={user._id}
        className="flex items-center justify-between p-4 border rounded-xl bg-white"
      >
        <div className="flex items-center gap-4">
          <img
            src={getProfileImage(user.profilePicture, user.username)}
            alt={user.username}
            className="w-12 h-12 rounded-full object-cover border"
          />
          <div>
            <p className="font-semibold">{user.username}</p>
            <p className="text-xs text-gray-500">
              {user.role === "artist" ? "فنان" : "مشاهد"}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (user.role === "artist") {
              navigate(`/profile/${user._id}`);
            } else {
              navigate(`/profile/${user._id}`);
            }
          }}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          عرض الملف
        </button>
      </div>
    ));

 return (
  <div className="space-y-8">
    
    {artistFollowers.length > 0 && (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-8 bg-purple-500 rounded"></div>
          <h2 className="text-lg font-bold text-purple-700">
             فنانين متابعين ({artistFollowers.length})
          </h2>
        </div>
        <div className="space-y-3">{renderFollowers(artistFollowers)}</div>
      </div>
    )}

  
    {userFollowers.length > 0 && (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-8 bg-blue-500 rounded"></div>
          <h2 className="text-lg font-bold text-blue-700">
             مشاهدين متابعين ({userFollowers.length})
          </h2>
        </div>
        <div className="space-y-3">{renderFollowers(userFollowers)}</div>
      </div>
    )}
  </div>
);
};

export default FollowersTab;
