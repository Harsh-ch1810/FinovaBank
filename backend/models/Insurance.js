// backend/models/Insurance.js
const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  policyNumber: {
    type: String,
    unique: true,
    required: true,
  },
  
  insuranceType: {
    type: String,
    enum: ['life', 'health', 'accident', 'motor'],
    required: true,
  },
  
  // Personal Details
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: String,
  email: String,
  phone: String,
  
  // Policy Details
  policyName: {
    type: String,
    required: true,
  },
  
  coverAmount: {
    type: Number,
    required: true,
  },
  
  monthlyPremium: {
    type: Number,
    required: true,
  },
  
  policyTerm: {
    type: Number, // in years
    required: true,
  },
  
  startDate: {
    type: Date,
    default: Date.now,
  },
  
  maturityDate: Date,
  
  // For Motor Insurance
  vehicleRegistration: String,
  vehicleType: String, // car, bike, truck, etc
  
  // For Health Insurance
  familyMembers: [{
    name: String,
    relationship: String,
    age: Number,
    preExistingConditions: String,
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'lapsed', 'matured'],
    default: 'active',
  },
  
  // Premium Payment
  premiumPaid: {
    type: Number,
    default: 0,
  },
  
  lastPremiumPaidDate: Date,
  nextPremiumDueDate: Date,
  
  // Claims
  claims: [{
    claimNumber: String,
    claimAmount: Number,
    claimDate: Date,
    claimStatus: String,
    description: String,
  }],
  
  // Documents
  documents: {
    policyDocument: String,
    certificateOfInsurance: String,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Insurance', insuranceSchema);