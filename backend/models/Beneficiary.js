// banking-app-backend/models/Beneficiary.js
const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    beneficiaryUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    beneficiaryName: {
      type: String,
      required: true,
    },
    beneficiaryEmail: {
      type: String,
      required: true,
    },
    beneficiaryMobileNumber: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Family', 'Friend', 'Business', 'Self', 'Other'],
      default: 'Other',
    },
    nickname: {
      type: String, // User-friendly name for beneficiary
    },
    relationshipType: {
      type: String,
      enum: ['Self', 'Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Colleague', 'Other'],
    },

    // Verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationOTP: String,
    verificationOTPExpires: Date,
    verificationEmail: {
      type: String,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,

    // Transaction history with this beneficiary
    totalTransfersCount: {
      type: Number,
      default: 0,
    },
    totalTransfersAmount: {
      type: Number,
      default: 0,
    },
    lastTransferDate: Date,

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },

    // Tracking
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique beneficiary per user (can't add same person twice)
beneficiarySchema.index({ userId: 1, beneficiaryUserId: 1 }, { unique: true });

// Method to verify beneficiary email
beneficiarySchema.methods.generateVerificationOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationOTP = otp;
  this.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Method to verify OTP
beneficiarySchema.methods.verifyOTP = function (otp) {
  if (!this.verificationOTP || !this.verificationOTPExpires) {
    throw new Error('OTP not generated');
  }

  if (new Date() > this.verificationOTPExpires) {
    throw new Error('OTP has expired');
  }

  if (this.verificationOTP !== otp) {
    throw new Error('Invalid OTP');
  }

  this.isVerified = true;
  this.verificationOTP = undefined;
  this.verificationOTPExpires = undefined;
};

// Method to update transfer statistics
beneficiarySchema.methods.recordTransfer = function (amount) {
  this.totalTransfersCount += 1;
  this.totalTransfersAmount += amount;
  this.lastTransferDate = new Date();
};

module.exports = mongoose.model('Beneficiary', beneficiarySchema);