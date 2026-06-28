const User = require('../models/User.model');
const Artist = require('../models/Artist.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const notificationService = require('./notification.service');

class AuthService {

  validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return regex.test(email);
  }

  async registerUser(userData) {
    const { username, email, password, role, gender, age } = userData;

    if (!this.validateEmail(email)) {
      throw new Error('البريد الإلكتروني يجب أن يكون @gmail.com فقط');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      gender,
      age
    });

    await user.save();

    if (role === 'artist') {
      const artist = new Artist({
        user: user._id,
        bio: '',
        socialMedia: {}
      });
      await artist.save();
      user.artistProfile = artist._id;
      await user.save();
    }

    await notificationService.createAdminNotification({
      type: 'new_user',
      title: '👤 مستخدم جديد',
      message: `"${user.username}" انضم إلى المنصة`,
      relatedId: user._id,
      relatedModel: 'User'
    });

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        artistProfile: user.artistProfile
      }
    };
  }

  async loginUser(email, password) {
    if (!this.validateEmail(email)) {
      throw new Error('صيغة البريد الإلكتروني غير صحيحة');
    }

    const user = await User.findOne({ email })
      .populate({
        path: 'artistProfile',
        select: 'bio website socialMedia'
      });
      
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        artistProfile: user.artistProfile
      }
    };
  }

  async getMeLogic(userId) {
    const user = await User.findById(userId)
      .select('-password')
      .populate({
        path: 'artistProfile',
        select: '_id bio website profileImage socialMedia artworks followers following',
        populate: [
          {
            path: 'artworks',
            select: '_id title image description likes views createdAt category price comments rating artist imageUrl',
            populate: [
              {
                path: 'artist',
                select: '_id username profileImage'
              },
              {
                path: 'likes',
                select: '_id username'
              },
              {
                path: 'comments',
                select: '_id text user createdAt',
                populate: {
                  path: 'user',
                  select: '_id username profilePicture'
                }
              }
            ]
          },
          {
            path: 'followers',
            select: '_id username profilePicture email'
          },
          {
            path: 'following',
            select: '_id username profilePicture email'
          }
        ]
      })
      .populate('followingArtists', '_id username profilePicture email');

    if (!user) {
      throw new Error('User not found');
    }

    if (user.artistProfile && user.artistProfile.artworks) {
      user.artistProfile.artworks.forEach(artwork => {
        artwork.likesCount = artwork.likes?.length || 0;
        artwork.commentsCount = artwork.comments?.length || 0;
      });
      
      user.artistProfile.followersCount = user.artistProfile.followers?.length || 0;
      user.artistProfile.followingCount = user.artistProfile.following?.length || 0;
    }

    return user;
  }

  generateToken(user) {
    return jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }
}

module.exports = new AuthService();