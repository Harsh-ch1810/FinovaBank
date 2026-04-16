// banking-app-backend/services/accountService.js
const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

class AccountService {
  /**
   * Create a new account for a user
   * @param {string} userId - User ID
   * @param {string} accountType - Type of account (Savings, Current, Moderate Savings Plus Current)
   * @returns {Object} Created account
   */
  static async createAccount(userId, accountType = 'Savings') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const accountNumber = this.generateAccountNumber();

      const account = new Account({
        userId,
        accountNumber,
        accountType,
        balance: 0,
        accountStatus: 'active',
      });

      // Set specific properties based on account type
      if (accountType === 'Moderate Savings Plus Current') {
        account.overdraftEnabled = true;
        account.interestRate = 2.75;
        account.overdraftLimit = 0; // Will be set based on balance
      } else if (accountType === 'Current') {
        account.overdraftEnabled = true;
        account.interestRate = 0;
        account.monthlyFee = 100;
      } else if (accountType === 'Savings') {
        account.overdraftEnabled = false;
        account.interestRate = 3.5;
        account.monthlyFee = 0;
      }

      await account.save();
      return account;
    } catch (error) {
      throw new Error(`Failed to create account: ${error.message}`);
    }
  }

  /**
   * Generate unique account number
   * @returns {string} Account number
   */
  static generateAccountNumber() {
    const prefix = 'ACC';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Transfer money between accounts
   * @param {string} senderUserId - Sender user ID
   * @param {string} receiverUserId - Receiver user ID
   * @param {number} amount - Amount to transfer
   * @param {string} description - Transaction description
   * @returns {Object} Transaction details
   */
  static async transferMoney(senderUserId, receiverUserId, amount, description = '') {
    try {
      const senderAccount = await Account.findOne({ userId: senderUserId });
      const receiverAccount = await Account.findOne({ userId: receiverUserId });

      if (!senderAccount || !receiverAccount) {
        throw new Error('One or both accounts not found');
      }

      if (!senderAccount.canTransact(amount)) {
        throw new Error('Insufficient balance');
      }

      // Deduct from sender
      await senderAccount.deductAmount(amount, `Transfer to ${receiverAccount.accountNumber}`);

      // Add to receiver
      await receiverAccount.addAmount(amount);

      // Create transaction record
      const senderUser = await User.findById(senderUserId);
      const receiverUser = await User.findById(receiverUserId);

      const transactionId = await Transaction.generateTransactionId();
      const transaction = new Transaction({
        senderId: senderUserId,
        senderName: senderUser.getFullName(),
        senderAccount: senderAccount.accountNumber,
        receiverId: receiverUserId,
        receiverName: receiverUser.getFullName(),
        receiverAccount: receiverAccount.accountNumber,
        amount,
        description,
        transactionId,
        status: 'completed',
      });

      await transaction.save();

      return {
        success: true,
        transactionId,
        amount,
        senderBalance: senderAccount.balance,
        receiverBalance: receiverAccount.balance,
        message: 'Transfer successful',
      };
    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Get account status for a user
   * @param {string} userId - User ID
   * @returns {Object} Account status details
   */
  static async getAccountStatus(userId) {
    try {
      const account = await Account.findOne({ userId });

      if (!account) {
        throw new Error('Account not found');
      }

      return {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        isHybrid: account.isHybridAccount(),
        accountStatus: account.accountStatus,
        balance: account.balance,
        availableBalance: account.getAvailableBalance(),
        isActive: account.accountStatus === 'active',
        createdAt: account.createdAt,
      };
    } catch (error) {
      throw new Error(`Failed to get account status: ${error.message}`);
    }
  }

  /**
   * Perform transaction with validation
   * @param {string} userId - User ID
   * @param {number} amount - Amount
   * @param {string} type - 'debit' or 'credit'
   * @returns {Object} Updated account info
   */
  static async performTransaction(userId, amount, type = 'debit') {
    try {
      const account = await Account.findOne({ userId });

      if (!account) {
        throw new Error('Account not found');
      }

      if (type === 'debit') {
        await account.deductAmount(amount);
      } else if (type === 'credit') {
        await account.addAmount(amount);
      } else {
        throw new Error('Invalid transaction type');
      }

      return account.getAccountSummary();
    } catch (error) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Check if account can be upgraded to hybrid
   * @param {string} userId - User ID
   * @returns {Object} Eligibility details
   */
  static async checkHybridUpgradeEligibility(userId) {
    try {
      const account = await Account.findOne({ userId });

      if (!account) {
        throw new Error('Account not found');
      }

      const minBalance = 5000;
      const isEligible = account.balance >= minBalance;

      return {
        isEligible,
        currentBalance: account.balance,
        requiredBalance: minBalance,
        accountType: account.accountType,
        isAlreadyHybrid: account.isHybridAccount(),
      };
    } catch (error) {
      throw new Error(`Eligibility check failed: ${error.message}`);
    }
  }

  /**
   * Apply interest to hybrid/savings accounts
   * @param {string} userId - User ID
   * @returns {Object} Interest details
   */
  static async applyMonthlyInterest(userId) {
    try {
      const account = await Account.findOne({ userId });

      if (!account) {
        throw new Error('Account not found');
      }

      if (account.accountType === 'Current' && !account.isHybridAccount()) {
        throw new Error('Interest not applicable for Current accounts');
      }

      const previousBalance = account.balance;
      const monthlyRate = (account.interestRate / 12) / 100;
      const interest = account.balance * monthlyRate;

      account.balance += interest;
      account.accumulatedInterest = 0;
      await account.save();

      return {
        previousBalance,
        interest,
        newBalance: account.balance,
        interestRate: account.interestRate,
        appliedOn: new Date(),
      };
    } catch (error) {
      throw new Error(`Interest application failed: ${error.message}`);
    }
  }

  /**
   * Apply overdraft interest for hybrid accounts
   * @param {string} userId - User ID
   * @returns {Object} Overdraft interest details
   */
  static async applyOverdraftInterest(userId) {
    try {
      const account = await Account.findOne({ userId });

      if (!account) {
        throw new Error('Account not found');
      }

      if (!account.overdraftEnabled || account.currentOverdraftAmount === 0) {
        throw new Error('No active overdraft to charge interest on');
      }

      const monthlyRate = (account.overdraftInterestRate / 12) / 100;
      const overdraftInterest = account.currentOverdraftAmount * monthlyRate;

      // Increase overdraft amount by interest
      account.currentOverdraftAmount += overdraftInterest;
      await account.save();

      return {
        overdraftAmount: account.currentOverdraftAmount - overdraftInterest,
        interestCharged: overdraftInterest,
        newOverdraftAmount: account.currentOverdraftAmount,
        overdraftInterestRate: account.overdraftInterestRate,
        chargedOn: new Date(),
      };
    } catch (error) {
      throw new Error(`Overdraft interest application failed: ${error.message}`);
    }
  }

  /**
   * Get account transaction summary
   * @param {string} userId - User ID
   * @param {number} limit - Number of transactions to fetch
   * @returns {Array} Transaction list
   */
  static async getTransactionSummary(userId, limit = 10) {
    try {
      const transactions = await Transaction.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      return transactions;
    } catch (error) {
      throw new Error(`Failed to fetch transaction summary: ${error.message}`);
    }
  }

  /**
   * Suspend account
   * @param {string} userId - User ID
   * @param {string} reason - Reason for suspension
   * @returns {Object} Updated account
   */
  static async suspendAccount(userId, reason = '') {
    try {
      const account = await Account.findOne({ userId });

      if (!account) {
        throw new Error('Account not found');
      }

      account.accountStatus = 'suspended';
      await account.save();

      return {
        accountNumber: account.accountNumber,
        status: 'suspended',
        reason,
        suspendedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to suspend account: ${error.message}`);
    }
  }

  /**
   * Reactivate account
   * @param {string} userId - User ID
   * @returns {Object} Updated account
   */
  static async reactivateAccount(userId) {
    try {
      const account = await Account.findOne({ userId });

      if (!account) {
        throw new Error('Account not found');
      }

      account.accountStatus = 'active';
      await account.save();

      return {
        accountNumber: account.accountNumber,
        status: 'active',
        reactivatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to reactivate account: ${error.message}`);
    }
  }
}

module.exports = AccountService;