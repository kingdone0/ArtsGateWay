const User = require('../models/User.model');
const Artist = require('../models/Artist.model');
const userService= require('../services/user.service')

exports.getFollowing= async (req, res) => {
    try {
      const { userId } = req.params;
    

      // التحقق من وجود userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'معرف المستخدم مطلوب'
        });
      }

      let result;

     
        result = await userService.getFollowing(userId);
      

      // التحقق من نجاح العملية
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }

      // إرجاع النتيجة الناجحة
      return res.status(200).json({
        success: true,
        ...result.data
      });
    } catch (error) {
      console.error('❌ خطأ في Controller - جلب معلومات محددة:', error);
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ في السيرفر',
        error: error.message
      });
    }
};
exports.getFollowers= async (req, res) => {
    try {
      const { userId } = req.params;
    

      // التحقق من وجود userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'معرف المستخدم مطلوب'
        });
      }

      let result;

     
        result = await userService.getFollowers(userId);
      

      // التحقق من نجاح العملية
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }

      // إرجاع النتيجة الناجحة
      return res.status(200).json({
        success: true,
        ...result.data
      });
    } catch (error) {
      console.error('❌ خطأ في Controller - جلب معلومات محددة:', error);
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ في السيرفر',
        error: error.message
      });
    }
};
exports.toggleFollow = async (req, res) => {
  try {
    const { targetId, targetType } = req.params; // targetType: 'user' أو 'artist'
    const currentUserId = req.user.id;

    if (targetId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "لا يمكنك متابعة نفسك"
      });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود"
      });
    }

    if (targetType === 'user') {
      // متابعة مستخدم ← مستخدم
      const targetUser = await User.findById(targetId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "المستخدم المستهدف غير موجود"
        });
      }

      const isFollowing = currentUser.followingUsers?.includes(targetId);

      if (isFollowing) {
        // إلغاء المتابعة
        await User.findByIdAndUpdate(currentUserId, {
          $pull: { followingUsers: targetId }
        });
        await User.findByIdAndUpdate(targetId, {
          $pull: { userFollowers: currentUserId }
        });
      } else {
        // متابعة
        await User.findByIdAndUpdate(currentUserId, {
          $addToSet: { followingUsers: targetId }
        });
        await User.findByIdAndUpdate(targetId, {
          $addToSet: { userFollowers: currentUserId }
        });
      }

      // جلب الإحصائيات المحدثة
      const updatedCurrent = await User.findById(currentUserId);
      const updatedTarget = await User.findById(targetId);

      return res.json({
        success: true,
        isFollowing: !isFollowing,
        message: isFollowing ? "تم إلغاء المتابعة" : "تمت المتابعة",
        stats: {
          currentUserFollowingCount: updatedCurrent.followingUsers?.length || 0,
          targetUserFollowersCount: updatedTarget.userFollowers?.length || 0
        }
      });

    } else if (targetType === 'artist') {
      // متابعة مستخدم ← فنان
      const targetArtist = await Artist.findById(targetId);
      if (!targetArtist) {
        return res.status(404).json({
          success: false,
          message: "الفنان غير موجود"
        });
      }

      const isFollowing = currentUser.followingArtists?.includes(targetId);
      const isFollower = targetArtist.followers?.includes(currentUserId);

      if (isFollowing) {
        // إلغاء المتابعة
        await User.findByIdAndUpdate(currentUserId, {
          $pull: { followingArtists: targetId }
        });
        await Artist.findByIdAndUpdate(targetId, {
          $pull: { followers: currentUserId }
        });
      } else {
        // متابعة
        await User.findByIdAndUpdate(currentUserId, {
          $addToSet: { followingArtists: targetId }
        });
        await Artist.findByIdAndUpdate(targetId, {
          $addToSet: { followers: currentUserId }
        });
      }

      // جلب الإحصائيات المحدثة
      const updatedCurrent = await User.findById(currentUserId);
      const updatedArtist = await Artist.findById(targetId);

      return res.json({
        success: true,
        isFollowing: !isFollowing,
        message: isFollowing ? "تم إلغاء المتابعة" : "تمت المتابعة",
        stats: {
          currentUserFollowingArtistsCount: updatedCurrent.followingArtists?.length || 0,
          artistFollowersCount: updatedArtist.followers?.length || 0
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "نوع المتابعة غير صحيح"
      });
    }

  } catch (error) {
    console.error('❌ Error in toggleFollow:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في الخادم: " + error.message
    });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // التحقق من صحة الـ ID
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم غير صالح'
      });
    }
    
    // البحث عن المستخدم
    const user = await User.findById(userId)
      .select('-password') // استبعاد الباسوورد
      .select('-__v') // استبعاد الحقول الإضافية
      .populate({path:'artistProfile',
        populate:{path:'artworks'}}
      ) 
      .lean(); // تحويل إلى كائن JavaScript عادي
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    res.status(200).json({
      success: true,
      user: user
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // التحقق من صلاحية المستخدم
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بتعديل هذا المستخدم'
      });
    }
    
    // ✅ إذا كان هناك ملف مرفوع، أضف مساره إلى updates
    if (req.file) {
      updates.profilePicture = `/uploads/${req.file.filename}`;
    }
    
    // استدعاء service
    const updatedUser = await userService.updateUserProfile(userId, updates);
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم: ' + error.message
    });
  }
};
exports.toggleSaveArtwork = async (req, res) => {
  try {
    const artworkId = req.params.id;
    const userId = req.user.id;

    console.log('🎯 Toggle save artwork (to favorites):', { 
      artworkId, 
      userId 
    });

    // 🔵 جلب المستخدم
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // 🔵 التحقق إذا كان العمل في favorites
    const isFavorite = user.favorites?.some(
      id => id.toString() === artworkId
    ) || false;

    console.log('📌 Current favorite status:', { isFavorite });

    if (isFavorite) {
      // 🔵 إزالة من favorites
      await User.findByIdAndUpdate(userId, {
        $pull: { favorites: artworkId }
      });

      // 🔵 إزالة من savedBy في الـ Artwork (إذا كان موجوداً)
      try {
        await Artwork.findByIdAndUpdate(artworkId, {
          $pull: { savedBy: userId }
        });
      } catch (artworkError) {
        console.log('Note: Artwork savedBy field might not exist:', artworkError.message);
      }

      console.log('✅ Artwork removed from favorites');

      return res.json({
        success: true,
        saved: false,
        isFavorite: false,
        message: "تم إزالة العمل من المفضلة"
      });
    } else {
      // 🔵 إضافة إلى favorites
      await User.findByIdAndUpdate(userId, {
        $addToSet: { favorites: artworkId }
      });

      // 🔵 إضافة إلى savedBy في الـ Artwork
      try {
        await Artwork.findByIdAndUpdate(artworkId, {
          $addToSet: { savedBy: userId }
        });
      } catch (artworkError) {
        console.log('Note: Artwork savedBy field might not exist:', artworkError.message);
      }

      console.log('✅ Artwork added to favorites');

      res.json({
        success: true,
        saved: true,
        isFavorite: true,
        message: "تم إضافة العمل إلى المفضلة"
      });
    }

  } catch (error) {
    console.error('❌ Error in toggleSaveArtwork:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
exports.getSavedArtworks = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('🎯 Fetching favorite artworks for user:', userId);

    const user = await User.findById(userId)
      .populate({
        path: "favorites",  // 🔵 استخدام favorites هنا
        populate: {
          path: "artist",
          select: "username profilePicture"
        }
      })
      .select('favorites');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    console.log(`✅ Found ${user.favorites?.length || 0} favorite artworks`);

    res.json({
      success: true,
      savedArtworks: user.favorites || []  // 🔵 إرجاع favorites
    });
    
  } catch (error) {
    console.error('❌ Error fetching favorite artworks:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
};
