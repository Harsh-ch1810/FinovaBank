// backend/controllers/adminTransactionController.js - ADMIN TRANSACTION MANAGEMENT
const Transaction = require('../models/Transaction');
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

console.log('✅ Admin Transaction Controller Loaded');

// ==================== GET ALL TRANSACTIONS ====================
exports.getAllTransactions = async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = {};

    if (type && type !== 'all') {
      query.transactionType = type;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .populate('senderId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Format transactions for frontend
    const formattedTransactions = transactions.map(txn => ({
      _id: txn._id,
      reference: txn.reference,
      senderId: txn.senderId?._id,
      senderName: txn.senderId 
        ? `${txn.senderId.firstName} ${txn.senderId.lastName}` 
        : 'Unknown',
      senderAccountNumber: txn.senderAccountNumber,
      receiverId: txn.receiverId?._id,
      receiverName: txn.receiverId 
        ? `${txn.receiverId.firstName} ${txn.receiverId.lastName}` 
        : 'Unknown',
      receiverAccountNumber: txn.receiverAccountNumber,
      amount: txn.amount,
      transactionType: txn.transactionType,
      description: txn.description,
      status: txn.status,
      transactionFee: txn.transactionFee,
      failureReason: txn.failureReason,
      createdAt: txn.createdAt,
      completedAt: txn.completedAt,
    }));

    console.log('✅ Fetched', formattedTransactions.length, 'transactions');

    res.status(200).json({
      success: true,
      transactions: formattedTransactions,
      count: formattedTransactions.length,
    });
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
};

// ==================== GET TRANSACTION DETAILS ====================
exports.getTransactionDetails = async (req, res) => {
  try {
    const { txnId } = req.params;

    const transaction = await Transaction.findById(txnId)
      .populate('senderId', 'firstName lastName email')
      .populate('receiverId', 'firstName lastName email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const formattedTxn = {
      _id: transaction._id,
      reference: transaction.reference,
      senderId: transaction.senderId?._id,
      senderName: transaction.senderId 
        ? `${transaction.senderId.firstName} ${transaction.senderId.lastName}` 
        : 'Unknown',
      senderEmail: transaction.senderId?.email,
      senderAccountNumber: transaction.senderAccountNumber,
      receiverId: transaction.receiverId?._id,
      receiverName: transaction.receiverId 
        ? `${transaction.receiverId.firstName} ${transaction.receiverId.lastName}` 
        : 'Unknown',
      receiverEmail: transaction.receiverId?.email,
      receiverAccountNumber: transaction.receiverAccountNumber,
      amount: transaction.amount,
      transactionType: transaction.transactionType,
      description: transaction.description,
      status: transaction.status,
      transactionFee: transaction.transactionFee,
      taxAmount: transaction.taxAmount,
      failureReason: transaction.failureReason,
      notes: transaction.notes,
      createdAt: transaction.createdAt,
      completedAt: transaction.completedAt,
    };

    res.status(200).json({
      success: true,
      transaction: formattedTxn,
    });
  } catch (error) {
    console.error('❌ Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction details',
      error: error.message,
    });
  }
};

// ==================== PROCESS REFUND ====================
exports.processRefund = async (req, res) => {
  try {
    const { txnId } = req.params;

    console.log('💰 Processing refund for transaction:', txnId);

    const transaction = await Transaction.findById(txnId)
      .populate('senderId', 'firstName lastName email')
      .populate('receiverId', 'firstName lastName email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    if (transaction.status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: `Cannot refund a ${transaction.status} transaction`,
      });
    }

    // Get sender account
    const senderAccount = await Account.findById(transaction.senderAccountId);

    if (!senderAccount) {
      return res.status(404).json({
        success: false,
        message: 'Sender account not found',
      });
    }

    // Refund amount
    await senderAccount.addAmount(transaction.amount);

    // Update transaction status
    transaction.status = 'refunded';
    await transaction.save();

    const sender = transaction.senderId;

    // ✅ SEND EMAIL NOTIFICATION TO SENDER
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: sender.email,
        subject: '💰 Transaction Refund Processed - Finova Bank',
        html: `
          <h2>Refund Processed</h2>
          <p>Hi ${sender.firstName},</p>
          <p>Your failed transaction has been <strong>REFUNDED</strong> to your account.</p>
          
          <h3>Refund Details:</h3>
          <ul>
            <li><strong>Amount:</strong> ₹${transaction.amount.toLocaleString('en-IN')}</li>
            <li><strong>Reference:</strong> ${transaction.reference}</li>
            <li><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</li>
            <li><strong>Status:</strong> Refunded</li>
          </ul>

          <p>The amount has been credited back to your account. Please check your balance.</p>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Thank you for banking with Finova Bank!</p>
        `,
      });
      console.log('📧 Refund email sent to:', sender.email);
    } catch (emailError) {
      console.warn('⚠️ Email sending failed:', emailError.message);
    }

    console.log('✅ Refund processed successfully');

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully!',
      transaction: {
        _id: transaction._id,
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
      },
    });
  } catch (error) {
    console.error('❌ Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message,
    });
  }
};

// ==================== MARK TRANSACTION AS DISPUTED ====================
exports.markDisputed = async (req, res) => {
  try {
    const { txnId } = req.params;
    const { reason } = req.body;

    console.log('⚠️ Marking transaction as disputed:', txnId);

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Dispute reason is required',
      });
    }

    const transaction = await Transaction.findByIdAndUpdate(
      txnId,
      { 
        status: 'disputed',
        notes: reason,
      },
      { new: true }
    )
    .populate('senderId', 'firstName lastName email')
    .populate('receiverId', 'firstName lastName email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // ✅ SEND NOTIFICATION EMAIL
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: transaction.senderId.email,
        subject: '⚠️ Transaction Marked as Disputed - Finova Bank',
        html: `
          <h2>Transaction Under Review</h2>
          <p>Hi ${transaction.senderId.firstName},</p>
          <p>Your transaction has been marked as <strong>DISPUTED</strong> and is under review.</p>
          
          <h3>Transaction Details:</h3>
          <ul>
            <li><strong>Amount:</strong> ₹${transaction.amount.toLocaleString('en-IN')}</li>
            <li><strong>Reference:</strong> ${transaction.reference}</li>
            <li><strong>Reason:</strong> ${reason}</li>
          </ul>

          <p>Our team will investigate this matter and contact you shortly.</p>
          
          <p>Thank you for your patience!</p>
        `,
      });
    } catch (emailError) {
      console.warn('⚠️ Email sending failed:', emailError.message);
    }

    console.log('✅ Transaction marked as disputed');

    res.status(200).json({
      success: true,
      message: 'Transaction marked as disputed',
      transaction: {
        _id: transaction._id,
        reference: transaction.reference,
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error('❌ Error marking transaction as disputed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark transaction as disputed',
      error: error.message,
    });
  }
};