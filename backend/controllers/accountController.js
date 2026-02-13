const Account = require('../models/Account');
const User = require('../models/User');

// @route   GET /api/account/info
// @desc    Get account information
// @access  Private
exports.getAccountInfo = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id }).populate('userId', 'name email');

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const user = await User.findById(req.user.id);

    res.status(200).json({
      message: 'Account information retrieved',
      account,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get account info error:', error);
    res.status(500).json({ message: 'Error retrieving account information', error: error.message });
  }
};

// @route   GET /api/account/balance
// @desc    Get account balance only
// @access  Private
exports.getBalance = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.status(200).json({
      message: 'Balance retrieved',
      balance: account.balance,
      accountNumber: account.accountNumber,
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Error retrieving balance', error: error.message });
  }
};

// @route   PUT /api/account/update-balance
// @desc    Update account balance (Admin use)
// @access  Private/Admin
exports.updateBalance = async (req, res) => {
  try {
    const { userId, amount, action } = req.body;

    const account = await Account.findOne({ userId });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (action === 'add') {
      account.balance += amount;
    } else if (action === 'subtract') {
      if (account.balance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      account.balance -= amount;
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    account.updatedAt = Date.now();
    await account.save();

    res.status(200).json({
      message: 'Balance updated successfully',
      newBalance: account.balance,
    });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ message: 'Error updating balance', error: error.message });
  }
};

// @route   GET /api/account/statement
// @desc    Get account statement
// @access  Private
exports.getStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const Transaction = require('../models/Transaction');

    let query = {
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const transactions = await Transaction.find(query).sort({ createdAt: -1 }).limit(100);

    const account = await Account.findOne({ userId: req.user.id });

    res.status(200).json({
      message: 'Statement retrieved',
      account: {
        accountNumber: account.accountNumber,
        balance: account.balance,
      },
      transactions,
      totalTransactions: transactions.length,
    });
  } catch (error) {
    console.error('Get statement error:', error);
    res.status(500).json({ message: 'Error retrieving statement', error: error.message });
  }
};