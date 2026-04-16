// banking-app-backend/controllers/profileController.js
const User = require('../models/User');
const Account = require('../models/Account');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -passwordHistory');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get account info
    const account = await Account.findOne({ userId: user._id });

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        fullName: user.getFullName(),
        age: user.age,
      },
      account: {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      maritalStatus,
      dateOfBirth,
      primaryMobileNumber,
      secondaryMobileNumber,
      secondaryEmail,
      occupation,
      annualIncome,
      panNumber,
      currentAddress,
      permanentAddress,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        gender,
        maritalStatus,
        dateOfBirth,
        primaryMobileNumber,
        secondaryMobileNumber,
        secondaryEmail,
        occupation,
        annualIncome,
        panNumber,
        currentAddress,
        permanentAddress,
      },
      { new: true, runValidators: true }
    ).select('-password -passwordHistory');

    // Calculate profile completion
    user.calculateProfileCompletion();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        ...user.toObject(),
        fullName: user.getFullName(),
        profileCompletion: user.profileCompletionPercentage,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/profile/upload-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      });
    }

    // Validate image
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Only JPEG, PNG, and WebP images are allowed',
      });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      // 5MB
      return res.status(400).json({
        success: false,
        message: 'Image size should not exceed 5MB',
      });
    }

    // In production, you would upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll store the path
    const imageUrl = `/uploads/profile-pictures/${req.user.id}-${Date.now()}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: imageUrl },
      { new: true }
    ).select('-password -passwordHistory');

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: imageUrl,
    });
  } catch (error) {
    console.error('Upload picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload picture',
      error: error.message,
    });
  }
};

// @desc    Initiate Aadhaar verification
// @route   POST /api/profile/verify-aadhaar
// @access  Private
exports.initiateAadhaarVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.aadhaarVerified) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar already verified',
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.aadhaarVerificationOTP = otp;
    user.aadhaarVerificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Finova Bank - Aadhaar Verification OTP',
      html: `
        <h2>Aadhaar Verification OTP</h2>
        <p>Hi ${user.firstName},</p>
        <p>Your OTP for Aadhaar verification is:</p>
        <h3 style="color: #d32f2f; letter-spacing: 3px;">${otp}</h3>
        <p><strong>This OTP is valid for 10 minutes.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br/>Finova Bank Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your registered email',
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Aadhaar verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate verification',
      error: error.message,
    });
  }
};

// @desc    Verify Aadhaar with OTP
// @route   POST /api/profile/verify-aadhaar-otp
// @access  Private
exports.verifyAadhaarOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide OTP',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.aadhaarVerificationOTP) {
      return res.status(400).json({
        success: false,
        message: 'Please initiate verification first',
      });
    }

    if (new Date() > user.aadhaarVerificationOTPExpires) {
      user.aadhaarVerificationOTP = undefined;
      user.aadhaarVerificationOTPExpires = undefined;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
      });
    }

    if (user.aadhaarVerificationOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Mark as verified
    user.aadhaarVerified = true;
    user.aadhaarVerificationOTP = undefined;
    user.aadhaarVerificationOTPExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Aadhaar verified successfully',
      aadhaarVerified: user.aadhaarVerified,
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message,
    });
  }
};

// @desc    Update password
// @route   POST /api/profile/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all password fields',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Check if new password was used before
    const isUsedBefore = await user.isPasswordUsedBefore(newPassword);
    if (isUsedBefore) {
      return res.status(400).json({
        success: false,
        message: 'Cannot use a password you have used before. Please choose a new password.',
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

// @desc    Update secondary email
// @route   POST /api/profile/update-secondary-email
// @access  Private
exports.updateSecondaryEmail = async (req, res) => {
  try {
    const { secondaryEmail } = req.body;

    if (!secondaryEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide secondary email',
      });
    }

    // Validate email
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(secondaryEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { secondaryEmail },
      { new: true }
    ).select('-password -passwordHistory');

    // Send verification email to new secondary email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: secondaryEmail,
      subject: 'Finova Bank - Email Verification',
      html: `
        <h2>Email Verification</h2>
        <p>Hi ${user.firstName},</p>
        <p>This email has been added as your secondary email for Finova Bank.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br/>Finova Bank Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Secondary email updated successfully',
      secondaryEmail: user.secondaryEmail,
    });
  } catch (error) {
    console.error('Update secondary email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update secondary email',
      error: error.message,
    });
  }
};

// @desc    Get profile completion status
// @route   GET /api/profile/completion-status
// @access  Private
exports.getProfileCompletionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const completionStatus = {
      overall: user.profileCompletionPercentage,
      fields: {
        personalInfo: {
          firstName: !!user.firstName,
          lastName: !!user.lastName,
          dateOfBirth: !!user.dateOfBirth,
          gender: !!user.gender,
          maritalStatus: !!user.maritalStatus,
        },
        contactInfo: {
          primaryMobileNumber: !!user.primaryMobileNumber,
          secondaryMobileNumber: !!user.secondaryMobileNumber,
          secondaryEmail: !!user.secondaryEmail,
        },
        identityDocuments: {
          aadhaarNumber: !!user.aadhaarNumber,
          aadhaarVerified: user.aadhaarVerified,
          panNumber: !!user.panNumber,
        },
        professionalInfo: {
          occupation: !!user.occupation,
          annualIncome: !!user.annualIncome,
        },
        addressInfo: {
          currentAddress: !!(
            user.currentAddress?.street &&
            user.currentAddress?.city &&
            user.currentAddress?.state &&
            user.currentAddress?.postalCode
          ),
          permanentAddress: !!(
            user.permanentAddress?.street &&
            user.permanentAddress?.city &&
            user.permanentAddress?.state &&
            user.permanentAddress?.postalCode
          ),
        },
        other: {
          profilePicture: !!user.profilePicture,
        },
      },
    };

    res.status(200).json({
      success: true,
      completionStatus,
    });
  } catch (error) {
    console.error('Get completion status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completion status',
      error: error.message,
    });
  }
};