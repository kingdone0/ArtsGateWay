const express = require("express");
const router = express.Router();
const uploadEventMiddleware  = require("../utils/eventUpload"); 
const eventController = require("../controllers/Event.controller");
const { authenticate } = require('../middleware/auth');

router.post("/", authenticate, uploadEventMiddleware, eventController.createEvent);
router.get("/", eventController.getAllEvents);
router.get("/:id", eventController.getEventById);
router.get("/approved", eventController.getApprovedEvents);
module.exports = router;