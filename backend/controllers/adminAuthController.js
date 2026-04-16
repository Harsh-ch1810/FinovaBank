// backend/controllers/adminAuthController.js - ADMIN AUTHENTICATION
const Admin = require('../models/Admin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

console.log('✅ Admin Auth Controller Loaded');

// ==================== ADMIN LOGIN ====================
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔓 Admin login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      console.warn('⚠️ Admin not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if admin account is locked
    if (admin.isAccountLocked()) {
      console.warn('⚠️ Admin account locked:', email);
      return res.status(403).json({
        success: false,
        message: 'Admin account is locked. Contact super admin.',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      console.warn('⚠️ Admin account inactive:', email);
      return res.status(403).json({
        success: false,
        message: 'Admin account has been deactivated',
      });
    }

    // Compare password
    const isPasswordCorrect = await admin.comparePassword(password);

    if (!isPasswordCorrect) {
      admin.failedLoginAttempts += 1;

      if (admin.failedLoginAttempts >= 5) {
        admin.accountLocked = true;
        admin.lockUntil = new Date(Date.now() + 60 * 60 * 1000); // Lock for 1 hour
      }

      await admin.save();

      console.warn('⚠️ Wrong password for admin:', email);
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. Attempts remaining: ${5 - admin.failedLoginAttempts}`,
      });
    }

    // Reset failed login attempts
    admin.failedLoginAttempts = 0;
    admin.accountLocked = false;
    admin.lockUntil = undefined;
    admin.lastLogin = new Date();
    admin.lastActivityTime = new Date();

    // Log login attempt
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    admin.logLoginAttempt(ipAddress, userAgent, 'success');

    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log('✅ Admin login successful for:', email);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        fullName: admin.getFullName(),
        adminLevel: admin.adminLevel,
        department: admin.department,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

// ==================== CREATE ADMIN (SUPER ADMIN ONLY) ====================
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, mobileNumber, adminLevel, department, permissions } = req.body;

    console.log('📝 Create admin request for:', email);

    // Only super admin can create new admins
    const requester = await Admin.findById(req.admin.id);
    if (requester.adminLevel !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can create new admins',
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists',
      });
    }

    const admin = new Admin({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      mobileNumber,
      adminLevel: adminLevel || 'admin',
      department,
      permissions: permissions || {},
    });

    await admin.save();

    console.log('✅ Admin created:', email);

    // Send welcome email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: admin.email,
        subject: 'Admin Account Created - Finova Bank',
        html: `
          <h2>Welcome to Finova Bank Admin Panel</h2>
          <p>Hi ${admin.firstName},</p>
          <p>Your admin account has been created successfully.</p>
          <p><strong>Email:</strong> ${admin.email}</p>
          <p><strong>Admin ID:</strong> ${admin.adminId}</p>
          <p><strong>Level:</strong> ${admin.adminLevel}</p>
          <p><strong>Department:</strong> ${admin.department}</p>
          <p>You can now login to the admin panel using your credentials.</p>
        `,
      });
    } catch (emailError) {
      console.warn('⚠️ Welcome email failed');
    }

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        adminLevel: admin.adminLevel,
        department: admin.department,
      },
    });
  } catch (error) {
    console.error('❌ Create admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create admin',
    });
  }
};

// ==================== GET ADMIN PROFILE ====================
exports.getAdminProfile = async (req, res) => {
  try {
    console.log('👤 Get admin profile for:', req.admin.id);

    const admin = await Admin.findById(req.admin.id).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        fullName: admin.getFullName(),
        adminId: admin.adminId,
        adminLevel: admin.adminLevel,
        department: admin.department,
        mobileNumber: admin.mobileNumber,
        designation: admin.designation,
        permissions: admin.permissions,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile',
    });
  }
};

// ==================== UPDATE ADMIN PROFILE ====================
exports.updateAdminProfile = async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber, designation } = req.body;

    console.log('📝 Update admin profile for:', req.admin.id);

    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      {
        firstName,
        lastName,
        mobileNumber,
        designation,
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    console.log('✅ Admin profile updated');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      admin,
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

// ==================== CHANGE ADMIN PASSWORD ====================
exports.changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log('🔐 Change password request for:', req.admin.id);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required',
      });
    }

    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Verify current password
    const isPasswordCorrect = await admin.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      console.warn('⚠️ Wrong current password for admin:', req.admin.email);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    admin.password = newPassword;
    admin.lastActivityTime = new Date();
    await admin.save();

    console.log('✅ Password changed for admin:', req.admin.email);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};

// ==================== GET ALL ADMINS (SUPER ADMIN ONLY) ====================
exports.getAllAdmins = async (req, res) => {
  try {
    console.log('📋 Get all admins request');

    const requester = await Admin.findById(req.admin.id);
    if (requester.adminLevel !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can view all admins',
      });
    }

    const admins = await Admin.find().select('-password -activityLog').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    console.error('❌ Get all admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admins',
    });
  }
};

// ==================== ADMIN LOGOUT ====================
exports.adminLogout = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (admin) {
      admin.lastActivityTime = new Date();
      await admin.save();
    }

    console.log('✅ Admin logout:', req.admin.email);

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