// banking-app-backend/services/accountInactivityService.js
const AccountInactivity = require('../models/AccountInactivity');
const User = require('../models/User');
const Account = require('../models/Account');
const nodemailer = require('nodemailer');

const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

class AccountInactivityService {
  /**
   * Initialize inactivity tracking for new user
   */
  static async initializeForNewUser(userId) {
    try {
      const account = await Account.findOne({ userId });

      if (!account) {
        throw new Error('Account not found');
      }

      const inactivity = new AccountInactivity({
        userId,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        lastActivityDate: Date.now(),
      });

      await inactivity.save();

      return {
        success: true,
        message: 'Inactivity tracking initialized',
        inactivity,
      };
    } catch (error) {
      throw new Error(`Failed to initialize inactivity tracking: ${error.message}`);
    }
  }

  /**
   * Record user activity (called on every significant action)
   */
  static async recordActivity(userId, activityType = 'other') {
    try {
      let inactivity = await AccountInactivity.findOne({ userId });

      if (!inactivity) {
        // Create new record if doesn't exist
        const account = await Account.findOne({ userId });
        inactivity = new AccountInactivity({
          userId,
          accountNumber: account?.accountNumber,
          accountType: account?.accountType,
        });
      }

      await inactivity.recordActivity(activityType);

      return {
        success: true,
        message: 'Activity recorded',
      };
    } catch (error) {
      throw new Error(`Failed to record activity: ${error.message}`);
    }
  }

  /**
   * Check inactivity status for all users
   * Should be run as a cron job
   */
  static async checkAllInactivityStatuses() {
    try {
      const allInactivityRecords = await AccountInactivity.find({});

      const statusUpdates = {
        active: 0,
        warning: 0,
        dormant: 0,
        blocked: 0,
      };

      for (let record of allInactivityRecords) {
        const status = await record.checkInactivityStatus();
        statusUpdates[status] += 1;
      }

      return {
        success: true,
        message: 'Inactivity statuses checked for all users',
        statusUpdates,
      };
    } catch (error) {
      throw new Error(`Failed to check inactivity statuses: ${error.message}`);
    }
  }

  /**
   * Send appropriate warning emails
   * Should be run as a cron job
   */
  static async sendWarningEmails() {
    try {
      const inactivityRecords = await AccountInactivity.find({
        isAccountBlocked: false,
      });

      let emailsSent = {
        firstWarning: 0,
        secondWarning: 0,
        thirdWarning: 0,
        finalNotice: 0,
      };

      for (let record of inactivityRecords) {
        const user = await User.findById(record.userId);

        if (!user) continue;

        // Check and send first warning
        if (record.shouldSendFirstWarning()) {
          // Send first warning email
          emailsSent.firstWarning += 1;
          await record.markFirstWarningSent();
        }

        // Check and send second warning
        if (record.shouldSendSecondWarning()) {
          // Send second warning email
          emailsSent.secondWarning += 1;
          await record.markSecondWarningSent();
        }

        // Check and send third warning
        if (record.shouldSendThirdWarning()) {
          // Send third warning email
          emailsSent.thirdWarning += 1;
          await record.markThirdWarningSent();
        }

        // Check and send final notice
        if (record.shouldSendFinalNotice()) {
          // Send final notice email
          emailsSent.finalNotice += 1;
          await record.markFinalNoticeSent();
        }
      }

      return {
        success: true,
        message: 'Warning emails sent',
        emailsSent,
      };
    } catch (error) {
      throw new Error(`Failed to send warning emails: ${error.message}`);
    }
  }

  /**
   * Block inactive accounts automatically
   * Should be run as a cron job
   */
  static async autoBlockInactiveAccounts() {
    try {
      const inactivityRecords = await AccountInactivity.find({
        isAccountBlocked: false,
      });

      let blockedCount = 0;

      for (let record of inactivityRecords) {
        // Check if account should be blocked
        if (record.daysSinceLastActivity >= record.thresholds.accountBlock) {
          const account = await Account.findOne({ userId: record.userId });

          if (account) {
            account.accountStatus = 'suspended';
            await account.save();
          }

          await record.blockAccount('Automatic block due to inactivity');
          blockedCount += 1;

          // Send blocking notification email
          const user = await User.findById(record.userId);
          if (user) {
            // Send email notification
          }
        }
      }

      return {
        success: true,
        message: `Auto-blocked ${blockedCount} inactive accounts`,
        blockedCount,
      };
    } catch (error) {
      throw new Error(`Failed to auto-block accounts: ${error.message}`);
    }
  }

  /**
   * Get accounts approaching block date
   */
  static async getAccountsApproachingBlock(daysBeforeBlock = 30) {
    try {
      const allRecords = await AccountInactivity.find({
        isAccountBlocked: false,
      });

      const accountsApproaching = allRecords.filter((record) => {
        const daysUntilBlock = record.thresholds.accountBlock - record.daysSinceLastActivity;
        return daysUntilBlock > 0 && daysUntilBlock <= daysBeforeBlock;
      });

      return accountsApproaching.map((record) => ({
        userId: record.userId,
        accountNumber: record.accountNumber,
        daysSinceLastActivity: record.daysSinceLastActivity,
        daysUntilBlock: record.thresholds.accountBlock - record.daysSinceLastActivity,
        status: record.inactivityStatus,
      }));
    } catch (error) {
      throw new Error(`Failed to get approaching accounts: ${error.message}`);
    }
  }

  /**
   * Get inactivity statistics
   */
  static async getInactivityStatistics() {
    try {
      const allRecords = await AccountInactivity.find({});

      const stats = {
        totalAccounts: allRecords.length,
        activeAccounts: 0,
        warningAccounts: 0,
        dormantAccounts: 0,
        blockedAccounts: 0,
        averageDaysSinceActivity: 0,
        accountsApproachingBlock: 0,
      };

      let totalDays = 0;

      for (let record of allRecords) {
        if (record.inactivityStatus === 'active') stats.activeAccounts += 1;
        else if (record.inactivityStatus === 'warning') stats.warningAccounts += 1;
        else if (record.inactivityStatus === 'dormant') stats.dormantAccounts += 1;
        else if (record.inactivityStatus === 'blocked') stats.blockedAccounts += 1;

        totalDays += record.daysSinceLastActivity;

        // Check if approaching block
        const daysUntilBlock = record.thresholds.accountBlock - record.daysSinceLastActivity;
        if (daysUntilBlock > 0 && daysUntilBlock <= 30) {
          stats.accountsApproachingBlock += 1;
        }
      }

      stats.averageDaysSinceActivity = Math.round(totalDays / allRecords.length);

      return stats;
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Reactivate blocked account
   */
  static async reactivateBlockedAccount(userId, adminId) {
    try {
      const inactivity = await AccountInactivity.findOne({ userId });
      const account = await Account.findOne({ userId });

      if (!inactivity) {
        throw new Error('Inactivity record not found');
      }

      await inactivity.unblockAccount(adminId, 'Admin reactivation');

      if (account) {
        account.accountStatus = 'active';
        await account.save();
      }

      return {
        success: true,
        message: 'Account reactivated successfully',
      };
    } catch (error) {
      throw new Error(`Failed to reactivate account: ${error.message}`);
    }
  }

  /**
   * Send custom message to inactive users
   */
  static async sendCustomMessageToInactiveUsers(
    inactivityDays,
    subject,
    htmlMessage
  ) {
    try {
      const inactiveUsers = await AccountInactivity.find({
        daysSinceLastActivity: { $gte: inactivityDays },
      });

      let sent = 0;
      let failed = 0;

      for (let record of inactiveUsers) {
        const user = await User.findById(record.userId);

        if (!user) continue;

        try {
          await emailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject,
            html: htmlMessage,
          });
          sent += 1;
        } catch (error) {
          failed += 1;
          console.error(`Failed to send email to ${user.email}:`, error);
        }
      }

      return {
        success: true,
        message: `Sent ${sent} emails, ${failed} failed`,
        sent,
        failed,
      };
    } catch (error) {
      throw new Error(`Failed to send custom messages: ${error.message}`);
    }
  }

  /**
   * Get inactivity report for admin
   */
  static async getInactivityReport(filters = {}) {
    try {
      const {
        status = null,
        minDays = 0,
        maxDays = 999,
        limit = 100,
        skip = 0,
      } = filters;

      let query = {
        daysSinceLastActivity: { $gte: minDays, $lte: maxDays },
      };

      if (status) {
        query.inactivityStatus = status;
      }

      const records = await AccountInactivity.find(query)
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ daysSinceLastActivity: -1 });

      const total = await AccountInactivity.countDocuments(query);

      return {
        success: true,
        total,
        count: records.length,
        records: records.map((r) => r.getInactivitySummary()),
      };
    } catch (error) {
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Update inactivity thresholds for a user
   */
  static async updateInactivityThresholds(userId, newThresholds) {
    try {
      const inactivity = await AccountInactivity.findOne({ userId });

      if (!inactivity) {
        throw new Error('Inactivity record not found');
      }

      if (newThresholds.firstWarning) {
        inactivity.thresholds.firstWarning = newThresholds.firstWarning;
      }
      if (newThresholds.secondWarning) {
        inactivity.thresholds.secondWarning = newThresholds.secondWarning;
      }
      if (newThresholds.thirdWarning) {
        inactivity.thresholds.thirdWarning = newThresholds.thirdWarning;
      }
      if (newThresholds.accountBlock) {
        inactivity.thresholds.accountBlock = newThresholds.accountBlock;
      }

      await inactivity.save();

      return {
        success: true,
        message: 'Thresholds updated',
        thresholds: inactivity.thresholds,
      };
    } catch (error) {
      throw new Error(`Failed to update thresholds: ${error.message}`);
    }
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(userId, preferences) {
    try {
      const inactivity = await AccountInactivity.findOne({ userId });

      if (!inactivity) {
        throw new Error('Inactivity record not found');
      }

      inactivity.notificationPreferences = {
        ...inactivity.notificationPreferences,
        ...preferences,
      };

      await inactivity.save();

      return {
        success: true,
        message: 'Notification preferences updated',
        preferences: inactivity.notificationPreferences,
      };
    } catch (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  }
}

module.exports = AccountInactivityService;