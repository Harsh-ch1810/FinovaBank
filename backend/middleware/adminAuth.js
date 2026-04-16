// backend/middleware/adminAuth.js - ADMIN AUTHENTICATION MIDDLEWARE
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// @desc    Protect routes - verify JWT for admin
exports.protectAdmin = async (req, res, next) => {
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

    // Check if it's an admin token
    if (!decoded.adminId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token',
      });
    }

    // Check if admin still exists
    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin no longer exists',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account has been deactivated',
      });
    }

    // Check if admin account is locked
    if (admin.isAccountLocked()) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is locked',
      });
    }

    // Update last activity
    admin.lastActivityTime = new Date();
    await admin.save();

    // Attach admin to request
    req.admin = {
      id: admin._id,
      email: admin.email,
      role: 'admin',
      adminLevel: admin.adminLevel,
      permissions: admin.permissions,
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

// @desc    Restrict to super admin only
exports.requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.adminLevel !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Only super admin can access this route',
    });
  }
  next();
};

// @desc    Restrict to specific admin levels
exports.requireAdminLevel = (...levels) => {
  return (req, res, next) => {
    if (!req.admin || !levels.includes(req.admin.adminLevel)) {
      return res.status(403).json({
        success: false,
        message: `Admin level '${req.admin?.adminLevel}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// @desc    Check specific permission
exports.requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin || !req.admin.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Admin does not have ${permission} permission`,
      });
    }
    next();
  };
};

// @desc    Check multiple permissions (any of them)
exports.requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const hasPermission = permissions.some(perm => req.admin.permissions[perm]);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Admin does not have required permissions',
      });
    }
    next();
  };
};

// @desc    Check all permissions (all of them required)
exports.requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const hasAllPermissions = permissions.every(perm => req.admin.permissions[perm]);

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Admin does not have all required permissions',
      });
    }
    next();
  };
};

// @desc    Log admin action
exports.logAdminAction = (action, description) => {
  return async (req, res, next) => {
    try {
      if (req.admin) {
        const admin = await Admin.findById(req.admin.id);
        if (admin) {
          // The actual logging is done in the controller
          req.adminAction = {
            action,
            description,
          };
        }
      }
    } catch (error) {
      console.error('Error logging admin action:', error);
    }

    next();
  };
};