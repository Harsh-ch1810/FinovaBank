// backend/controllers/insuranceController.js
const Insurance = require('../models/Insurance');
const Account = require('../models/Account');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate policy number
const generatePolicyNumber = (type) => {
  const prefix = {
    life: 'LIF',
    health: 'HEA',
    accident: 'ACC',
    motor: 'MOT',
  };
  return `${prefix[type]}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

// ==================== BUY INSURANCE ====================
exports.buyInsurance = async (req, res) => {
  try {
    const {
      insuranceType,
      policyName,
      coverAmount,
      monthlyPremium,
      policyTerm,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      vehicleRegistration,
      vehicleType,
      familyMembers,
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Validate coverage amount
    const minCover = {
      life: 100000,
      health: 200000,
      accident: 50000,
      motor: 300000,
    };

    const maxCover = {
      life: 10000000,
      health: 5000000,
      accident: 2000000,
      motor: 5000000,
    };

    if (coverAmount < minCover[insuranceType] || coverAmount > maxCover[insuranceType]) {
      return res.status(400).json({
        success: false,
        message: `Coverage amount must be between ₹${minCover[insuranceType]} and ₹${maxCover[insuranceType]}`,
      });
    }

    // Calculate maturity date
    const startDate = new Date();
    const maturityDate = new Date(startDate);
    maturityDate.setFullYear(maturityDate.getFullYear() + policyTerm);

    // Calculate next premium due date
    const nextPremiumDueDate = new Date(startDate);
    nextPremiumDueDate.setMonth(nextPremiumDueDate.getMonth() + 1);

    // Create insurance policy
    const policyNumber = generatePolicyNumber(insuranceType);

    const insurance = new Insurance({
      userId,
      policyNumber,
      insuranceType,
      policyName,
      coverAmount,
      monthlyPremium,
      policyTerm,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      vehicleRegistration: insuranceType === 'motor' ? vehicleRegistration : undefined,
      vehicleType: insuranceType === 'motor' ? vehicleType : undefined,
      familyMembers: insuranceType === 'health' ? familyMembers : undefined,
      startDate,
      maturityDate,
      nextPremiumDueDate,
      status: 'active',
      premiumPaid: monthlyPremium,
      lastPremiumPaidDate: startDate,
    });

    await insurance.save();

    // Deduct first premium from account
    const account = await Account.findOne({ userId });
    if (account && account.balance >= monthlyPremium) {
      account.balance -= monthlyPremium;
      await account.save();
    }

    // Send email notification
    const user = await User.findById(userId);
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '✅ Insurance Policy Activated',
        html: `
          <h2>Insurance Policy Activated</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your ${insuranceType.toUpperCase()} insurance policy has been successfully activated.</p>
          <p><strong>Policy Number:</strong> ${policyNumber}</p>
          <p><strong>Coverage Amount:</strong> ₹${coverAmount.toLocaleString('en-IN')}</p>
          <p><strong>Monthly Premium:</strong> ₹${monthlyPremium.toLocaleString('en-IN')}</p>
          <p><strong>Policy Term:</strong> ${policyTerm} years</p>
          <p><strong>Maturity Date:</strong> ${maturityDate.toLocaleDateString('en-IN')}</p>
          <p><strong>Next Premium Due:</strong> ${nextPremiumDueDate.toLocaleDateString('en-IN')}</p>
        `,
      });
    } catch (emailError) {
      console.warn('Email notification failed');
    }

    res.status(201).json({
      success: true,
      message: 'Insurance policy purchased successfully',
      policy: {
        policyNumber,
        insuranceType,
        coverAmount,
        monthlyPremium,
        status: 'active',
        nextPremiumDueDate,
      },
    });
  } catch (error) {
    console.error('Insurance purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to purchase insurance',
    });
  }
};

// ==================== GET MY POLICIES ====================
exports.getMyPolicies = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const policies = await Insurance.find({ userId }).sort({ createdAt: -1 });

    // Add days until maturity
    const policiesWithDays = policies.map((policy) => {
      const today = new Date();
      const daysUntilMaturity = Math.ceil(
        (policy.maturityDate - today) / (1000 * 60 * 60 * 24)
      );

      return {
        ...policy.toObject(),
        daysUntilMaturity,
      };
    });

    res.status(200).json({
      success: true,
      policies: policiesWithDays,
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policies',
    });
  }
};

// ==================== GET POLICY DETAILS ====================
exports.getPolicyDetails = async (req, res) => {
  try {
    const { policyNumber } = req.params;
    const userId = req.user?.id;

    const policy = await Insurance.findOne({ policyNumber, userId });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
      });
    }

    res.status(200).json({
      success: true,
      policy,
    });
  } catch (error) {
    console.error('Error fetching policy details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy details',
    });
  }
};

// ==================== FILE CLAIM ====================
exports.fileClaim = async (req, res) => {
  try {
    const { policyNumber, claimAmount, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const policy = await Insurance.findOne({ policyNumber, userId });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
      });
    }

    if (policy.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Policy is not active',
      });
    }

    const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Add claim to policy
    policy.claims.push({
      claimNumber,
      claimAmount,
      claimDate: new Date(),
      claimStatus: 'pending',
      description,
    });

    await policy.save();

    // Send email notification
    const user = await User.findById(userId);
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '📋 Insurance Claim Filed',
        html: `
          <h2>Insurance Claim Filed</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your insurance claim has been filed successfully.</p>
          <p><strong>Claim Number:</strong> ${claimNumber}</p>
          <p><strong>Policy Number:</strong> ${policyNumber}</p>
          <p><strong>Claim Amount:</strong> ₹${claimAmount.toLocaleString('en-IN')}</p>
          <p><strong>Status:</strong> Pending Review</p>
          <p>We will review your claim and contact you within 5-7 business days.</p>
        `,
      });
    } catch (emailError) {
      console.warn('Email notification failed');
    }

    res.status(201).json({
      success: true,
      message: 'Claim filed successfully',
      claim: {
        claimNumber,
        claimAmount,
        status: 'pending',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Claim filing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to file claim',
    });
  }
};

// ==================== PAY PREMIUM ====================
exports.payPremium = async (req, res) => {
  try {
    const { policyNumber } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const policy = await Insurance.findOne({ policyNumber, userId });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
      });
    }

    // Check account balance
    const account = await Account.findOne({ userId });
    if (!account || account.balance < policy.monthlyPremium) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to pay premium',
      });
    }

    // Deduct premium
    account.balance -= policy.monthlyPremium;
    await account.save();

    // Update policy
    policy.premiumPaid += policy.monthlyPremium;
    policy.lastPremiumPaidDate = new Date();
    policy.nextPremiumDueDate = new Date(policy.nextPremiumDueDate);
    policy.nextPremiumDueDate.setMonth(policy.nextPremiumDueDate.getMonth() + 1);
    await policy.save();

    // Send email notification
    const user = await User.findById(userId);
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '✅ Premium Payment Successful',
        html: `
          <h2>Insurance Premium Paid</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your insurance premium has been paid successfully.</p>
          <p><strong>Policy Number:</strong> ${policyNumber}</p>
          <p><strong>Amount Paid:</strong> ₹${policy.monthlyPremium.toLocaleString('en-IN')}</p>
          <p><strong>Next Due Date:</strong> ${policy.nextPremiumDueDate.toLocaleDateString('en-IN')}</p>
        `,
      });
    } catch (emailError) {
      console.warn('Email notification failed');
    }

    res.status(200).json({
      success: true,
      message: 'Premium paid successfully',
      payment: {
        policyNumber,
        amount: policy.monthlyPremium,
        nextDueDate: policy.nextPremiumDueDate,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Premium payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to pay premium',
    });
  }
};

// ==================== GET INSURANCE PLANS ====================
exports.getInsurancePlans = async (req, res) => {
  try {
    const { type } = req.query;

    const plans = {
      life: [
        {
          name: 'Basic Life Cover',
          minCover: 500000,
          maxCover: 2000000,
          minPremium: 499,
          description: 'Essential life insurance coverage',
        },
        {
          name: 'Premium Life Cover',
          minCover: 2000001,
          maxCover: 5000000,
          minPremium: 999,
          description: 'Comprehensive life insurance with benefits',
        },
        {
          name: 'Wealth Builder',
          minCover: 5000001,
          maxCover: 10000000,
          minPremium: 1999,
          description: 'Investment-linked life insurance',
        },
      ],
      health: [
        {
          name: 'Basic Health',
          minCover: 200000,
          maxCover: 500000,
          minPremium: 299,
          description: 'Basic health coverage for individual',
        },
        {
          name: 'Family Health',
          minCover: 500001,
          maxCover: 2000000,
          minPremium: 799,
          description: 'Health coverage for entire family',
        },
        {
          name: 'Premium Health Plus',
          minCover: 2000001,
          maxCover: 5000000,
          minPremium: 1499,
          description: 'Comprehensive health coverage with cashless treatment',
        },
      ],
      accident: [
        {
          name: 'Basic Accident Cover',
          minCover: 50000,
          maxCover: 500000,
          minPremium: 99,
          description: 'Personal accident insurance',
        },
        {
          name: 'Family Accident Plus',
          minCover: 500001,
          maxCover: 2000000,
          minPremium: 299,
          description: 'Family accident protection',
        },
      ],
      motor: [
        {
          name: 'Third Party Liability',
          minCover: 300000,
          maxCover: 1000000,
          minPremium: 299,
          description: 'Basic third party coverage as per law',
        },
        {
          name: 'Comprehensive',
          minCover: 1000001,
          maxCover: 5000000,
          minPremium: 599,
          description: 'Full coverage including own damage',
        },
      ],
    };

    if (type && plans[type]) {
      return res.status(200).json({
        success: true,
        plans: plans[type],
      });
    }

    res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance plans',
    });
  }
};