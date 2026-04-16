// backend/models/Admin.js - ADMIN MODEL
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  // ==================== BASIC INFO ====================
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },

  // ==================== ADMIN DETAILS ====================
  adminId: {
    type: String,
    unique: true,
    default: () => `ADMIN-${Date.now()}`,
  },
  adminLevel: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin',
  },
  department: {
    type: String,
    enum: ['Customer Service', 'Fraud Detection', 'Loan Management', 'Account Management', 'System Admin'],
    default: 'Customer Service',
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    default: 'Administrator',
  },

  // ==================== PERMISSIONS ====================
  permissions: {
    canApproveLoans: { type: Boolean, default: false },
    canRejectLoans: { type: Boolean, default: false },
    canFreezeAccounts: { type: Boolean, default: false },
    canBlockUsers: { type: Boolean, default: false },
    canViewTransactions: { type: Boolean, default: true },
    canViewReports: { type: Boolean, default: true },
    canManageUsers: { type: Boolean, default: false },
    canManageAdmins: { type: Boolean, default: false },
    canAccessFraudDetection: { type: Boolean, default: false },
    canModifySystemSettings: { type: Boolean, default: false },
  },

  // ==================== ACCOUNT STATUS ====================
  isActive: {
    type: Boolean,
    default: true,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  accountLocked: {
    type: Boolean,
    default: false,
  },
  lockUntil: Date,

  // ==================== ACTIVITY TRACKING ====================
  lastLogin: Date,
  lastActivityTime: Date,
  loginHistory: [
    {
      timestamp: Date,
      ipAddress: String,
      userAgent: String,
      status: { type: String, enum: ['success', 'failed'] },
    },
  ],

  // ==================== ACTIVITY LOGS ====================
  activityLog: [
    {
      timestamp: { type: Date, default: Date.now },
      action: String,
      description: String,
      targetUserId: mongoose.Schema.Types.ObjectId,
      targetUserEmail: String,
      result: { type: String, enum: ['success', 'failed'], default: 'success' },
    },
  ],

  // ==================== TIMESTAMPS ====================
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ==================== HOOKS ====================
adminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  this.updatedAt = Date.now();
  next();
});

// ==================== METHODS ====================
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.isAccountLocked = function () {
  return this.accountLocked && this.lockUntil > Date.now();
};

adminSchema.methods.unlockAccount = function () {
  this.failedLoginAttempts = 0;
  this.accountLocked = false;
  this.lockUntil = undefined;
};

adminSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

adminSchema.methods.logActivity = function (action, description, targetUserId, targetUserEmail, result = 'success') {
  this.activityLog.push({
    timestamp: new Date(),
    action,
    description,
    targetUserId,
    targetUserEmail,
    result,
  });
  
  // Keep only last 100 activities
  if (this.activityLog.length > 100) {
    this.activityLog.shift();
  }
};

adminSchema.methods.logLoginAttempt = function (ipAddress, userAgent, status) {
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    status,
  });

  // Keep only last 50 logins
  if (this.loginHistory.length > 50) {
    this.loginHistory.shift();
  }
};

adminSchema.methods.hasPermission = function (permission) {
  return this.permissions[permission] === true;
};

module.exports = mongoose.model('Admin', adminSchema);