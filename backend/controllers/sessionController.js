// banking-app-backend/controllers/sessionController.js
const User = require('../models/User');

// @desc    Check session validity
// @route   GET /api/session/check
// @access  Private
exports.checkSession = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const now = new Date();

    // Check if session has expired
    if (user.sessionExpiresAt && now > user.sessionExpiresAt) {
      return res.status(401).json({
        success: false,
        message: 'Session expired due to inactivity',
        sessionExpired: true,
      });
    }

    // Update last activity time
    user.lastActivityTime = new Date();

    // Reset session expiry (extend session by 15 minutes)
    user.sessionExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Session is valid',
      sessionExpiresAt: user.sessionExpiresAt,
      lastActivityTime: user.lastActivityTime,
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check session',
      error: error.message,
    });
  }
};

// @desc    Get session info
// @route   GET /api/session/info
// @access  Private
exports.getSessionInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const sessionInfo = {
      userId: user._id,
      email: user.email,
      fullName: user.getFullName(),
      role: user.role,
      lastLogin: user.lastLogin,
      lastActivityTime: user.lastActivityTime,
      sessionExpiresAt: user.sessionExpiresAt,
      timeUntilExpiry: user.sessionExpiresAt ? user.sessionExpiresAt.getTime() - Date.now() : null, // in milliseconds
      accountLocked: user.accountLocked,
    };

    res.status(200).json({
      success: true,
      sessionInfo,
    });
  } catch (error) {
    console.error('Get session info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session info',
      error: error.message,
    });
  }
};

// @desc    Extend session
// @route   POST /api/session/extend
// @access  Private
exports.extendSession = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Reset session expiry (extend by 15 minutes)
    user.sessionExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    user.lastActivityTime = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Session extended',
      sessionExpiresAt: user.sessionExpiresAt,
    });
  } catch (error) {
    console.error('Extend session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extend session',
      error: error.message,
    });
  }
};

// @desc    Get active sessions
// @route   GET /api/session/active-sessions
// @access  Private (Admin)
exports.getActiveSessions = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view all active sessions',
      });
    }

    const activeSessions = await User.find({
      sessionToken: { $exists: true, $ne: null },
      sessionExpiresAt: { $gt: new Date() },
    }).select('_id email firstName lastName lastLogin lastActivityTime sessionExpiresAt role');

    res.status(200).json({
      success: true,
      activeSessions,
      count: activeSessions.length,
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sessions',
      error: error.message,
    });
  }
};

// @desc    Terminate all other sessions (logout from all devices)
// @route   POST /api/session/logout-all-devices
// @access  Private
exports.logoutAllDevices = async (req, res) => {
  try {
    await User.updateMany(
      { _id: req.user.id },
      {
        $unset: {
          sessionToken: 1,
          sessionExpiresAt: 1,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    console.error('Logout all devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout from all devices',
      error: error.message,
    });
  }
};

// @desc    Lock account (user locked out due to multiple failed login attempts)
// @route   GET /api/session/account-lock-status
// @access  Public
exports.getAccountLockStatus = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.accountLocked) {
      return res.status(200).json({
        success: true,
        accountLocked: false,
        message: 'Account is not locked',
      });
    }

    const now = new Date();
    const timeTillUnlock = user.accountLockedUntil.getTime() - now.getTime();

    if (timeTillUnlock <= 0) {
      user.accountLocked = false;
      user.loginAttempts = 0;
      await user.save();

      return res.status(200).json({
        success: true,
        accountLocked: false,
        message: 'Account is now unlocked',
      });
    }

    res.status(200).json({
      success: true,
      accountLocked: true,
      accountLockedUntil: user.accountLockedUntil,
      minutesRemaining: Math.ceil(timeTillUnlock / 60000),
    });
  } catch (error) {
    console.error('Get account lock status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lock status',
      error: error.message,
    });
  }
};

// @desc    Admin unlock user account
// @route   POST /api/session/unlock-account/:userId
// @access  Private (Admin only)
exports.unlockAccount = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can unlock accounts',
      });
    }

    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        accountLocked: false,
        loginAttempts: 0,
        accountLockedUntil: null,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Account unlocked for ${user.email}`,
    });
  } catch (error) {
    console.error('Unlock account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock account',
      error: error.message,
    });
  }
};