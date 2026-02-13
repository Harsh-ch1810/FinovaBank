const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide loan amount'],
      min: [1000, 'Minimum loan is $1000'],
      max: [1000000, 'Maximum loan is $1,000,000'],
    },
    monthlyIncome: {
      type: Number,
      required: [true, 'Please provide your monthly income'],
      min: [0, 'Income cannot be negative'],
    },
    loanReason: {
      type: String,
      required: [true, 'Please provide reason for loan'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);