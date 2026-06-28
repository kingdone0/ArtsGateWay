const express = require("express");
const router = express.Router();
const artistController = require("../controllers/artist.controller");
const uploadMiddleware = require('../utils/upload');
const { authenticate } = require('../middleware/auth');


router.put("/:artistId", authenticate, uploadMiddleware, artistController.updateArtistProfile);
router.put("/:artistId/bio", authenticate, artistController.updateArtistProfile);
router.get("/getArtist", artistController.getAllArtists);
router.post("/:artistId/follow", authenticate, artistController.toggleFollowArtist);
router.get("/:artistId/MyWork", artistController.getMyArtworks);
router.get("/:artistId", artistController.getArtistById);

module.exports = router;