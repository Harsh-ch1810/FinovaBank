// backend/controllers/authController.js - EXTENDED VERSION
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Account = require('../models/Account');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

console.log('✅ Auth Controller Loaded - All Functions Available');

// ==================== REGISTER ====================
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      secondaryEmail,
      password,
      mobileNumber,
      secondaryMobile,
      dateOfBirth,
      gender,
      maritalStatus,
      occupation,
      annualIncome,
      panNumber,
      aadhaarNumber,
      currentAddress,
      permanentAddress,
      sameAsCurrentAddress,
      securityQuestion,
      securityAnswer,
      accountType,
    } = req.body;

    console.log('📝 Register request for email:', email);

    // Validation
    const requiredFields = [
      'firstName', 'lastName', 'email', 'password', 'mobileNumber',
      'dateOfBirth', 'gender', 'maritalStatus', 'occupation',
      'annualIncome', 'panNumber', 'aadhaarNumber', 'currentAddress',
      'securityQuestion', 'securityAnswer'
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.warn('⚠️ Email already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Check if Aadhaar already exists
    const existingAadhaar = await User.findOne({ aadhaar: aadhaarNumber });
    if (existingAadhaar) {
      console.warn('⚠️ Aadhaar already exists:', aadhaarNumber);
      return res.status(400).json({
        success: false,
        message: 'Aadhaar already registered',
      });
    }

    // Check if PAN already exists
    const existingPAN = await User.findOne({ panNumber: panNumber.toUpperCase() });
    if (existingPAN) {
      console.warn('⚠️ PAN already exists:', panNumber);
      return res.status(400).json({
        success: false,
        message: 'PAN already registered',
      });
    }

    // Create new user with all extended fields
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      secondaryEmail: secondaryEmail || null,
      password,
      mobileNumber,
      secondaryMobile: secondaryMobile || null,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      maritalStatus,
      occupation,
      annualIncome: parseInt(annualIncome),
      panNumber: panNumber.toUpperCase(),
      aadhaar: aadhaarNumber,
      currentAddress: {
        street: currentAddress.street,
        city: currentAddress.city,
        state: currentAddress.state,
        postalCode: currentAddress.postalCode,
        country: currentAddress.country || 'India',
      },
      permanentAddress: sameAsCurrentAddress
        ? {
            street: currentAddress.street,
            city: currentAddress.city,
            state: currentAddress.state,
            postalCode: currentAddress.postalCode,
            country: currentAddress.country || 'India',
          }
        : {
            street: permanentAddress.street,
            city: permanentAddress.city,
            state: permanentAddress.state,
            postalCode: permanentAddress.postalCode,
            country: permanentAddress.country || 'India',
          },
      sameAsCurrentAddress,
      securityQuestion,
      securityAnswer,
    });

    console.log('💾 Saving user to database:', email);
    await user.save();
    console.log('✅ User saved successfully with all fields');

    // Create account for user
    const accountNumber = `FIN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const account = new Account({
      userId: user._id,
      accountNumber: accountNumber,
      accountType: accountType || 'Savings',
      balance: 5000, // Welcome bonus
      interestRate: accountType === 'Current' ? 0 : 3.5,
      dailyLimit: accountType === 'Current' ? 500000 : 100000,
      monthlyLimit: accountType === 'Current' ? 0 : 20,
      minimumBalance: accountType === 'Current' ? 10000 : 1000,
    });

    await account.save();
    console.log('✅ Account created:', accountNumber);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '🎉 Welcome to Finova Bank!',
        html: `
          <h2>Welcome, ${user.firstName}!</h2>
          <p>Your account has been created successfully.</p>
          <p><strong>Account Number:</strong> ${account.accountNumber}</p>
          <p><strong>Welcome Bonus:</strong> ₹5000</p>
          <p><strong>Account Type:</strong> ${accountType || 'Savings'}</p>
          <p>You can now login and start using Finova Bank services.</p>
          <p>Thank you for joining us!</p>
        `,
      });
      console.log('📧 Welcome email sent');
    } catch (emailError) {
      console.warn('⚠️ Email failed but registration succeeded');
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        role: user.role,
      },
      account: {
        accountNumber: account.accountNumber,
        balance: account.balance,
        accountType: account.accountType,
      },
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔓 Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.warn('⚠️ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      console.warn('⚠️ Account locked:', email);
      return res.status(403).json({
        success: false,
        message: 'Account is locked. Please try Forgot Password.',
      });
    }

    // Compare password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= 5) {
        user.accountLocked = true;
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await user.save();

      console.warn('⚠️ Wrong password for:', email);
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. Attempts remaining: ${5 - user.failedLoginAttempts}`,
      });
    }

    // Reset failed login attempts
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lockUntil = undefined;
    await user.save();

    // Get account details
    const account = await Account.findOne({ userId: user._id });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for:', email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        role: user.role,
      },
      account,
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

// ==================== VERIFY AADHAAR ====================
exports.verifyAadhaar = async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;

    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Aadhaar number. Must be 12 digits.',
      });
    }

    const existingUser = await User.findOne({ aadhaar: aadhaarNumber });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar already registered',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Aadhaar is valid',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Verification failed',
    });
  }
};

// ==================== LOGOUT ====================
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

// ==================== FORGOT PASSWORD - GET SECURITY QUESTION ====================
exports.getSecurityQuestion = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('\n' + '='.repeat(60));
    console.log('🔐 FORGOT PASSWORD - STEP 1: GET SECURITY QUESTION');
    console.log('='.repeat(60));
    console.log('📧 Email received from frontend:', email);

    if (!email) {
      console.error('❌ Email is empty/null');
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔍 Searching for user with email:', normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });

    console.log('📌 Search result:', user ? 'USER FOUND ✅' : 'USER NOT FOUND ❌');

    if (!user) {
      console.error('❌ No user found with email:', normalizedEmail);
      console.log('='.repeat(60) + '\n');
      return res.status(404).json({
        success: false,
        message: 'Email not found. Please register first.',
      });
    }

    console.log('🔐 Security question exists:', user.securityQuestion ? 'YES ✅' : 'NO ❌');

    if (!user.securityQuestion) {
      console.error('❌ Security question missing for user:', normalizedEmail);
      console.log('='.repeat(60) + '\n');
      return res.status(400).json({
        success: false,
        message: 'Security question not found',
      });
    }

    console.log('✅ Returning security question:', user.securityQuestion);
    console.log('✅ USER ID:', user._id);
    console.log('='.repeat(60) + '\n');

    res.status(200).json({
      success: true,
      message: 'Security question retrieved successfully',
      securityQuestion: user.securityQuestion,
      userId: user._id,
    });
  } catch (error) {
    console.error('❌ Error in getSecurityQuestion:', error.message);
    console.log('='.repeat(60) + '\n');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security question: ' + error.message,
    });
  }
};

// ==================== FORGOT PASSWORD - VERIFY ANSWER & RESET ====================
exports.resetPasswordWithAnswer = async (req, res) => {
  try {
    const { userId, securityAnswer, newPassword } = req.body;

    console.log('\n' + '='.repeat(60));
    console.log('🔄 FORGOT PASSWORD - STEP 2: VERIFY & RESET');
    console.log('='.repeat(60));
    console.log('👤 User ID received:', userId);

    if (!userId || !securityAnswer || !newPassword) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const user = await User.findById(userId);

    console.log('👤 User lookup:', user ? user.email : 'NOT FOUND');

    if (!user) {
      console.error('❌ User not found with ID:', userId);
      console.log('='.repeat(60) + '\n');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('🔐 Verifying security answer...');
    const isAnswerCorrect = await user.compareSecurityAnswer(securityAnswer);

    console.log('✓ Answer verification:', isAnswerCorrect ? 'CORRECT ✅' : 'INCORRECT ❌');

    if (!isAnswerCorrect) {
      console.error('❌ Incorrect security answer for user:', user.email);
      console.log('='.repeat(60) + '\n');
      return res.status(400).json({
        success: false,
        message: 'Incorrect security answer',
      });
    }

    console.log('🔐 Updating password...');
    user.password = newPassword;
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lockUntil = undefined;
    await user.save();

    console.log('✅ PASSWORD UPDATED SUCCESSFULLY');

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '🔐 Password Reset Successful',
        html: `
          <h2>Password Reset Successful</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your password has been reset successfully.</p>
          <p>You can now login with your new password.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
        `,
      });
      console.log('📧 Confirmation email sent to:', user.email);
    } catch (emailError) {
      console.warn('⚠️ Email send failed (but password was reset):', emailError.message);
    }

    console.log('='.repeat(60) + '\n');

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('❌ Error in resetPasswordWithAnswer:', error.message);
    console.log('='.repeat(60) + '\n');
    res.status(500).json({
      success: false,
      message: 'Password reset failed: ' + error.message,
    });
  }
};

// ==================== GET CURRENT USER PROFILE ✅ NEW ====================
// Gets full user profile with all fields (phone, DOB, gender, marital status, etc)
exports.getCurrentUser = async (req, res) => {
  try {
    console.log('👤 getCurrentUser called for user:', req.user.id);

    // Fetch user without password and security answer (sensitive fields)
    const user = await User.findById(req.user.id).select('-password -securityAnswer');

    if (!user) {
      console.warn('⚠️ User not found:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('✅ User profile fetched successfully:', user.email);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        secondaryEmail: user.secondaryEmail,
        mobileNumber: user.mobileNumber,
        secondaryMobile: user.secondaryMobile,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        maritalStatus: user.maritalStatus,
        occupation: user.occupation,
        annualIncome: user.annualIncome,
        panNumber: user.panNumber,
        aadhaar: user.aadhaar,
        currentAddress: user.currentAddress,
        permanentAddress: user.permanentAddress,
        sameAsCurrentAddress: user.sameAsCurrentAddress,
        emailVerified: user.emailVerified,
        mobileVerified: user.mobileVerified,
        panVerified: user.panVerified,
        aadhaarVerified: user.aadhaarVerified,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error in getCurrentUser:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile: ' + error.message,
    });
  }
};