// backend/models/Request.js - REQUEST MANAGEMENT MODEL
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  // ==================== REQUEST BASIC INFO ====================
  requestId: {
    type: String,
    unique: true,
    default: () => `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },

  // ==================== REQUEST TYPE ====================
  requestType: {
    type: String,
    enum: [
      'account_approval',      // New account registration approval
      'loan_application',      // Loan application approval
      'account_upgrade',       // Account type upgrade request
      'limit_increase',        // Transaction limit increase request
      'document_verification', // Document verification request
      'kyc_update',           // KYC information update
      'account_reopening',    // Reopen closed account
      'other',                // Other requests
    ],
    required: true,
  },

  // ==================== REQUEST STATUS ====================
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review', 'on_hold'],
    default: 'pending',
  },

  // ==================== REQUEST DETAILS ====================
  description: {
    type: String,
    required: true,
  },
  details: {
    // For loan applications
    loanAmount: Number,
    loanTenure: Number,
    loanPurpose: String,
    loanType: String,

    // For account upgrades
    currentAccountType: String,
    requestedAccountType: String,

    // For limit increases
    currentLimit: Number,
    requestedLimit: Number,
    limitType: String, // 'daily' or 'monthly'

    // For document verification
    documentType: String,
    documentNumber: String,

    // Any other custom details
    customDetails: mongoose.Schema.Types.Mixed,
  },

  // ==================== ATTACHMENTS ====================
  documents: [
    {
      documentType: String,
      documentUrl: String,
      fileName: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],

  // ==================== ADMIN ACTIONS ====================
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  reviewerEmail: String,
  reviewerName: String,
  reviewNotes: String,
  approvalReason: String,
  rejectionReason: String,

  // ==================== TIMESTAMPS ====================
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  completedAt: Date,

  // ==================== PRIORITY & URGENCY ====================
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  isUrgent: {
    type: Boolean,
    default: false,
  },

  // ==================== NOTIFICATIONS ====================
  userNotified: {
    type: Boolean,
    default: false,
  },
  notificationSentAt: Date,

  // ==================== METADATA ====================
  ipAddress: String,
  userAgent: String,
});

// ==================== INDEXES ====================
requestSchema.index({ userId: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ requestType: 1 });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ priority: 1, status: 1 });

// ==================== HOOKS ====================
requestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// ==================== METHODS ====================
requestSchema.methods.approve = function (adminId, adminName, adminEmail, reason) {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewerName = adminName;
  this.reviewerEmail = adminEmail;
  this.approvalReason = reason;
  this.reviewedAt = new Date();
  this.completedAt = new Date();
  this.userNotified = false; // Will be set to true after sending email
};

requestSchema.methods.reject = function (adminId, adminName, adminEmail, reason) {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewerName = adminName;
  this.reviewerEmail = adminEmail;
  this.rejectionReason = reason;
  this.reviewedAt = new Date();
  this.completedAt = new Date();
  this.userNotified = false; // Will be set to true after sending email
};

requestSchema.methods.markUnderReview = function () {
  this.status = 'under_review';
  this.updatedAt = new Date();
};

requestSchema.methods.markOnHold = function () {
  this.status = 'on_hold';
  this.updatedAt = new Date();
};

requestSchema.methods.getDaysOpen = function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
};

requestSchema.methods.getStatusDisplay = function () {
  const statuses = {
    pending: 'Pending',
    under_review: 'Under Review',
    on_hold: 'On Hold',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return statuses[this.status] || this.status;
};

module.exports = mongoose.model('Request', requestSchema);