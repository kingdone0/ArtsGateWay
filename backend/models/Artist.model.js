const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  bio: String,
  profileImage:String,
  website: String,
  socialMedia: {
    instagram: String,
    twitter: String,
    facebook: String
  },
  artworks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Artwork',
    default: [] 
  }],
  followers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: [] 
  }],
  following: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Artist',
    default: [] 
  }],
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    value: { type: Number, min: 1, max: 5 }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});


module.exports = mongoose.model('Artist', artistSchema);