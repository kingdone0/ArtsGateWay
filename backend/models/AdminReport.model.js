const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Report title is required'] 
  },
  type: { 
    type: String, 
    enum: [
      "users",
      "events", 
      "artworks",
      "reports", 
      "admins" 
    ], 
    required: [true, 'Report type is required'] 
  },
  description: String,
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  generatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Admin", 
    required: true 
  },
  period: {
    start: { type: Date, default: Date.now },
    end: { type: Date, default: Date.now }
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  fileUrl: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

reportSchema.virtual('admin', {
  ref: 'Admin',
  localField: 'generatedBy',
  foreignField: '_id',
  justOne: true
});


const Report = mongoose.model('Report', reportSchema);

module.exports = Report;