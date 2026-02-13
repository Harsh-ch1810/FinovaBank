const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const User = require('../models/User');

// Generate unique reference number
const generateReference = () => {
  return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
};

// @route   POST /api/transaction/transfer
// @desc    Transfer money between users
// @access  Private
exports.transfer = async (req, res) => {
  try {
    const { receiverEmail, amount, description } = req.body;

    // Validation
    if (!receiverEmail || !amount) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Get sender account
    const senderAccount = await Account.findOne({ userId: req.user.id });
    if (!senderAccount) {
      return res.status(404).json({ message: 'Sender account not found' });
    }

    // Check balance
    if (senderAccount.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Get receiver user
    const receiver = await User.findOne({ email: receiverEmail });
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Get receiver account
    const receiverAccount = await Account.findOne({ userId: receiver._id });
    if (!receiverAccount) {
      return res.status(404).json({ message: 'Receiver account not found' });
    }

    // Get sender user
    const sender = await User.findById(req.user.id);

    // Create transaction
    const transaction = new Transaction({
      senderId: req.user.id,
      senderAccountId: senderAccount._id,
      senderName: sender.name,
      senderEmail: sender.email,
      receiverId: receiver._id,
      receiverAccountId: receiverAccount._id,
      receiverName: receiver.name,
      receiverEmail: receiver.email,
      amount,
      transactionType: 'transfer',
      status: 'pending',
      description,
      reference: generateReference(),
      fee: 0,
    });

    // Update balances
    senderAccount.balance -= amount;
    senderAccount.totalTransactionsAmount += amount;
    senderAccount.totalTransactionsCount += 1;
    senderAccount.updatedAt = Date.now();

    receiverAccount.balance += amount;
    receiverAccount.totalTransactionsAmount += amount;
    receiverAccount.totalTransactionsCount += 1;
    receiverAccount.updatedAt = Date.now();

    // Mark transaction as completed
    transaction.status = 'completed';
    transaction.completedAt = Date.now();

    await transaction.save();
    await senderAccount.save();
    await receiverAccount.save();

    res.status(201).json({
      message: 'Transfer successful',
      transaction: {
        reference: transaction.reference,
        amount: transaction.amount,
        receiver: receiver.name,
        status: transaction.status,
      },
      newBalance: senderAccount.balance,
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Error processing transfer', error: error.message });
  }
};

// @route   GET /api/transaction/history
// @desc    Get transaction history for user
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = {
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      message: 'Transaction history retrieved',
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Error retrieving transaction history', error: error.message });
  }
};

// @route   GET /api/transaction/:id
// @desc    Get transaction details
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user is sender or receiver
    if (transaction.senderId.toString() !== req.user.id && transaction.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.status(200).json({
      message: 'Transaction details retrieved',
      transaction,
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Error retrieving transaction', error: error.message });
  }
};