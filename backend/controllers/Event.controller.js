const eventService = require("../services/Event.Service");
const Event = require('../models/Event.model');

exports.createEvent = async (req, res) => {
  try {
    console.log("📥 req.body:", req.body);
    console.log("📥 req.files:", req.files);
    
    const { title, description, location, date, price, capacity } = req.body;
  
    if (!title || !description || !location || !date || !price || !capacity) {
      return res.status(400).json({ 
        success: false, 
        message: 'جميع الحقول مطلوبة' 
      });
    }
    
    const event = await eventService.createEvent({
      title,
      description,
      location,
      date: new Date(date),
      price: parseFloat(price),
      capacity: parseInt(capacity),
      image: req.body.imageUrl || null,
      identityDocument: req.body.identityDocument || null,
      proofDocument: req.body.proofDocument || null,
      artist: req.user._id,
      status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفعالية بنجاح',
      data: event
    });
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الفعالية:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
exports.getAllEvents = async (req, res) => {

  try {
    const events = await eventService.getAllEvents();
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
exports.getEventById = async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
exports.getApprovedEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: "approved" })
      .populate("artist", "username email")
      .sort({ date: 1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};