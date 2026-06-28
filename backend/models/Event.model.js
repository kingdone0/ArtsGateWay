const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
  identityDocument: {
     type: String 
    },  
  proofDocument: { 
    type: String
   }, 
    description: {
      type: String,
      required: true
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    location: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    price: {
      type: Number,
      required: true,
      default: 0
    },
    capacity: {
      type: Number,
      required: true
    },
    bookedSeats: {
      type: Number,
      default: 0
    },
    image: {
      type: String
    },
    verificationDocument: {
      type: String
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked", "cancelled"],
      default: "pending"
    },
    rejectionReason: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    approvedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    rejectedAt: Date,
  
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    cancelledAt: Date,
    cancellationReason: String,
    
    isBlocked: { type: Boolean, default: false },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    blockedAt: Date,
    blockReason: String,

    reportsCount: { type: Number, default: 0 },
    uniqueReporters: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

eventSchema.index({ title: "text", description: "text" });
eventSchema.index({ status: 1, createdAt: -1 });
eventSchema.index({ artist: 1, status: 1 });
eventSchema.index({ isBlocked: 1 });

module.exports = mongoose.model("Event", eventSchema);