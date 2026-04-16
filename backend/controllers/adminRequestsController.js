// backend/controllers/adminRequestsController.js - REQUEST MANAGEMENT
const Request = require('../models/Request');
const User = require('../models/User');
const Account = require('../models/Account');
const Admin = require('../models/Admin');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

console.log('✅ Admin Requests Controller Loaded');

// ==================== GET ALL REQUESTS ====================
exports.getAllRequests = async (req, res) => {
  try {
    const { status, type, priority, page = 1, limit = 20 } = req.query;

    console.log('📋 Get all requests. Filters - Status:', status, 'Type:', type);

    let query = {};

    if (status) query.status = status;
    if (type) query.requestType = type;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;

    const requests = await Request.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Request.countDocuments(query);

    console.log('✅ Found', total, 'requests');

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      requests,
    });
  } catch (error) {
    console.error('❌ Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests',
    });
  }
};

// ==================== GET PENDING REQUESTS ====================
exports.getPendingRequests = async (req, res) => {
  try {
    console.log('⏳ Get pending requests');

    const requests = await Request.find({ status: 'pending' })
      .populate('userId', 'firstName lastName email')
      .sort({ priority: -1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('❌ Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests',
    });
  }
};

// ==================== GET REQUEST DETAILS ====================
exports.getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;

    console.log('🔍 Get request details:', requestId);

    const request = await Request.findById(requestId)
      .populate('userId', 'firstName lastName email mobileNumber')
      .populate('reviewedBy', 'firstName lastName email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    console.error('❌ Get request details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request details',
    });
  }
};

// ==================== APPROVE REQUEST ====================
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approvalReason } = req.body;

    console.log('✅ Approving request:', requestId);

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    const admin = await Admin.findById(req.admin.id);

    // Get user information
    const user = await User.findById(request.userId);
    const account = await Account.findOne({ userId: request.userId });

    // Approve based on request type
    switch (request.requestType) {
      case 'account_approval':
        // Approve user account
        user.role = 'user';
        await user.save();
        account.accountStatus = 'active';
        account.kycCompleted = true;
        await account.save();
        break;

      case 'loan_application':
        // Loan would be approved (actual loan creation handled separately)
        break;

      case 'account_upgrade':
        // Upgrade account type
        if (request.details.requestedAccountType === 'Moderate Savings Plus Current') {
          await account.upgradeToHybrid();
        }
        break;

      case 'limit_increase':
        // Increase transaction limits
        if (request.details.limitType === 'daily') {
          account.dailyTransferLimit = request.details.requestedLimit;
        } else if (request.details.limitType === 'monthly') {
          account.monthlyTransactionLimit = request.details.requestedLimit;
        }
        await account.save();
        break;

      case 'document_verification':
        // Mark documents as verified
        if (request.details.documentType === 'aadhar') {
          user.aadhaarVerified = true;
        } else if (request.details.documentType === 'pan') {
          user.panVerified = true;
        }
        await user.save();
        break;

      case 'kyc_update':
        // KYC updated
        user.emailVerified = true;
        user.mobileVerified = true;
        account.kycCompleted = true;
        await user.save();
        await account.save();
        break;

      case 'account_reopening':
        // Reopen closed account
        account.accountStatus = 'active';
        await account.save();
        break;
    }

    // Approve the request
    request.approve(admin._id, admin.getFullName(), admin.email, approvalReason);
    await request.save();

    // Log admin activity
    admin.logActivity(
      'request_approved',
      `Approved ${request.requestType} request from ${user.email}`,
      request.userId,
      user.email,
      'success'
    );
    await admin.save();

    // Send email to user
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '✅ Request Approved - Finova Bank',
        html: `
          <h2>Request Approved</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your ${request.requestType.replace(/_/g, ' ')} request has been approved!</p>
          <p><strong>Request ID:</strong> ${request.requestId}</p>
          <p><strong>Approval Reason:</strong> ${approvalReason || 'N/A'}</p>
          <p>Thank you for choosing Finova Bank!</p>
        `,
      });
    } catch (emailError) {
      console.warn('⚠️ Approval email failed');
    }

    console.log('✅ Request approved:', requestId);

    res.status(200).json({
      success: true,
      message: 'Request approved successfully',
      request,
    });
  } catch (error) {
    console.error('❌ Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve request',
    });
  }
};

// ==================== REJECT REQUEST ====================
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;

    console.log('❌ Rejecting request:', requestId);

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    const admin = await Admin.findById(req.admin.id);
    const user = await User.findById(request.userId);

    // Reject the request
    request.reject(admin._id, admin.getFullName(), admin.email, rejectionReason);
    await request.save();

    // Log admin activity
    admin.logActivity(
      'request_rejected',
      `Rejected ${request.requestType} request from ${user.email}`,
      request.userId,
      user.email,
      'success'
    );
    await admin.save();

    // Send email to user
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '❌ Request Rejected - Finova Bank',
        html: `
          <h2>Request Rejected</h2>
          <p>Hi ${user.firstName},</p>
          <p>Unfortunately, your ${request.requestType.replace(/_/g, ' ')} request has been rejected.</p>
          <p><strong>Request ID:</strong> ${request.requestId}</p>
          <p><strong>Reason:</strong> ${rejectionReason}</p>
          <p>If you have any questions, please contact our support team.</p>
        `,
      });
    } catch (emailError) {
      console.warn('⚠️ Rejection email failed');
    }

    console.log('✅ Request rejected:', requestId);

    res.status(200).json({
      success: true,
      message: 'Request rejected successfully',
      request,
    });
  } catch (error) {
    console.error('❌ Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject request',
    });
  }
};

// ==================== MARK REQUEST AS UNDER REVIEW ====================
exports.markUnderReview = async (req, res) => {
  try {
    const { requestId } = req.params;

    console.log('🔍 Marking request under review:', requestId);

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    request.markUnderReview();
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Request marked as under review',
      request,
    });
  } catch (error) {
    console.error('❌ Mark under review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request',
    });
  }
};

// ==================== CREATE REQUEST (USER SIDE) ====================
exports.createRequest = async (req, res) => {
  try {
    const { requestType, description, details, documents } = req.body;

    console.log('📝 Creating request for user:', req.user.id);

    const user = await User.findById(req.user.id);

    const request = new Request({
      userId: req.user.id,
      userEmail: user.email,
      userName: user.getFullName(),
      requestType,
      description,
      details: details || {},
      documents: documents || [],
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    await request.save();

    console.log('✅ Request created:', request.requestId);

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      request,
    });
  } catch (error) {
    console.error('❌ Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create request',
    });
  }
};

// ==================== GET USER'S REQUESTS ====================
exports.getUserRequests = async (req, res) => {
  try {
    console.log('📋 Get requests for user:', req.user.id);

    const requests = await Request.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('❌ Get user requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests',
    });
  }
};