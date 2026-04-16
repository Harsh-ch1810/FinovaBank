const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // ==================== BASIC INFO ====================
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  secondaryEmail: {
    type: String,
    lowercase: true,
    default: null,
  },
  password: {
    type: String,
    required: true,
  },

  // ==================== PERSONAL INFO ====================
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    required: true,
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'],
    required: true,
  },

  // ==================== CONTACT INFO ====================
  mobileNumber: {
    type: String,
    required: true,
  },
  secondaryMobile: {
    type: String,
    default: null,
  },

  // ==================== PROFESSIONAL INFO ====================
  occupation: {
    type: String,
    required: true,
    enum: [
      'Service',
      'Business',
      'Professional',
      'Agriculture',
      'Student',
      'Homemaker',
      'Retired',
      'Other'
    ],
  },
  annualIncome: {
    type: Number,
    required: true,
    min: 0,
  },

  // ==================== GOVERNMENT IDs ====================
  panNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  },
  aadhaar: {
    type: String,
    required: true,
    unique: true,
  },

  // ==================== ADDRESS INFO ====================
  currentAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  permanentAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  sameAsCurrentAddress: {
    type: Boolean,
    default: false,
  },

  // ==================== SECURITY QUESTION ====================
  securityQuestion: {
    type: String,
    required: true,
    enum: [
      "What is your pet's name?",
      "What is the name of your first school?",
      "What is your favorite color?",
      "What is your favorite movie?",
      "What city were you born in?",
      "What is your favorite food?",
      "What is your best friend's name?",
      "What is your favorite sports team?",
    ],
  },
  securityAnswer: {
    type: String,
    required: true,
  },

  // ==================== ACCOUNT SECURITY ====================
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },

  // ✅ FIX ADDED HERE
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

  // ==================== VERIFICATION STATUS ====================
  emailVerified: { type: Boolean, default: false },
  mobileVerified: { type: Boolean, default: false },
  panVerified: { type: Boolean, default: false },
  aadhaarVerified: { type: Boolean, default: false },

  // ==================== TIMESTAMPS ====================
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ==================== HOOKS ====================
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isModified('securityAnswer')) {
    const salt = await bcrypt.genSalt(10);
    const answerToHash = this.securityAnswer.toLowerCase().trim();
    this.securityAnswer = await bcrypt.hash(answerToHash, salt);
  }

  this.updatedAt = Date.now();
  next();
});

// ==================== METHODS ====================
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.compareSecurityAnswer = async function (enteredAnswer) {
  const answerToCompare = enteredAnswer.toLowerCase().trim();
  return await bcrypt.compare(answerToCompare, this.securityAnswer);
};

userSchema.methods.updatePassword = async function (newPassword) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(newPassword, salt);
  this.failedLoginAttempts = 0;
  this.accountLocked = false;
  this.lockUntil = undefined;
  await this.save();
};

userSchema.methods.isAccountLocked = function () {
  return this.accountLocked && this.lockUntil > Date.now();
};

userSchema.methods.unlockAccount = function () {
  this.failedLoginAttempts = 0;
  this.accountLocked = false;
  this.lockUntil = undefined;
};

userSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

userSchema.methods.getAge = function () {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

userSchema.methods.getFormattedCurrentAddress = function () {
  const addr = this.currentAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
};

userSchema.methods.getFormattedPermanentAddress = function () {
  const addr = this.permanentAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
};

module.exports = mongoose.model('User', userSchema);