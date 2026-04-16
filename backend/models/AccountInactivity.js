// banking-app-backend/models/AccountInactivity.js
const mongoose = require('mongoose');

const accountInactivitySchema = new mongoose.Schema({
  // ==================== USER REFERENCE ====================
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },

  // ==================== INACTIVITY TRACKING ====================
  lastActivityDate: {
    type: Date,
    default: Date.now,
  },

  lastActivityType: {
    type: String,
    enum: [
      'login',
      'transaction',
      'bill_payment',
      'transfer',
      'balance_check',
      'statement_view',
      'logout',
      'other',
    ],
    default: 'login',
  },

  // Days since last activity
  daysSinceLastActivity: {
    type: Number,
    default: 0,
  },

  // Total days account has been inactive
  totalInactiveDays: {
    type: Number,
    default: 0,
  },

  // ==================== INACTIVITY STATUS ====================
  inactivityStatus: {
    type: String,
    enum: ['active', 'warning', 'dormant', 'blocked'],
    default: 'active',
  },

  // Account is blocked or not
  isAccountBlocked: {
    type: Boolean,
    default: false,
  },

  blockedDate: Date,
  blockReason: String,

  // ==================== WARNING NOTIFICATIONS ====================
  firstWarningEmailSent: {
    sent: { type: Boolean, default: false },
    sentDate: Date,
    daysSinceLastActivity: Number, // Days when warning was sent
  },

  secondWarningEmailSent: {
    sent: { type: Boolean, default: false },
    sentDate: Date,
    daysSinceLastActivity: Number,
  },

  thirdWarningEmailSent: {
    sent: { type: Boolean, default: false },
    sentDate: Date,
    daysSinceLastActivity: Number,
  },

  // Final notice before blocking
  finalNoticeEmailSent: {
    sent: { type: Boolean, default: false },
    sentDate: Date,
    daysSinceLastActivity: Number,
  },

  // ==================== NOTIFICATION SETTINGS ====================
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    inAppNotifications: { type: Boolean, default: true },
  },

  // ==================== REACTIVATION ====================
  reactivationAttempts: {
    type: Number,
    default: 0,
  },

  lastReactivationDate: Date,

  // ==================== CONFIGURATION ====================
  // Days threshold for each warning level
  thresholds: {
    firstWarning: { type: Number, default: 30 }, // 30 days
    secondWarning: { type: Number, default: 60 }, // 60 days
    thirdWarning: { type: Number, default: 90 }, // 90 days
    accountBlock: { type: Number, default: 180 }, // 180 days (6 months)
  },

  // Excluded activities (what counts as activity)
  excludedActivities: [String],

  // ==================== ACCOUNT DETAILS ====================
  accountNumber: String,
  accountType: String,

  // ==================== REACTIVATION REQUIREMENTS ====================
  reactivationRequired: {
    type: Boolean,
    default: false,
  },

  reactivationCode: {
    code: String,
    generatedAt: Date,
    expiresAt: Date,
    used: { type: Boolean, default: false },
    usedAt: Date,
  },

  // ==================== EMAIL HISTORY ====================
  emailsSent: [
    {
      emailType: {
        type: String,
        enum: ['first_warning', 'second_warning', 'third_warning', 'final_notice', 'reactivation'],
      },
      sentAt: Date,
      daysSinceLastActivity: Number,
      recipientEmail: String,
      status: { type: String, enum: ['sent', 'failed', 'bounced'] },
      retries: { type: Number, default: 0 },
    },
  ],

  // ==================== ADMIN NOTES ====================
  adminNotes: String,
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

  nextCheckDate: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
});

// ==================== INDEXES ====================
accountInactivitySchema.index({ userId: 1 });
accountInactivitySchema.index({ inactivityStatus: 1 });
accountInactivitySchema.index({ lastActivityDate: -1 });
accountInactivitySchema.index({ nextCheckDate: 1 });
accountInactivitySchema.index({ isAccountBlocked: 1 });

// ==================== HOOKS ====================
accountInactivitySchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // Calculate days since last activity
  const timeDiff = Date.now() - new Date(this.lastActivityDate);
  this.daysSinceLastActivity = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  next();
});

// ==================== METHODS ====================

/**
 * Update activity
 */
accountInactivitySchema.methods.recordActivity = async function (activityType = 'other') {
  this.lastActivityDate = Date.now();
  this.lastActivityType = activityType;
  this.daysSinceLastActivity = 0;
  this.inactivityStatus = 'active';
  this.reactivationAttempts += 1;
  this.lastReactivationDate = Date.now();

  // Reset if account was in warning/dormant status
  if (this.inactivityStatus === 'warning' || this.inactivityStatus === 'dormant') {
    // Reset warning flags
    this.firstWarningEmailSent.sent = false;
    this.secondWarningEmailSent.sent = false;
    this.thirdWarningEmailSent.sent = false;
    this.finalNoticeEmailSent.sent = false;
  }

  await this.save();
};

/**
 * Check inactivity status
 */
accountInactivitySchema.methods.checkInactivityStatus = async function () {
  const daysSinceActivity = this.daysSinceLastActivity;
  const { firstWarning, secondWarning, thirdWarning, accountBlock } = this.thresholds;

  if (this.isAccountBlocked) {
    this.inactivityStatus = 'blocked';
  } else if (daysSinceActivity >= accountBlock) {
    this.inactivityStatus = 'blocked';
    this.isAccountBlocked = true;
    this.blockedDate = Date.now();
    this.blockReason = 'Account blocked due to inactivity';
  } else if (daysSinceActivity >= thirdWarning) {
    this.inactivityStatus = 'dormant';
  } else if (daysSinceActivity >= secondWarning) {
    this.inactivityStatus = 'warning';
  } else if (daysSinceActivity >= firstWarning) {
    this.inactivityStatus = 'warning';
  } else {
    this.inactivityStatus = 'active';
  }

  await this.save();
  return this.inactivityStatus;
};

/**
 * Check if first warning email should be sent
 */
accountInactivitySchema.methods.shouldSendFirstWarning = function () {
  return (
    !this.firstWarningEmailSent.sent &&
    this.daysSinceLastActivity >= this.thresholds.firstWarning &&
    this.daysSinceLastActivity < this.thresholds.secondWarning
  );
};

/**
 * Check if second warning email should be sent
 */
accountInactivitySchema.methods.shouldSendSecondWarning = function () {
  return (
    !this.secondWarningEmailSent.sent &&
    this.daysSinceLastActivity >= this.thresholds.secondWarning &&
    this.daysSinceLastActivity < this.thresholds.thirdWarning
  );
};

/**
 * Check if third warning email should be sent
 */
accountInactivitySchema.methods.shouldSendThirdWarning = function () {
  return (
    !this.thirdWarningEmailSent.sent &&
    this.daysSinceLastActivity >= this.thresholds.thirdWarning &&
    this.daysSinceLastActivity < this.thresholds.accountBlock
  );
};

/**
 * Check if final notice email should be sent
 */
accountInactivitySchema.methods.shouldSendFinalNotice = function () {
  return (
    !this.finalNoticeEmailSent.sent &&
    this.daysSinceLastActivity >= this.thresholds.accountBlock - 7 // 7 days before block
  );
};

/**
 * Mark first warning email as sent
 */
accountInactivitySchema.methods.markFirstWarningSent = async function () {
  this.firstWarningEmailSent = {
    sent: true,
    sentDate: Date.now(),
    daysSinceLastActivity: this.daysSinceLastActivity,
  };

  this.emailsSent.push({
    emailType: 'first_warning',
    sentAt: Date.now(),
    daysSinceLastActivity: this.daysSinceLastActivity,
    status: 'sent',
  });

  await this.save();
};

/**
 * Mark second warning email as sent
 */
accountInactivitySchema.methods.markSecondWarningSent = async function () {
  this.secondWarningEmailSent = {
    sent: true,
    sentDate: Date.now(),
    daysSinceLastActivity: this.daysSinceLastActivity,
  };

  this.emailsSent.push({
    emailType: 'second_warning',
    sentAt: Date.now(),
    daysSinceLastActivity: this.daysSinceLastActivity,
    status: 'sent',
  });

  await this.save();
};

/**
 * Mark third warning email as sent
 */
accountInactivitySchema.methods.markThirdWarningSent = async function () {
  this.thirdWarningEmailSent = {
    sent: true,
    sentDate: Date.now(),
    daysSinceLastActivity: this.daysSinceLastActivity,
  };

  this.emailsSent.push({
    emailType: 'third_warning',
    sentAt: Date.now(),
    daysSinceLastActivity: this.daysSinceLastActivity,
    status: 'sent',
  });

  await this.save();
};

/**
 * Mark final notice email as sent
 */
accountInactivitySchema.methods.markFinalNoticeSent = async function () {
  this.finalNoticeEmailSent = {
    sent: true,
    sentDate: Date.now(),
    daysSinceLastActivity: this.daysSinceLastActivity,
  };

  this.emailsSent.push({
    emailType: 'final_notice',
    sentAt: Date.now(),
    daysSinceLastActivity: this.daysSinceLastActivity,
    status: 'sent',
  });

  await this.save();
};

/**
 * Block account
 */
accountInactivitySchema.methods.blockAccount = async function (reason = 'Inactivity') {
  this.isAccountBlocked = true;
  this.blockedDate = Date.now();
  this.blockReason = reason;
  this.inactivityStatus = 'blocked';
  await this.save();

  return {
    blocked: true,
    message: 'Account blocked due to inactivity',
    reason,
  };
};

/**
 * Unblock account (admin)
 */
accountInactivitySchema.methods.unblockAccount = async function (adminId, reason = '') {
  this.isAccountBlocked = false;
  this.blockedDate = null;
  this.blockReason = null;
  this.inactivityStatus = 'active';
  this.handledBy = adminId;
  this.adminNotes = reason;
  await this.save();

  return {
    unblocked: true,
    message: 'Account unblocked successfully',
  };
};

/**
 * Generate reactivation code
 */
accountInactivitySchema.methods.generateReactivationCode = async function () {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  this.reactivationCode = {
    code,
    generatedAt: Date.now(),
    expiresAt,
    used: false,
  };

  this.reactivationRequired = true;

  await this.save();

  return {
    code,
    expiresAt,
    message: 'Reactivation code generated',
  };
};

/**
 * Verify reactivation code
 */
accountInactivitySchema.methods.verifyReactivationCode = async function (code) {
  const { reactivationCode } = this;

  if (!reactivationCode || !reactivationCode.code) {
    return {
      valid: false,
      message: 'No reactivation code found',
    };
  }

  if (reactivationCode.code !== code) {
    return {
      valid: false,
      message: 'Invalid reactivation code',
    };
  }

  if (reactivationCode.used) {
    return {
      valid: false,
      message: 'Reactivation code already used',
    };
  }

  if (new Date() > new Date(reactivationCode.expiresAt)) {
    return {
      valid: false,
      message: 'Reactivation code expired',
    };
  }

  // Code is valid
  this.reactivationCode.used = true;
  this.reactivationCode.usedAt = Date.now();
  this.reactivationRequired = false;
  this.inactivityStatus = 'active';
  await this.save();

  return {
    valid: true,
    message: 'Account reactivated successfully',
  };
};

/**
 * Get inactivity summary
 */
accountInactivitySchema.methods.getInactivitySummary = function () {
  return {
    userId: this.userId,
    accountNumber: this.accountNumber,
    lastActivityDate: this.lastActivityDate,
    lastActivityType: this.lastActivityType,
    daysSinceLastActivity: this.daysSinceLastActivity,
    inactivityStatus: this.inactivityStatus,
    isAccountBlocked: this.isAccountBlocked,
    warningsSent: {
      firstWarning: this.firstWarningEmailSent.sent,
      secondWarning: this.secondWarningEmailSent.sent,
      thirdWarning: this.thirdWarningEmailSent.sent,
      finalNotice: this.finalNoticeEmailSent.sent,
    },
    thresholds: this.thresholds,
    notificationPreferences: this.notificationPreferences,
  };
};

/**
 * Get next action required
 */
accountInactivitySchema.methods.getNextAction = function () {
  const days = this.daysSinceLastActivity;
  const { firstWarning, secondWarning, thirdWarning, accountBlock } = this.thresholds;

  if (this.isAccountBlocked) {
    return {
      action: 'BLOCKED',
      message: 'Account is blocked',
      daysRemaining: 0,
    };
  }

  if (days >= accountBlock - 7) {
    return {
      action: 'URGENT',
      message: 'Account will be blocked in 7 days',
      daysRemaining: Math.max(0, accountBlock - days),
    };
  }

  if (days >= thirdWarning) {
    return {
      action: 'FINAL_WARNING',
      message: 'Last warning before account block',
      daysRemaining: accountBlock - days,
    };
  }

  if (days >= secondWarning) {
    return {
      action: 'SECOND_WARNING',
      message: 'Second inactivity warning',
      daysRemaining: thirdWarning - days,
    };
  }

  if (days >= firstWarning) {
    return {
      action: 'FIRST_WARNING',
      message: 'First inactivity warning',
      daysRemaining: secondWarning - days,
    };
  }

  return {
    action: 'ACTIVE',
    message: 'Account is active',
    daysRemaining: firstWarning - days,
  };
};

module.exports = mongoose.model('AccountInactivity', accountInactivitySchema);