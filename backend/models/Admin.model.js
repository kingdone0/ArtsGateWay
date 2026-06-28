const mongoose = require('mongoose');


const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
 
role: { 
  type: String, 
  enum: [
    'superadmin',
    'user_admin',
    'artwork_admin'
  ], 
  default: 'superadmin' 
},
  permissions: {
    canViewUsers: { type: Boolean, default: false },
       canManageUsers: { type: Boolean, default: false },  
    canViewArtworks: { type: Boolean, default: false },
    canManageAdmins: { type: Boolean, default: false },
    canGenerateReports:{ type: Boolean, default: false },
    canApproveEvents: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

adminSchema.pre('save', function(next) {
  if (this.isNew) { 
    this.permissions = {
      canViewUsers: this.role === 'user_admin' || this.role === 'superadmin',
       canManageUsers: this.role === 'user_admin' || this.role === 'superadmin', 
      canViewArtworks: this.role === 'artwork_admin' || this.role === 'superadmin',
      canManageAdmins: this.role === 'superadmin',
      canGenerateReports: (this.role === 'superadmin'),
      canApproveEvents: this.role === 'user_admin' || this.role === 'superadmin'
    };
  }
  next();
});

module.exports = mongoose.model('Admin', adminSchema);