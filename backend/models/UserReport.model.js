const mongoose = require('mongoose');

const userReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['user', 'artwork', 'comment', 'event'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['User', 'Artwork', 'Comment', 'Event'],
    required: true
  },
  reason: {
    type: String,
    enum: [
      'spam',               
      'inappropriate',      
      'harassment',         
      'hate_speech',      
      'copyright',       
      'impersonation',     
      'violence',          
      'nudity',            
      'false_information',  
      'scam',               
      'other'               
    ],
    required: true
  },
  customReason: {
    type: String,
    maxlength: 200
  },
  details: {
    type: String,
    maxlength: 500,
    trim: true
  },
  evidence: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'يجب أن يكون الرابط صورة صالحة'
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  actionTaken: {
    type: String,
    enum: [
      'content_removed',    
      'user_warned',          
      'account_suspended',    
      'account_banned',       
      'event_cancelled',     
      'no_action',            
      'false_report'          
    ]
  },
  actionDetails: {
    type: String,
    maxlength: 200
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  reporterNotified: {
    type: Boolean,
    default: false
  },
  targetNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


userReportSchema.index(
  { reporter: 1, targetId: 1, targetType: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);


userReportSchema.index({ targetType: 1, targetId: 1, status: 1 });
userReportSchema.index({ status: 1, createdAt: -1 });
userReportSchema.index({ priority: 1, status: 1 });

const UserReport = mongoose.model('UserReport', userReportSchema);
module.exports = UserReport;