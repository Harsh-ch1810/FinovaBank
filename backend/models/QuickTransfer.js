// backend/models/QuickTransfer.js
const mongoose = require('mongoose');

const quickTransferSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  beneficiaryName: {
    type: String,
    required: true,
  },
  beneficiaryAccountNumber: {
    type: String,
    required: true,
  },
  beneficiaryBank: {
    type: String,
    default: 'Finova Bank',
  },
  amount: {
    type: Number,
    required: true,
    max: 50000,
  },
  transferType: {
    type: String,
    enum: ['own', 'other'],
    required: true,
  },
  purpose: {
    type: String,
    default: 'Quick Transfer',
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed',
  },
  transactionId: {
    type: String,
    unique: true,
  },
  savedBeneficiary: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('QuickTransfer', quickTransferSchema);