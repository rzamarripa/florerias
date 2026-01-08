import mongoose from "mongoose";

const passwordResetCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired documents
  },
  used: {
    type: Boolean,
    default: false
  },
  redeemed: {
    type: Date,
    default: null
  },
  expired: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
passwordResetCodeSchema.index({ email: 1, code: 1 });
passwordResetCodeSchema.index({ createdAt: 1 });

// Method to check if code is valid
passwordResetCodeSchema.methods.isValid = function() {
  if (this.used) return false;
  if (this.expired) return false;
  if (new Date() > this.expiresAt) {
    this.expired = true;
    this.save();
    return false;
  }
  return true;
};

// Method to mark as used
passwordResetCodeSchema.methods.markAsUsed = function() {
  this.used = true;
  this.redeemed = new Date();
  return this.save();
};

const PasswordResetCode = mongoose.model("PasswordResetCode", passwordResetCodeSchema);

export { PasswordResetCode };