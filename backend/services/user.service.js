const User = require('../models/User.model');
const Artwork = require('../models/Artwork.model');
const Artist = require('../models/Artist.model')

class UserService {
  
  async getUserById(userId) {
    const user = await User.findById(userId)
      .select('-password -__v')
      .populate({
        path: 'favorites', 
        populate: { path: 'artist', select: 'username profilePicture' }
      })
      .lean();
    return user;
  }
 async updateUserProfile(userId, updateData, file = null) {
    const allowedUpdates = ['name', 'username', 'email', 'profilePicture', 'bio', 'gender', 'age', 'phone'];
    const filteredUpdates = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) filteredUpdates[key] = updateData[key];
    });

    if (file) {
      filteredUpdates.profilePicture = `/uploads/${file.filename}`;
    }
    
    console.log('📝 تحديث المستخدم:', { userId, filteredUpdates });
    
    const updatedUser = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true
    }).select('-password -__v');
    
    return updatedUser;
  }
  async getSavedArtworks(userId) {
    const user = await User.findById(userId)
      .populate({
        path: 'favorites',
        populate: { path: 'artist', select: 'username profilePicture' }
      });
    return user.favorites || [];
  }
  async toggleSaveArtwork(userId, artworkId) {
    const user = await User.findById(userId);

    if (!user) throw new Error('المستخدم غير موجود');

    const isSaved = user.favorites.some(id => id.toString() === artworkId);

    if (isSaved) {
     
      user.favorites.pull(artworkId);
      await Artwork.findByIdAndUpdate(artworkId, { $pull: { savedBy: userId } });
      await user.save();
      return { saved: false };
    } else {
    
      user.favorites.addToSet(artworkId);
      await Artwork.findByIdAndUpdate(artworkId, { $addToSet: { savedBy: userId } });
      await user.save();
      return { saved: true };
    }
  }
  async toggleFollowUser(userId, targetUserId) {
    if (userId === targetUserId) throw new Error('لا يمكنك متابعة نفسك');

    const currentUser = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) throw new Error('المستخدم غير موجود');

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(userId);
      await currentUser.save();
      await targetUser.save();
      return { isFollowing: false };
    } else {
      currentUser.following.addToSet(targetUserId);
      targetUser.followers.addToSet(userId);
      await currentUser.save();
      await targetUser.save();
      return { isFollowing: true };
    }
  }
   async getFollowing(userId) {
    try {
    
      if (!userId || typeof userId !== 'string') {
        throw new Error('ID المستخدم غير صالح');
      }

      const user = await User.findById(userId)
        .select('followingArtists')
        .lean();


      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      if (!user.followingArtists || user.followingArtists.length === 0) {
        return {
          success: true,
          data: {
            followingArtists: [],
            count: 0,
            message: 'لا يوجد فنانين متابعين'
          }
        };
      }

      const artists = await Artist.find({
        _id: { $in: user.followingArtists }
      })
.select('_id')
      .populate('user','username profilePicture') 
      .lean();
console.log(artists);
    
      const minimalArtists = artists.map(artist => ({
        _id: artist._id,
        username: artist.username,
        profilePicture: artist.profilePicture || null 
      }));

      return {
        success: true,
        data: {
          followingArtists: artists,
          count: minimalArtists.length,
          userId: userId
        }
      };
    } catch (error) {
      console.error('❌ خطأ في Service - جلب معلومات محددة للفنانين:', error.message);
      return {
        success: false,
        message: error.message,
        error: error.name
      };
    }
  }
  async getFollowers(userId) {
    try {
     
      if (!userId || typeof userId !== 'string') {
        throw new Error('ID المستخدم غير صالح');
      }

      const artist = await Artist.findById(userId)
      .select('followers')
       .lean();


      if (!artist) {
        throw new Error('المستخدم غير موجود');
      }

    
      if (!artist.followers || artist.followers.length === 0) {
        return {
          success: true,
          data: {
            followers: [],
            count: 0,
            message: 'لا يوجد فنانين متابعين'
          }
        };
      }
      const followers = await User.find({
        _id: { $in: artist.followers }
      })
.select('_id username profilePicture role')
      .lean();
console.log(followers);
  
      const minimalArtists = followers.map(artist => ({
        _id: followers._id,
        username: followers.username,
        profilePicture: followers.profilePicture || null 
      }));

      return {
        success: true,
        data: {
          followersArtists: followers,
          count: minimalArtists.length,
          userId: userId
        }
      };
    } catch (error) {
      console.error('❌ خطأ في Service - جلب معلومات محددة للفنانين:', error.message);
      return {
        success: false,
        message: error.message,
        error: error.name
      };
    }
  }
}
module.exports = new UserService();
