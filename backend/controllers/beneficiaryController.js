// banking-app-backend/controllers/beneficiaryController.js
const Beneficiary = require('../models/Beneficiary');
const User = require('../models/User');
const Account = require('../models/Account');
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// @desc    Add beneficiary
// @route   POST /api/beneficiary/add
// @access  Private
exports.addBeneficiary = async (req, res) => {
  try {
    const {
      beneficiaryEmail,
      beneficiaryMobileNumber,
      accountNumber,
      category,
      nickname,
      relationshipType,
      verificationEmail,
    } = req.body;

    // Validation
    if (!beneficiaryEmail || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide beneficiary email and account number',
      });
    }

    // Find beneficiary user by account number
    const beneficiaryAccount = await Account.findOne({ accountNumber });

    if (!beneficiaryAccount) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    const beneficiaryUser = await User.findById(beneficiaryAccount.userId);

    if (!beneficiaryUser) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    // Check if already added
    const existingBeneficiary = await Beneficiary.findOne({
      userId: req.user.id,
      beneficiaryUserId: beneficiaryUser._id,
    });

    if (existingBeneficiary) {
      return res.status(409).json({
        success: false,
        message: 'This beneficiary is already added',
      });
    }

    // Check for self-transfer
    if (req.user.id.toString() === beneficiaryUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself as beneficiary',
      });
    }

    // Create beneficiary
    const beneficiary = new Beneficiary({
      userId: req.user.id,
      beneficiaryUserId: beneficiaryUser._id,
      beneficiaryName: beneficiaryUser.getFullName(),
      beneficiaryEmail: beneficiaryUser.email,
      beneficiaryMobileNumber: beneficiaryUser.primaryMobileNumber,
      accountNumber,
      category,
      nickname: nickname || beneficiaryUser.getFullName(),
      relationshipType,
      verificationEmail: verificationEmail || beneficiaryUser.email,
    });

    // Generate verification OTP
    const otp = beneficiary.generateVerificationOTP();

    await beneficiary.save();

    // Add to account's saved beneficiaries
    const account = await Account.findOne({ userId: req.user.id });
    account.savedBeneficiaries.push(beneficiary._id);
    await account.save();

    // Send verification email to beneficiary
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: verificationEmail || beneficiaryUser.email,
      subject: 'Finova Bank - Beneficiary Verification Request',
      html: `
        <h2>Beneficiary Verification Request</h2>
        <p>Hi ${beneficiaryUser.firstName},</p>
        <p>${
          (await User.findById(req.user.id)).getFullName()
        } has added you as a beneficiary for money transfers.</p>
        <p>To confirm, please verify using this OTP:</p>
        <h3 style="color: #d32f2f; letter-spacing: 3px;">${otp}</h3>
        <p><strong>This OTP is valid for 10 minutes.</strong></p>
        <p>If you didn't expect this, please ignore this email or contact support.</p>
        <p>Best regards,<br/>Finova Bank Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: 'Beneficiary added. Verification email sent.',
      beneficiary: {
        id: beneficiary._id,
        name: beneficiary.beneficiaryName,
        accountNumber: beneficiary.accountNumber,
        category: beneficiary.category,
        isVerified: beneficiary.isVerified,
      },
    });
  } catch (error) {
    console.error('Add beneficiary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add beneficiary',
      error: error.message,
    });
  }
};

// @desc    Verify beneficiary OTP
// @route   POST /api/beneficiary/:id/verify-otp
// @access  Private
exports.verifyBeneficiaryOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const { id } = req.params;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide OTP',
      });
    }

    const beneficiary = await Beneficiary.findById(id);

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    if (beneficiary.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Verify OTP
    try {
      beneficiary.verifyOTP(otp);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    await beneficiary.save();

    res.status(200).json({
      success: true,
      message: 'Beneficiary verified successfully',
      beneficiary: {
        id: beneficiary._id,
        name: beneficiary.beneficiaryName,
        isVerified: beneficiary.isVerified,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message,
    });
  }
};

// @desc    Get all beneficiaries
// @route   GET /api/beneficiary/list
// @access  Private
exports.getBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find({
      userId: req.user.id,
      isActive: true,
    }).select('-verificationOTP -verificationOTPExpires');

    res.status(200).json({
      success: true,
      count: beneficiaries.length,
      beneficiaries,
    });
  } catch (error) {
    console.error('Get beneficiaries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beneficiaries',
      error: error.message,
    });
  }
};

// @desc    Get verified beneficiaries only
// @route   GET /api/beneficiary/verified
// @access  Private
exports.getVerifiedBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find({
      userId: req.user.id,
      isActive: true,
      isVerified: true,
    }).select('_id beneficiaryName accountNumber category nickname totalTransfersCount lastTransferDate');

    res.status(200).json({
      success: true,
      count: beneficiaries.length,
      beneficiaries,
    });
  } catch (error) {
    console.error('Get verified beneficiaries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verified beneficiaries',
      error: error.message,
    });
  }
};

// @desc    Delete beneficiary
// @route   DELETE /api/beneficiary/:id
// @access  Private
exports.deleteBeneficiary = async (req, res) => {
  try {
    const { id } = req.params;

    const beneficiary = await Beneficiary.findById(id);

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    if (beneficiary.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Soft delete
    beneficiary.isActive = false;
    await beneficiary.save();

    // Remove from account's saved beneficiaries
    await Account.findOneAndUpdate({ userId: req.user.id }, {
      $pull: { savedBeneficiaries: id },
    });

    res.status(200).json({
      success: true,
      message: 'Beneficiary removed',
    });
  } catch (error) {
    console.error('Delete beneficiary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete beneficiary',
      error: error.message,
    });
  }
};

// @desc    Update beneficiary
// @route   PUT /api/beneficiary/:id
// @access  Private
exports.updateBeneficiary = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, nickname, relationshipType } = req.body;

    const beneficiary = await Beneficiary.findById(id);

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    if (beneficiary.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Update fields
    if (category) beneficiary.category = category;
    if (nickname) beneficiary.nickname = nickname;
    if (relationshipType) beneficiary.relationshipType = relationshipType;

    await beneficiary.save();

    res.status(200).json({
      success: true,
      message: 'Beneficiary updated successfully',
      beneficiary,
    });
  } catch (error) {
    console.error('Update beneficiary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update beneficiary',
      error: error.message,
    });
  }
};

// @desc    Get beneficiary details
// @route   GET /api/beneficiary/:id
// @access  Private
exports.getBeneficiaryDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const beneficiary = await Beneficiary.findById(id);

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    if (beneficiary.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.status(200).json({
      success: true,
      beneficiary,
    });
  } catch (error) {
    console.error('Get beneficiary details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beneficiary details',
      error: error.message,
    });
  }
};

// @desc    Resend verification OTP
// @route   POST /api/beneficiary/:id/resend-otp
// @access  Private
exports.resendVerificationOTP = async (req, res) => {
  try {
    const { id } = req.params;

    const beneficiary = await Beneficiary.findById(id);

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    if (beneficiary.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (beneficiary.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary already verified',
      });
    }

    // Generate new OTP
    const otp = beneficiary.generateVerificationOTP();
    await beneficiary.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: beneficiary.verificationEmail,
      subject: 'Finova Bank - Beneficiary Verification OTP',
      html: `
        <h2>Beneficiary Verification OTP</h2>
        <p>Your verification OTP is:</p>
        <h3 style="color: #d32f2f; letter-spacing: 3px;">${otp}</h3>
        <p><strong>This OTP is valid for 10 minutes.</strong></p>
        <p>Best regards,<br/>Finova Bank Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: error.message,
    });
  }
};