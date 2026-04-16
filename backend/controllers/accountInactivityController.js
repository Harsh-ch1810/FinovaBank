// banking-app-backend/controllers/accountInactivityController.js
const AccountInactivity = require('../models/AccountInactivity');
const User = require('../models/User');
const Account = require('../models/Account');
const nodemailer = require('nodemailer');

// Initialize email transporter
const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ==================== TRACK ACTIVITY ====================

// @desc    Track user activity
// @route   POST /api/inactivity/track-activity
// @access  Private
exports.trackActivity = async (req, res) => {
  try {
    const { activityType = 'other' } = req.body;

    let inactivity = await AccountInactivity.findOne({ userId: req.user.id });

    // If no inactivity record, create one
    if (!inactivity) {
      const account = await Account.findOne({ userId: req.user.id });
      inactivity = new AccountInactivity({
        userId: req.user.id,
        accountNumber: account?.accountNumber,
        accountType: account?.accountType,
        lastActivityDate: Date.now(),
        lastActivityType: activityType,
      });
    }

    await inactivity.recordActivity(activityType);

    res.status(200).json({
      success: true,
      message: 'Activity tracked successfully',
    });
  } catch (error) {
    console.error('Error in trackActivity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track activity',
      error: error.message,
    });
  }
};

// ==================== GET INACTIVITY STATUS ====================

// @desc    Get inactivity status
// @route   GET /api/inactivity/status
// @access  Private
exports.getInactivityStatus = async (req, res) => {
  try {
    let inactivity = await AccountInactivity.findOne({ userId: req.user.id });

    if (!inactivity) {
      return res.status(404).json({
        success: false,
        message: 'Inactivity record not found',
      });
    }

    // Update status before returning
    await inactivity.checkInactivityStatus();

    res.status(200).json({
      success: true,
      inactivity: inactivity.getInactivitySummary(),
      nextAction: inactivity.getNextAction(),
    });
  } catch (error) {
    console.error('Error in getInactivityStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inactivity status',
      error: error.message,
    });
  }
};

// @desc    Get inactivity details
// @route   GET /api/inactivity/details
// @access  Private
exports.getInactivityDetails = async (req, res) => {
  try {
    const inactivity = await AccountInactivity.findOne({ userId: req.user.id });

    if (!inactivity) {
      return res.status(404).json({
        success: false,
        message: 'Inactivity record not found',
      });
    }

    res.status(200).json({
      success: true,
      details: {
        summary: inactivity.getInactivitySummary(),
        nextAction: inactivity.getNextAction(),
        emailHistory: inactivity.emailsSent,
        reactivationRequired: inactivity.reactivationRequired,
        thresholds: inactivity.thresholds,
      },
    });
  } catch (error) {
    console.error('Error in getInactivityDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inactivity details',
      error: error.message,
    });
  }
};

// ==================== SEND WARNING EMAILS ====================

// @desc    Send first warning email
// @route   POST /api/inactivity/send-first-warning
// @access  Private (should be called by cron job)
exports.sendFirstWarningEmail = async (req, res) => {
  try {
    const { userId } = req.body;

    const inactivity = await AccountInactivity.findOne({ userId });
    const user = await User.findById(userId);

    if (!inactivity || !user) {
      return res.status(404).json({
        success: false,
        message: 'User or inactivity record not found',
      });
    }

    if (!inactivity.shouldSendFirstWarning()) {
      return res.status(400).json({
        success: false,
        message: 'First warning criteria not met',
      });
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '⚠️ Action Required: Your Bank Account is Inactive',
      html: generateFirstWarningEmail(user, inactivity),
    };

    await emailTransporter.sendMail(mailOptions);
    await inactivity.markFirstWarningSent();

    res.status(200).json({
      success: true,
      message: 'First warning email sent successfully',
    });
  } catch (error) {
    console.error('Error in sendFirstWarningEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send warning email',
      error: error.message,
    });
  }
};

// @desc    Send second warning email
// @route   POST /api/inactivity/send-second-warning
// @access  Private (should be called by cron job)
exports.sendSecondWarningEmail = async (req, res) => {
  try {
    const { userId } = req.body;

    const inactivity = await AccountInactivity.findOne({ userId });
    const user = await User.findById(userId);

    if (!inactivity || !user) {
      return res.status(404).json({
        success: false,
        message: 'User or inactivity record not found',
      });
    }

    if (!inactivity.shouldSendSecondWarning()) {
      return res.status(400).json({
        success: false,
        message: 'Second warning criteria not met',
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '⚠️⚠️ URGENT: Your Bank Account is Still Inactive',
      html: generateSecondWarningEmail(user, inactivity),
    };

    await emailTransporter.sendMail(mailOptions);
    await inactivity.markSecondWarningSent();

    res.status(200).json({
      success: true,
      message: 'Second warning email sent successfully',
    });
  } catch (error) {
    console.error('Error in sendSecondWarningEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send warning email',
      error: error.message,
    });
  }
};

// @desc    Send third warning email
// @route   POST /api/inactivity/send-third-warning
// @access  Private (should be called by cron job)
exports.sendThirdWarningEmail = async (req, res) => {
  try {
    const { userId } = req.body;

    const inactivity = await AccountInactivity.findOne({ userId });
    const user = await User.findById(userId);

    if (!inactivity || !user) {
      return res.status(404).json({
        success: false,
        message: 'User or inactivity record not found',
      });
    }

    if (!inactivity.shouldSendThirdWarning()) {
      return res.status(400).json({
        success: false,
        message: 'Third warning criteria not met',
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '🚨 CRITICAL: Your Bank Account Will Be Blocked Soon',
      html: generateThirdWarningEmail(user, inactivity),
    };

    await emailTransporter.sendMail(mailOptions);
    await inactivity.markThirdWarningSent();

    res.status(200).json({
      success: true,
      message: 'Third warning email sent successfully',
    });
  } catch (error) {
    console.error('Error in sendThirdWarningEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send warning email',
      error: error.message,
    });
  }
};

// @desc    Send final notice before blocking
// @route   POST /api/inactivity/send-final-notice
// @access  Private (should be called by cron job)
exports.sendFinalNotice = async (req, res) => {
  try {
    const { userId } = req.body;

    const inactivity = await AccountInactivity.findOne({ userId });
    const user = await User.findById(userId);

    if (!inactivity || !user) {
      return res.status(404).json({
        success: false,
        message: 'User or inactivity record not found',
      });
    }

    if (!inactivity.shouldSendFinalNotice()) {
      return res.status(400).json({
        success: false,
        message: 'Final notice criteria not met',
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '🚨 FINAL NOTICE: Your Bank Account Will Be Blocked in 7 Days',
      html: generateFinalNoticeEmail(user, inactivity),
    };

    await emailTransporter.sendMail(mailOptions);
    await inactivity.markFinalNoticeSent();

    res.status(200).json({
      success: true,
      message: 'Final notice email sent successfully',
    });
  } catch (error) {
    console.error('Error in sendFinalNotice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send final notice',
      error: error.message,
    });
  }
};

// ==================== REACTIVATION ====================

// @desc    Generate reactivation code
// @route   POST /api/inactivity/generate-reactivation-code
// @access  Private
exports.generateReactivationCode = async (req, res) => {
  try {
    const inactivity = await AccountInactivity.findOne({ userId: req.user.id });

    if (!inactivity) {
      return res.status(404).json({
        success: false,
        message: 'Inactivity record not found',
      });
    }

    const result = await inactivity.generateReactivationCode();

    // Send code via email
    const user = await User.findById(req.user.id);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Reactivation Code for Your Bank Account',
      html: generateReactivationCodeEmail(user, result.code),
    };

    await emailTransporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Reactivation code generated and sent to email',
      code: result.code, // In production, don't return this - only show in email
    });
  } catch (error) {
    console.error('Error in generateReactivationCode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reactivation code',
      error: error.message,
    });
  }
};

// @desc    Verify reactivation code
// @route   POST /api/inactivity/verify-reactivation-code
// @access  Private
exports.verifyReactivationCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Reactivation code is required',
      });
    }

    const inactivity = await AccountInactivity.findOne({ userId: req.user.id });

    if (!inactivity) {
      return res.status(404).json({
        success: false,
        message: 'Inactivity record not found',
      });
    }

    const result = await inactivity.verifyReactivationCode(code);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      accountStatus: 'active',
    });
  } catch (error) {
    console.error('Error in verifyReactivationCode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify reactivation code',
      error: error.message,
    });
  }
};

// ==================== ADMIN OPERATIONS ====================

// @desc    Block account (admin)
// @route   POST /api/inactivity/admin/block-account/:userId
// @access  Private/Admin
exports.blockAccountAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Admin action' } = req.body;

    const inactivity = await AccountInactivity.findOne({ userId });
    const account = await Account.findOne({ userId });

    if (!inactivity) {
      return res.status(404).json({
        success: false,
        message: 'Inactivity record not found',
      });
    }

    await inactivity.blockAccount(reason);

    // Update account status
    if (account) {
      account.accountStatus = 'suspended';
      await account.save();
    }

    res.status(200).json({
      success: true,
      message: 'Account blocked successfully',
      accountStatus: 'blocked',
    });
  } catch (error) {
    console.error('Error in blockAccountAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block account',
      error: error.message,
    });
  }
};

// @desc    Unblock account (admin)
// @route   POST /api/inactivity/admin/unblock-account/:userId
// @access  Private/Admin
exports.unblockAccountAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = '' } = req.body;

    const inactivity = await AccountInactivity.findOne({ userId });
    const account = await Account.findOne({ userId });

    if (!inactivity) {
      return res.status(404).json({
        success: false,
        message: 'Inactivity record not found',
      });
    }

    await inactivity.unblockAccount(req.user.id, reason);

    // Update account status
    if (account) {
      account.accountStatus = 'active';
      await account.save();
    }

    res.status(200).json({
      success: true,
      message: 'Account unblocked successfully',
      accountStatus: 'active',
    });
  } catch (error) {
    console.error('Error in unblockAccountAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock account',
      error: error.message,
    });
  }
};

// @desc    Get all inactive accounts (admin)
// @route   GET /api/inactivity/admin/inactive-accounts
// @access  Private/Admin
exports.getInactiveAccountsAdmin = async (req, res) => {
  try {
    const { status = 'warning', limit = 100, skip = 0 } = req.query;

    const inactiveAccounts = await AccountInactivity.find({
      inactivityStatus: status,
    })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ daysSinceLastActivity: -1 });

    const total = await AccountInactivity.countDocuments({ inactivityStatus: status });

    res.status(200).json({
      success: true,
      count: inactiveAccounts.length,
      total,
      accounts: inactiveAccounts.map((acc) => acc.getInactivitySummary()),
    });
  } catch (error) {
    console.error('Error in getInactiveAccountsAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inactive accounts',
      error: error.message,
    });
  }
};

// ==================== EMAIL TEMPLATES ====================

function generateFirstWarningEmail(user, inactivity) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center;">
          <h1>⚠️ Account Inactivity Warning</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear ${user.firstName} ${user.lastName},</p>
          
          <p>We noticed that your bank account has been <strong>inactive for ${inactivity.daysSinceLastActivity} days</strong>.</p>
          
          <div style="background-color: #FFF3E0; border-left: 4px solid #FF9800; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #E65100;">⏰ Important Timeline:</h3>
            <ul style="margin: 10px 0;">
              <li>Days inactive: <strong>${inactivity.daysSinceLastActivity}/${inactivity.thresholds.firstWarning} days</strong> ⚠️ (This Warning)</li>
              <li>Next warning: <strong>${inactivity.thresholds.secondWarning} days</strong></li>
              <li>Account block: <strong>${inactivity.thresholds.accountBlock} days</strong></li>
            </ul>
          </div>
          
          <h3>🎯 What You Need to Do:</h3>
          <p>To keep your account active, please perform any transaction within the next few days:</p>
          <ul>
            <li>Check your account balance</li>
            <li>Transfer money to another account</li>
            <li>Pay a bill</li>
            <li>Request money</li>
            <li>Any other banking transaction</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/dashboard" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          
          <p><strong>⚠️ Warning:</strong> If you don't perform any activity, your account may be blocked.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #666;">
            If you have any questions, please contact our customer support team.
          </p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2026 Your Banking App. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

function generateSecondWarningEmail(user, inactivity) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #FF6F00; color: white; padding: 20px; text-align: center;">
          <h1>⚠️⚠️ URGENT: Second Inactivity Warning</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear ${user.firstName} ${user.lastName},</p>
          
          <p>Your account has been inactive for <strong>${inactivity.daysSinceLastActivity} days</strong>. This is your <strong>SECOND WARNING</strong>.</p>
          
          <div style="background-color: #FFEBEE; border-left: 4px solid #D32F2F; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #B71C1C;">⏰ Critical Timeline:</h3>
            <ul style="margin: 10px 0;">
              <li>Days inactive: <strong>${inactivity.daysSinceLastActivity} days</strong> 🔴</li>
              <li>Final warning: <strong>${inactivity.thresholds.thirdWarning} days</strong></li>
              <li>Account block: <strong>${inactivity.thresholds.accountBlock} days</strong></li>
            </ul>
          </div>
          
          <h3>🚨 TAKE ACTION NOW:</h3>
          <p>You must perform a transaction immediately to prevent your account from being blocked.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/dashboard" style="background-color: #D32F2F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Login Now and Perform a Transaction
            </a>
          </div>
          
          <p><strong>🚨 CRITICAL:</strong> If you don't act within the specified time, your account will be blocked and you won't be able to access your funds.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #666;">
            For support, contact customer service immediately.
          </p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2026 Your Banking App. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

function generateThirdWarningEmail(user, inactivity) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #D32F2F; color: white; padding: 20px; text-align: center;">
          <h1>🚨 CRITICAL: Your Account Will Be BLOCKED</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear ${user.firstName} ${user.lastName},</p>
          
          <p>This is your <strong>FINAL WARNING</strong>. Your account has been inactive for <strong>${inactivity.daysSinceLastActivity} days</strong>.</p>
          
          <div style="background-color: #FFCDD2; border-left: 4px solid #B71C1C; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #B71C1C;">🚨 URGENT TIMELINE:</h3>
            <ul style="margin: 10px 0;">
              <li>Days inactive: <strong style="color: #B71C1C;">${inactivity.daysSinceLastActivity} days</strong></li>
              <li>Days until block: <strong style="color: #B71C1C;">${Math.max(0, inactivity.thresholds.accountBlock - inactivity.daysSinceLastActivity)} days</strong></li>
            </ul>
          </div>
          
          <h3 style="color: #D32F2F;">⚡ ACT IMMEDIATELY:</h3>
          <p>You must log in and perform a transaction RIGHT NOW. This is your last chance before your account is permanently blocked.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/dashboard" style="background-color: #B71C1C; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
              🚨 LOGIN AND SAVE YOUR ACCOUNT NOW
            </a>
          </div>
          
          <p style="color: #D32F2F; font-weight: bold;">
            ⚠️ LAST WARNING: Your account will be blocked in ${Math.max(0, inactivity.thresholds.accountBlock - inactivity.daysSinceLastActivity)} days. After blocking, you won't be able to access your account or funds.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #666;">
            Contact customer support immediately if you need assistance.
          </p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2026 Your Banking App. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

function generateFinalNoticeEmail(user, inactivity) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #fff;">
      <div style="max-width: 600px; margin: 0 auto; border: 3px solid #B71C1C; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #B71C1C; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🚨 ACCOUNT WILL BE BLOCKED IN 7 DAYS 🚨</h1>
        </div>
        
        <div style="padding: 30px; background-color: #FFEBEE;">
          <p style="color: #333; font-size: 16px;">Dear ${user.firstName} ${user.lastName},</p>
          
          <p style="color: #B71C1C; font-weight: bold; font-size: 16px;">
            Your bank account will be <strong>PERMANENTLY BLOCKED</strong> in <strong>7 DAYS</strong>.
          </p>
          
          <div style="background-color: #fff; border: 3px solid #D32F2F; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #B71C1C;">⏰ FINAL COUNTDOWN:</h3>
            <p style="font-size: 24px; color: #B71C1C; text-align: center; margin: 10px 0;">
              <strong>7 DAYS LEFT</strong>
            </p>
            <p style="color: #333;">Days until permanent block: <strong style="color: #B71C1C;">7 DAYS</strong></p>
          </div>
          
          <h3 style="color: #B71C1C;">⚡ WHAT WILL HAPPEN:</h3>
          <ul style="color: #333;">
            <li>Your account will be <strong>locked</strong></li>
            <li>You will <strong>NOT be able to</strong> access your account</li>
            <li>You will <strong>NOT be able to</strong> access your funds</li>
            <li>All transactions will be <strong>blocked</strong></li>
          </ul>
          
          <h3 style="color: #B71C1C;">🚨 HOW TO PREVENT THIS:</h3>
          <p style="color: #333;">
            <strong>Perform ANY banking transaction within the next 7 days:</strong>
          </p>
          <ul style="color: #333;">
            <li>✅ Transfer money</li>
            <li>✅ Check balance</li>
            <li>✅ Pay a bill</li>
            <li>✅ Request money</li>
            <li>✅ Any other transaction</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/dashboard" style="background-color: #B71C1C; color: white; padding: 18px 50px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 18px; border: 2px solid #B71C1C;">
              🚨 LOGIN AND PERFORM A TRANSACTION NOW
            </a>
          </div>
          
          <p style="color: #B71C1C; font-weight: bold; text-align: center; font-size: 14px;">
            This is your LAST CHANCE. Don't delay!
          </p>
          
          <hr style="border: none; border-top: 2px solid #D32F2F; margin: 20px 0;">
          
          <p style="font-size: 13px; color: #333;">
            📞 For immediate assistance, contact our customer support team right away.
          </p>
        </div>
        
        <div style="background-color: #B71C1C; padding: 15px; text-align: center; font-size: 12px; color: white;">
          <p>© 2026 Your Banking App. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

function generateReactivationCodeEmail(user, code) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
          <h1>✅ Account Reactivation Code</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear ${user.firstName} ${user.lastName},</p>
          
          <p>Your account reactivation code has been generated. Use this code to reactivate your account:</p>
          
          <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">Your Reactivation Code:</p>
            <p style="margin: 10px 0; font-size: 28px; font-weight: bold; color: #2E7D32; font-family: monospace; letter-spacing: 2px;">
              ${code}
            </p>
            <p style="margin: 0; font-size: 12px; color: #666;">This code expires in 7 days</p>
          </div>
          
          <h3>How to Reactivate:</h3>
          <ol>
            <li>Open your banking app</li>
            <li>Go to Account Settings or Reactivation</li>
            <li>Enter the code above</li>
            <li>Your account will be immediately reactivated</li>
          </ol>
          
          <p style="color: #F57C00; font-weight: bold;">
            ⏰ This code is valid for 7 days only. Don't share it with anyone.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #666;">
            If you didn't request this code, please contact customer support.
          </p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2026 Your Banking App. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

module.exports = {
  trackActivity,
  getInactivityStatus,
  getInactivityDetails,
  sendFirstWarningEmail,
  sendSecondWarningEmail,
  sendThirdWarningEmail,
  sendFinalNotice,
  generateReactivationCode,
  verifyReactivationCode,
  blockAccountAdmin,
  unblockAccountAdmin,
  getInactiveAccountsAdmin,
};