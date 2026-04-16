// banking-app-backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Protect routes - verify JWT
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const userId = decoded.id || decoded.userId;

const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Check session validity
    if (user.sessionExpiresAt && new Date() > user.sessionExpiresAt) {
      return res.status(401).json({
        success: false,
        message: 'Session expired due to inactivity. Please login again.',
        sessionExpired: true,
      });
    }

    // Update last activity time
    user.lastActivityTime = new Date();

    // Extend session by 15 minutes on each request
    user.sessionExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    // Attach user to request
    req.user = {
      id: user._id,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        tokenExpired: true,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

// @desc    Restrict to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

// @desc    Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user && user.isActive) {
        req.user = {
          id: user._id,
          role: user.role,
          email: user.email,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

// @desc    Rate limiting - prevent brute force attacks
const attemptMap = new Map();

exports.rateLimitLogin = (req, res, next) => {
  const identifier = req.body.email || req.ip;
  const attempts = attemptMap.get(identifier) || [];

  // Remove attempts older than 15 minutes
  const now = Date.now();
  const recentAttempts = attempts.filter((time) => now - time < 15 * 60 * 1000);

  if (recentAttempts.length >= 5) {
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.',
    });
  }

  recentAttempts.push(now);
  attemptMap.set(identifier, recentAttempts);

  next();
};

// @desc    Check MFA requirement
exports.checkMFA = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (user && user.mfaEnabled) {
      return res.status(200).json({
        success: true,
        message: 'MFA required',
        mfaRequired: true,
        mfaMethod: user.mfaMethod,
      });
    }

    next();
  } catch (error) {
    next();
  }
};

// @desc    Verify email exists
exports.verifyEmailExists = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
      });
    }

    req.targetUser = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message,
    });
  }
};