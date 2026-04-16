// backend/models/Transaction.js - COMPLETE FIXED VERSION
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // ==================== SENDER INFO ====================
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  senderAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  senderAccountNumber: {
    type: String,
    required: true,
  },

  // ==================== RECEIVER INFO ====================
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  receiverAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  receiverAccountNumber: {
    type: String,
    required: true,
  },

  // ==================== TRANSACTION DETAILS ====================
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  transactionType: {
    type: String,
    enum: ['transfer', 'withdrawal', 'deposit', 'loan'],
    default: 'transfer',
  },
  description: {
    type: String,
    default: 'Money Transfer',
  },
  reference: {
    type: String,
    unique: true,
    sparse: true,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true,
  },

  // ==================== FEES & CHARGES ====================
  transactionFee: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  totalDebit: {
    type: Number,
  },

  // ==================== TIMESTAMPS ====================
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  completedAt: {
    type: Date,
  },

  // ==================== ADDITIONAL INFO ====================
  failureReason: {
    type: String,
  },
  notes: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  deviceInfo: {
    type: String,
  },
});

// ==================== INDEXES ====================
// Compound indexes for efficient querying
transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ receiverId: 1, createdAt: -1 });
transactionSchema.index({ senderAccountId: 1, createdAt: -1 });
transactionSchema.index({ receiverAccountId: 1, createdAt: -1 });

// ==================== METHODS ====================

transactionSchema.methods.getTransactionSummary = function () {
  return {
    reference: this.reference,
    type: this.transactionType,
    amount: this.amount,
    senderAccount: this.senderAccountNumber,
    receiverAccount: this.receiverAccountNumber,
    status: this.status,
    timestamp: this.timestamp,
    description: this.description,
  };
};

transactionSchema.methods.markCompleted = async function () {
  this.status = 'completed';
  this.completedAt = Date.now();
  return await this.save();
};

transactionSchema.methods.markFailed = async function (reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return await this.save();
};

transactionSchema.methods.markCancelled = async function (reason) {
  this.status = 'cancelled';
  this.failureReason = reason;
  return await this.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);