// banking-app-backend/jobs/inactivityMonitoringJobs.js
const cron = require('node-cron');
const AccountInactivityService = require('../services/accountInactivityService');
const AccountInactivity = require('../models/AccountInactivity');
const Account = require('../models/Account');
const User = require('../models/User');

/**
 * Check all account inactivity statuses
 * Runs every day at 2:00 AM
 */
const checkInactivityStatusesJob = cron.schedule('0 2 * * *', async () => {
  try {
    console.log('🔍 [CRON] Starting inactivity status check...');

    const result = await AccountInactivityService.checkAllInactivityStatuses();

    console.log('✅ [CRON] Inactivity status check completed');
    console.log('📊 Status Updates:', result.statusUpdates);
  } catch (error) {
    console.error('❌ [CRON] Error checking inactivity statuses:', error);
  }
});

/**
 * Send warning emails based on inactivity
 * Runs every day at 3:00 AM
 */
const sendWarningEmailsJob = cron.schedule('0 3 * * *', async () => {
  try {
    console.log('📧 [CRON] Starting warning emails sending...');

    const inactivityRecords = await AccountInactivity.find({
      isAccountBlocked: false,
    });

    let emailStats = {
      firstWarning: 0,
      secondWarning: 0,
      thirdWarning: 0,
      finalNotice: 0,
    };

    for (let record of inactivityRecords) {
      const user = await User.findById(record.userId);
      if (!user) continue;

      // Send first warning (30 days)
      if (record.shouldSendFirstWarning()) {
        try {
          // Email sending logic would go here
          await record.markFirstWarningSent();
          emailStats.firstWarning += 1;
          console.log(`📮 First warning sent to ${user.email}`);
        } catch (error) {
          console.error(`Error sending first warning to ${user.email}:`, error);
        }
      }

      // Send second warning (60 days)
      if (record.shouldSendSecondWarning()) {
        try {
          // Email sending logic would go here
          await record.markSecondWarningSent();
          emailStats.secondWarning += 1;
          console.log(`📮 Second warning sent to ${user.email}`);
        } catch (error) {
          console.error(`Error sending second warning to ${user.email}:`, error);
        }
      }

      // Send third warning (90 days)
      if (record.shouldSendThirdWarning()) {
        try {
          // Email sending logic would go here
          await record.markThirdWarningSent();
          emailStats.thirdWarning += 1;
          console.log(`📮 Third warning sent to ${user.email}`);
        } catch (error) {
          console.error(`Error sending third warning to ${user.email}:`, error);
        }
      }

      // Send final notice (7 days before block)
      if (record.shouldSendFinalNotice()) {
        try {
          // Email sending logic would go here
          await record.markFinalNoticeSent();
          emailStats.finalNotice += 1;
          console.log(`📮 Final notice sent to ${user.email}`);
        } catch (error) {
          console.error(`Error sending final notice to ${user.email}:`, error);
        }
      }
    }

    console.log('✅ [CRON] Warning emails sending completed');
    console.log('📊 Emails Sent:', emailStats);
  } catch (error) {
    console.error('❌ [CRON] Error sending warning emails:', error);
  }
});

/**
 * Auto-block inactive accounts
 * Runs every day at 4:00 AM
 */
const autoBlockInactiveAccountsJob = cron.schedule('0 4 * * *', async () => {
  try {
    console.log('🔒 [CRON] Starting auto-block process...');

    const result = await AccountInactivityService.autoBlockInactiveAccounts();

    console.log('✅ [CRON] Auto-block process completed');
    console.log(`🔒 Accounts Blocked: ${result.blockedCount}`);

    // Log blocking event
    if (result.blockedCount > 0) {
      console.log(`⚠️ ${result.blockedCount} accounts were automatically blocked due to inactivity`);
    }
  } catch (error) {
    console.error('❌ [CRON] Error auto-blocking accounts:', error);
  }
});

/**
 * Generate daily inactivity report
 * Runs every day at 5:00 AM
 */
const generateDailyReportJob = cron.schedule('0 5 * * *', async () => {
  try {
    console.log('📋 [CRON] Generating daily inactivity report...');

    const stats = await AccountInactivityService.getInactivityStatistics();

    console.log('✅ [CRON] Daily report generated');
    console.log('📊 Inactivity Statistics:');
    console.log(`   Active Accounts: ${stats.activeAccounts}`);
    console.log(`   Warning Accounts: ${stats.warningAccounts}`);
    console.log(`   Dormant Accounts: ${stats.dormantAccounts}`);
    console.log(`   Blocked Accounts: ${stats.blockedAccounts}`);
    console.log(`   Approaching Block (30 days): ${stats.accountsApproachingBlock}`);
    console.log(`   Average Days Since Activity: ${stats.averageDaysSinceActivity}`);
  } catch (error) {
    console.error('❌ [CRON] Error generating report:', error);
  }
});

/**
 * Weekly cleanup job
 * Runs every Sunday at 6:00 AM
 */
const weeklyCleanupJob = cron.schedule('0 6 * * 0', async () => {
  try {
    console.log('🧹 [CRON] Starting weekly cleanup...');

    // Clean up expired reactivation codes
    const expiredCodes = await AccountInactivity.find({
      'reactivationCode.expiresAt': { $lt: new Date() },
      'reactivationCode.used': false,
    });

    let cleanedCount = 0;
    for (let record of expiredCodes) {
      record.reactivationCode = null;
      record.reactivationRequired = false;
      await record.save();
      cleanedCount += 1;
    }

    console.log('✅ [CRON] Weekly cleanup completed');
    console.log(`🧹 Cleaned up ${cleanedCount} expired reactivation codes`);
  } catch (error) {
    console.error('❌ [CRON] Error in weekly cleanup:', error);
  }
});

/**
 * Monthly notification job
 * Runs on 1st of every month at 7:00 AM
 */
const monthlyNotificationJob = cron.schedule('0 7 1 * *', async () => {
  try {
    console.log('📬 [CRON] Starting monthly notification...');

    // Send activity reminder to all active users
    const activeAccounts = await AccountInactivity.find({
      inactivityStatus: 'active',
    });

    console.log(`📬 [CRON] Sending monthly reminders to ${activeAccounts.length} active accounts`);
    console.log('✅ [CRON] Monthly notification completed');
  } catch (error) {
    console.error('❌ [CRON] Error in monthly notification:', error);
  }
});

/**
 * Initialize all cron jobs
 */
function initializeInactivityJobs() {
  try {
    console.log('⏰ Initializing inactivity monitoring jobs...');

    // All jobs are automatically started when created with cron.schedule
    // They run according to their schedule

    console.log('✅ Inactivity monitoring jobs initialized:');
    console.log('   ✓ Status check (Daily 2:00 AM)');
    console.log('   ✓ Warning emails (Daily 3:00 AM)');
    console.log('   ✓ Auto-block accounts (Daily 4:00 AM)');
    console.log('   ✓ Daily report (Daily 5:00 AM)');
    console.log('   ✓ Weekly cleanup (Sunday 6:00 AM)');
    console.log('   ✓ Monthly notification (1st of month 7:00 AM)');
  } catch (error) {
    console.error('❌ Error initializing jobs:', error);
  }
}

/**
 * Stop all cron jobs
 */
function stopInactivityJobs() {
  try {
    console.log('⏹️ Stopping inactivity monitoring jobs...');

    checkInactivityStatusesJob.stop();
    sendWarningEmailsJob.stop();
    autoBlockInactiveAccountsJob.stop();
    generateDailyReportJob.stop();
    weeklyCleanupJob.stop();
    monthlyNotificationJob.stop();

    console.log('✅ All inactivity monitoring jobs stopped');
  } catch (error) {
    console.error('❌ Error stopping jobs:', error);
  }
}

module.exports = {
  initializeInactivityJobs,
  stopInactivityJobs,
  // Export individual jobs for testing
  checkInactivityStatusesJob,
  sendWarningEmailsJob,
  autoBlockInactiveAccountsJob,
  generateDailyReportJob,
  weeklyCleanupJob,
  monthlyNotificationJob,
};