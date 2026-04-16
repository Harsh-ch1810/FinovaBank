// banking-app-backend/models/Loan.js
const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },

    // Loan Details
    loanType: {
      type: String,
      enum: ['Personal', 'Home', 'Vehicle', 'Education'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 10000,
    },
    purpose: String,

    // Interest & Tenure
    interestRate: {
      type: Number,
      default: 8.5,
    },
    tenureMonths: {
      type: Number,
      required: true,
    },
    monthlyEMI: Number,
    totalPayable: Number,

    // Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'closed'],
      default: 'pending',
    },
    approvalDate: Date,
    rejectionReason: String,

    // Payment Tracking
    disbursedAmount: {
      type: Number,
      default: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    remainingAmount: Number,
    emisPaid: {
      type: Number,
      default: 0,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Calculate EMI using formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
loanSchema.methods.calculateEMI = function () {
  const principal = this.amount;
  const monthlyRate = this.interestRate / 12 / 100;
  const months = this.tenureMonths;

  if (monthlyRate === 0) {
    this.monthlyEMI = Math.round(principal / months);
  } else {
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
    const denominator = Math.pow(1 + monthlyRate, months) - 1;
    this.monthlyEMI = Math.round((principal * numerator) / denominator);
  }

  this.totalPayable = this.monthlyEMI * months;
  this.remainingAmount = this.totalPayable - this.amountPaid;
};

// Approve loan
loanSchema.methods.approve = function () {
  this.status = 'approved';
  this.approvalDate = new Date();
  this.calculateEMI();
};

// Reject loan
loanSchema.methods.reject = function (reason) {
  this.status = 'rejected';
  this.rejectionReason = reason;
};

// Disburse loan
loanSchema.methods.disburse = function () {
  this.status = 'active';
  this.disbursedAmount = this.amount;
};

// Record EMI payment
loanSchema.methods.payEMI = function (amount) {
  this.amountPaid += amount;
  this.emisPaid += 1;
  this.remainingAmount = this.totalPayable - this.amountPaid;

  if (this.remainingAmount <= 0) {
    this.status = 'closed';
  }
};

module.exports = mongoose.model('Loan', loanSchema);