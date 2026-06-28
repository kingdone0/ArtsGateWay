const artistService = require("../services/artist.service");
const Artist = require('../models/Artist.model');
const User = require('../models/User.model');

exports.toggleFollowArtist = async (req, res) => {
  try {
    const artistId = req.params.id || req.params.artistId;
    const userId = req.user?.id;

    const result = await artistService.toggleFollowArtistLogic(userId, artistId);

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('❌ toggleFollowArtist error:', err);
    res.status(500).json({
      success: false,
      message: err.message || "خطأ في الخادم"
    });
  }
};
exports.updateArtistProfile = async (req, res) => {
  try {
    const { artistId } = req.params;
    const { bio } = req.body;
    
    console.log("📝 تحديث - artistId:", artistId);
    console.log("📝 bio:", bio);
    console.log("📸 req.file:", req.file);
    
    const updateData = {};
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }
    if (bio) {
      updateData.bio = bio;
    }
    const userId = req.user._id;
    const result = await artistService.updateArtistProfileLogic(artistId, userId, updateData);
    
    res.status(200).json({
      success: true,
      message: "تم تحديث الملف الشخصي بنجاح",
      data: result
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};
exports.getMyArtworks = async (req, res) => {
  try {
    const { artistId } = req.params;
    const artistWorks = await artistService.myArtworksLogic(artistId);

    res.json({
      success: true,
      message: "الأعمال الموجودة",
      data: artistWorks
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};
exports.getAllArtists = async (req, res) => {
  try {
    const artists = await artistService.getAllArtistsLogic();
    res.json({
      success: true,
      data: artists || []
    });
  } catch (error) {
    console.error("Error in getAllArtists controller:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
exports.getArtistById = async (req, res) => {
  try {
    const artist = await artistService.getArtistByIdLogic(req.params.artistId);
    res.json({ 
      success: true, 
      artist 
    });
  } catch (err) {
    console.error(err);
    res.status(404).json({ 
      success: false, 
      message: err.message || "Server error" 
    });
  }
};