// banking-app-backend/models/Account.js
const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  // ==================== USER REFERENCE ====================
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // ==================== ACCOUNT BASIC INFO ====================
  accountNumber: {
    type: String,
    required: true,
    unique: true,
  },
  accountType: {
    type: String,
    enum: ['Savings', 'Current', 'Moderate Savings Plus Current'],
    default: 'Savings',
  },
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'closed'],
    default: 'active',
  },

  // ==================== BALANCE & LIMITS ====================
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  minimumBalance: {
    type: Number,
    default: 1000,
  },

  // ==================== TRANSACTION LIMITS ====================
  dailyTransferLimit: {
    type: Number,
    default: 100000,
  },
  monthlyTransactionLimit: {
    type: Number,
    default: 500000,
  },
  dailyTransactionsCount: {
    type: Number,
    default: 0,
  },
  monthlyTransactionsCount: {
    type: Number,
    default: 0,
  },

  // ==================== INTEREST FEATURES (For Savings Component) ====================
  interestRate: {
    type: Number,
    default: 3.5, // Annual interest rate as percentage
  },
  lastInterestCalculatedDate: {
    type: Date,
    default: Date.now,
  },
  accumulatedInterest: {
    type: Number,
    default: 0,
  },

  // ==================== FEES ====================
  monthlyFee: {
    type: Number,
    default: 0,
  },
  feeDeductionDate: {
    type: Date,
  },

  // ==================== OVERDRAFT FACILITY (For Current Component) ====================
  overdraftEnabled: {
    type: Boolean,
    default: false,
  },
  overdraftLimit: {
    type: Number,
    default: 0,
  },
  currentOverdraftAmount: {
    type: Number,
    default: 0,
  },
  overdraftInterestRate: {
    type: Number,
    default: 12.5, // Annual interest rate for overdraft
  },

  // ==================== TRANSACTION TRACKING ====================
  totalTransactionsDone: {
    type: Number,
    default: 0,
  },
  lastTransactionDate: {
    type: Date,
  },
  lastTransactionAmount: {
    type: Number,
  },

  // ==================== ACCOUNT TIER INFORMATION ====================
  tier: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    default: 'basic',
  },
  upgradeEligible: {
    type: Boolean,
    default: false,
  },

  // ==================== DOCUMENTS & VERIFICATION ====================
  documentsVerified: {
    type: Boolean,
    default: false,
  },
  kycCompleted: {
    type: Boolean,
    default: false,
  },

  // ==================== TIMESTAMPS ====================
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  accountOpeningDate: {
    type: Date,
    default: Date.now,
  },
});

// ==================== INDEXES ====================
accountSchema.index({ userId: 1 });
accountSchema.index({ accountNumber: 1 });
accountSchema.index({ createdAt: -1 });

// ==================== HOOKS ====================
accountSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// ==================== METHODS ====================

// Get account details
accountSchema.methods.getAccountDetails = function () {
  return {
    accountNumber: this.accountNumber,
    accountType: this.accountType,
    accountStatus: this.accountStatus,
    balance: this.balance,
    minimumBalance: this.minimumBalance,
    dailyTransferLimit: this.dailyTransferLimit,
    monthlyLimit: this.monthlyTransactionLimit,
    interestRate: this.interestRate,
    monthlyFee: this.monthlyFee,
    overdraftEnabled: this.overdraftEnabled,
    overdraftLimit: this.overdraftLimit,
  };
};

// Check if account is hybrid (Moderate Savings Plus Current)
accountSchema.methods.isHybridAccount = function () {
  return this.accountType === 'Moderate Savings Plus Current';
};

// Get available balance considering overdraft
accountSchema.methods.getAvailableBalance = function () {
  if (this.overdraftEnabled) {
    return this.balance + this.overdraftLimit - this.currentOverdraftAmount;
  }
  return this.balance;
};

// Check if transaction limit exceeded
accountSchema.methods.canTransact = function (amount) {
  const availableBalance = this.getAvailableBalance();
  return availableBalance >= amount;
};

// Deduct amount from account
accountSchema.methods.deductAmount = async function (amount, description = '') {
  if (!this.canTransact(amount)) {
    throw new Error('Insufficient balance');
  }

  if (amount > this.balance) {
    // Use overdraft if available
    if (this.overdraftEnabled) {
      this.currentOverdraftAmount += (amount - this.balance);
      this.balance = 0;
    } else {
      throw new Error('Cannot deduct amount');
    }
  } else {
    this.balance -= amount;
  }

  this.lastTransactionDate = Date.now();
  this.lastTransactionAmount = amount;
  this.totalTransactionsDone += 1;
  this.monthlyTransactionsCount += 1;

  await this.save();
};

// Add amount to account
accountSchema.methods.addAmount = async function (amount) {
  this.balance += amount;
  this.lastTransactionDate = Date.now();
  this.lastTransactionAmount = amount;
  this.totalTransactionsDone += 1;
  this.monthlyTransactionsCount += 1;

  // Reduce overdraft if account was in negative
  if (this.currentOverdraftAmount > 0) {
    const reductionAmount = Math.min(amount, this.currentOverdraftAmount);
    this.currentOverdraftAmount -= reductionAmount;
  }

  await this.save();
};

// Calculate and add interest (for hybrid/savings component)
accountSchema.methods.calculateAndAddInterest = async function () {
  const now = new Date();
  const lastCalculation = new Date(this.lastInterestCalculatedDate);
  const daysElapsed = Math.floor((now - lastCalculation) / (1000 * 60 * 60 * 24));

  if (daysElapsed >= 1) {
    const dailyRate = this.interestRate / 365 / 100;
    const interest = this.balance * dailyRate;
    this.accumulatedInterest += interest;
    this.lastInterestCalculatedDate = now;

    // Credit interest monthly
    if (daysElapsed >= 30) {
      this.balance += this.accumulatedInterest;
      this.accumulatedInterest = 0;
    }

    await this.save();
  }
};

// Deduct monthly fee
accountSchema.methods.deductMonthlyFee = async function () {
  if (this.monthlyFee > 0) {
    this.balance -= this.monthlyFee;
    this.feeDeductionDate = Date.now();
    await this.save();
  }
};

// Reset monthly transaction counters
accountSchema.methods.resetMonthlyCounters = async function () {
  this.monthlyTransactionsCount = 0;
  await this.save();
};

// Upgrade to hybrid account
accountSchema.methods.upgradeToHybrid = async function () {
  this.accountType = 'Moderate Savings Plus Current';
  this.overdraftEnabled = true;
  this.overdraftLimit = Math.min(50000, this.balance * 0.5); // 50% of balance or max 50k
  this.interestRate = 2.75; // Slightly lower for hybrid
  await this.save();
};

// Downgrade from hybrid account
accountSchema.methods.downgradeFromHybrid = async function (newType = 'Savings') {
  if (this.currentOverdraftAmount > 0) {
    throw new Error('Cannot downgrade: Overdraft amount outstanding');
  }
  this.accountType = newType;
  this.overdraftEnabled = false;
  this.overdraftLimit = 0;
  await this.save();
};

// Get account summary
accountSchema.methods.getAccountSummary = function () {
  return {
    accountNumber: this.accountNumber,
    accountType: this.accountType,
    isHybrid: this.isHybridAccount(),
    balance: this.balance,
    availableBalance: this.getAvailableBalance(),
    interestRate: this.interestRate,
    monthlyFee: this.monthlyFee,
    overdraftInfo: {
      enabled: this.overdraftEnabled,
      limit: this.overdraftLimit,
      used: this.currentOverdraftAmount,
      available: this.overdraftLimit - this.currentOverdraftAmount,
    },
    transactionInfo: {
      totalDone: this.totalTransactionsDone,
      monthlyCount: this.monthlyTransactionsCount,
      dailyCount: this.dailyTransactionsCount,
      monthlyLimit: this.monthlyTransactionLimit,
    },
  };
};

module.exports = mongoose.model('Account', accountSchema);