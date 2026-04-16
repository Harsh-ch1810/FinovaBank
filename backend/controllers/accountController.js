// banking-app-backend/controllers/accountController.js - ENHANCED VERSION
const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ==================== EXISTING ENDPOINTS (BACKWARD COMPATIBLE) ====================

// @desc    Get account info
// @route   GET /api/account/info
// @access  Private
exports.getAccountInfo = async (req, res) => {
  try {
    console.log('📌 getAccountInfo called for user:', req.user.id);

    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      console.log('❌ Account not found for user:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('❌ User not found:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    console.log('✅ Account and user found, returning data');

    res.status(200).json({
      success: true,
      account: account.getAccountDetails(),
      user: {
        name: user.getFullName ? user.getFullName() : `${user.firstName} ${user.lastName}`,
        email: user.email,
        mobile: user.mobileNumber,
      },
    });
  } catch (error) {
    console.error('❌ Error in getAccountInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account',
      error: error.message,
    });
  }
};

// @desc    Get account info (alternative endpoint)
// @route   GET /api/account/getInfo
// @access  Private
exports.getInfo = async (req, res) => {
  try {
    console.log('📌 getInfo called for user:', req.user.id);

    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      console.log('❌ Account not found');
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    console.log('✅ Returning account info');

    res.status(200).json({
      success: true,
      account: account.getAccountDetails(),
    });
  } catch (error) {
    console.error('❌ Error in getInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account info',
      error: error.message,
    });
  }
};

// @desc    Get transaction history
// @route   GET /api/account/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    const transactions = await Transaction.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('Error in getTransactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
};

// @desc    Check account limits
// @route   GET /api/account/limits
// @access  Private
exports.getAccountLimits = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    res.status(200).json({
      success: true,
      limits: {
        dailyTransferLimit: account.dailyTransferLimit,
        monthlyTransactionLimit: account.monthlyTransactionLimit,
        minimumBalance: account.minimumBalance,
        currentBalance: account.balance,
        availableBalance: account.getAvailableBalance(),
      },
    });
  } catch (error) {
    console.error('Error in getAccountLimits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch limits',
      error: error.message,
    });
  }
};

// @desc    Get account info for dashboard
// @route   GET /api/account/info
// @access  Private
exports.getAccountInfoForDashboard = async (req, res) => {
  try {
    console.log('📌 getAccountInfoForDashboard called');

    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    res.status(200).json({
      success: true,
      account: account.getAccountDetails(),
    });
  } catch (error) {
    console.error('❌ Error in getAccountInfoForDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account information',
      error: error.message,
    });
  }
};

// @desc    Upgrade account type
// @route   POST /api/account/upgrade
// @access  Private
exports.upgradeAccount = async (req, res) => {
  try {
    const { newType } = req.body;

    if (!newType || !['Savings', 'Current', 'Moderate Savings Plus Current'].includes(newType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type',
      });
    }

    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (account.accountType === newType) {
      return res.status(400).json({
        success: false,
        message: `Already ${newType} account`,
      });
    }

    // Check requirements for different account types
    if (newType === 'Current' && account.balance < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum balance of ₹10,000 required for Current account',
      });
    }

    if (newType === 'Moderate Savings Plus Current' && account.balance < 5000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum balance of ₹5,000 required for Moderate Savings Plus Current account',
      });
    }

    // Upgrade to hybrid account
    if (newType === 'Moderate Savings Plus Current') {
      await account.upgradeToHybrid();
    } else {
      account.accountType = newType;
      if (newType === 'Savings') {
        account.overdraftEnabled = false;
        account.overdraftLimit = 0;
      }
      await account.save();
    }

    res.status(200).json({
      success: true,
      message: `Upgraded to ${newType} account`,
      account: account.getAccountSummary(),
    });
  } catch (error) {
    console.error('Error in upgradeAccount:', error);
    res.status(500).json({
      success: false,
      message: 'Upgrade failed',
      error: error.message,
    });
  }
};

// ==================== NEW ENDPOINTS FOR HYBRID ACCOUNT ====================

// @desc    Get hybrid account details
// @route   GET /api/account/hybrid/details
// @access  Private
exports.getHybridAccountDetails = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (!account.isHybridAccount()) {
      return res.status(400).json({
        success: false,
        message: 'This is not a hybrid account',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hybrid Account Details',
      accountSummary: account.getAccountSummary(),
      savingsComponent: {
        interestRate: account.interestRate,
        accumulatedInterest: account.accumulatedInterest,
        lastInterestCalculated: account.lastInterestCalculatedDate,
        monthlyFee: account.monthlyFee,
      },
      currentComponent: {
        overdraftEnabled: account.overdraftEnabled,
        overdraftLimit: account.overdraftLimit,
        currentOverdraftAmount: account.currentOverdraftAmount,
        availableOverdraft: account.overdraftLimit - account.currentOverdraftAmount,
        overdraftInterestRate: account.overdraftInterestRate,
      },
    });
  } catch (error) {
    console.error('Error in getHybridAccountDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hybrid account details',
      error: error.message,
    });
  }
};

// @desc    Check hybrid account eligibility
// @route   GET /api/account/hybrid/eligibility
// @access  Private
exports.checkHybridEligibility = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    const isEligible = account.balance >= 5000;
    const reasonIfNotEligible = isEligible ? null : 'Minimum balance of ₹5,000 required';

    res.status(200).json({
      success: true,
      isEligible,
      currentBalance: account.balance,
      requiredBalance: 5000,
      reasonIfNotEligible,
      message: isEligible ? 'You are eligible for Moderate Savings Plus Current account' : 'Not eligible yet',
    });
  } catch (error) {
    console.error('Error in checkHybridEligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message,
    });
  }
};

// @desc    Calculate and credit interest
// @route   POST /api/account/hybrid/calculate-interest
// @access  Private
exports.calculateInterest = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (!account.isHybridAccount() && account.accountType === 'Savings') {
      return res.status(400).json({
        success: false,
        message: 'Interest calculation only for Savings and Hybrid accounts',
      });
    }

    await account.calculateAndAddInterest();

    res.status(200).json({
      success: true,
      message: 'Interest calculated and credited',
      interest: {
        accumulatedInterest: account.accumulatedInterest,
        balance: account.balance,
        interestRate: account.interestRate,
      },
    });
  } catch (error) {
    console.error('Error in calculateInterest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate interest',
      error: error.message,
    });
  }
};

// @desc    Use overdraft facility
// @route   POST /api/account/hybrid/use-overdraft
// @access  Private
exports.useOverdraft = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (!account.overdraftEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Overdraft facility not enabled',
      });
    }

    const availableOverdraft = account.overdraftLimit - account.currentOverdraftAmount;

    if (amount > availableOverdraft) {
      return res.status(400).json({
        success: false,
        message: `Overdraft limit exceeded. Available: ₹${availableOverdraft}`,
        availableOverdraft,
      });
    }

    account.currentOverdraftAmount += amount;
    await account.save();

    res.status(200).json({
      success: true,
      message: 'Overdraft used successfully',
      overdraftInfo: {
        usedAmount: account.currentOverdraftAmount,
        availableOverdraft: availableOverdraft - amount,
        overdraftLimit: account.overdraftLimit,
      },
    });
  } catch (error) {
    console.error('Error in useOverdraft:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to use overdraft',
      error: error.message,
    });
  }
};

// @desc    Get account summary
// @route   GET /api/account/summary
// @access  Private
exports.getAccountSummary = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    res.status(200).json({
      success: true,
      summary: account.getAccountSummary(),
    });
  } catch (error) {
    console.error('Error in getAccountSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account summary',
      error: error.message,
    });
  }
};

// @desc    Deduct monthly fee
// @route   POST /api/account/deduct-fee (Admin)
// @access  Private/Admin
exports.deductMonthlyFee = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    const previousBalance = account.balance;
    await account.deductMonthlyFee();

    res.status(200).json({
      success: true,
      message: 'Monthly fee deducted',
      fee: {
        amount: account.monthlyFee,
        previousBalance,
        newBalance: account.balance,
        deductedOn: account.feeDeductionDate,
      },
    });
  } catch (error) {
    console.error('Error in deductMonthlyFee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deduct fee',
      error: error.message,
    });
  }
};

// @desc    Downgrade from hybrid account
// @route   POST /api/account/downgrade
// @access  Private
exports.downgradeAccount = async (req, res) => {
  try {
    const { newType } = req.body;

    if (!newType || !['Savings', 'Current'].includes(newType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type for downgrade',
      });
    }

    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (!account.isHybridAccount()) {
      return res.status(400).json({
        success: false,
        message: 'Only hybrid accounts can be downgraded',
      });
    }

    try {
      await account.downgradeFromHybrid(newType);
      res.status(200).json({
        success: true,
        message: `Downgraded to ${newType} account`,
        account: account.getAccountDetails(),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  } catch (error) {
    console.error('Error in downgradeAccount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to downgrade account',
      error: error.message,
    });
  }
};