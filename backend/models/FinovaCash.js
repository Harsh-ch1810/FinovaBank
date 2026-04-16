// backend/models/FinovaCash.js
const mongoose = require('mongoose');

const finanovaCashSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  transactionType: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 100,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'net-banking', 'upi'],
    required: true,
  },
  // For withdrawal
  withdrawalMode: {
    type: String,
    enum: ['atm', 'branch', 'home-delivery'],
  },
  
  // For deposit
  depositMode: {
    type: String,
    enum: ['branch', 'atm', 'cheque'],
  },
  
  chequeNumber: String,
  chequeBank: String,
  
  status: {
    type: String,
    enum: ['completed', 'pending', 'processing', 'failed'],
    default: 'completed',
  },
  
  reference: {
    type: String,
    unique: true,
  },
  
  description: String,
  
  balanceAfter: {
    type: Number,
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

module.exports = mongoose.model('FinovaCash', finanovaCashSchema);