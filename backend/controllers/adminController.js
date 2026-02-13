const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }],
      };
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    // Get account info for each user
    const usersWithAccounts = await Promise.all(
      users.map(async (user) => {
        const account = await Account.findOne({ userId: user._id });
        return {
          ...user.toObject(),
          accountNumber: account?.accountNumber,
          balance: account?.balance || 0,
        };
      })
    );

    res.status(200).json({
      message: 'Users retrieved',
      users: usersWithAccounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
};

// @route   GET /api/admin/transactions
// @desc    Get all transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      message: 'Transactions retrieved',
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Error retrieving transactions', error: error.message });
  }
};

// @route   GET /api/admin/loans
// @desc    Get all loans
// @access  Private/Admin
exports.getAllLoans = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const loans = await Loan.find(query)
      .populate('userId', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Loan.countDocuments(query);

    // Format loans for frontend
    const formattedLoans = loans.map((loan) => ({
      ...loan.toObject(),
      userName: loan.userId.name,
      userEmail: loan.userId.email,
    }));

    res.status(200).json({
      message: 'Loans retrieved',
      loans: formattedLoans,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ message: 'Error retrieving loans', error: error.message });
  }
};

// @route   POST /api/admin/loan/:id/approve
// @desc    Approve loan and disburse funds
// @access  Private/Admin
exports.approveLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Loan is not pending' });
    }

    // Get account
    const account = await Account.findOne({ userId: loan.userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Update loan
    loan.status = 'disbursed';
    loan.approvalDate = Date.now();
    loan.disbursementDate = Date.now();
    loan.approvedBy = req.user.id;
    loan.remainingAmount = loan.amount;

    // Disburse funds to account
    account.balance += loan.amount;
    account.totalTransactionsAmount += loan.amount;
    account.updatedAt = Date.now();

    // Create transaction for disbursement
    const transaction = new Transaction({
      senderId: req.user.id,
      senderName: (await User.findById(req.user.id)).name,
      senderAccountId: account._id,
      receiverId: loan.userId,
      receiverAccountId: account._id,
      receiverName: (await User.findById(loan.userId)).name,
      amount: loan.amount,
      transactionType: 'loan_disbursement',
      status: 'completed',
      reference: 'LOAN' + Date.now(),
      description: `Loan disbursement of ${loan.amount}`,
    });

    await loan.save();
    await account.save();
    await transaction.save();

    res.status(200).json({
      message: 'Loan approved and funds disbursed',
      loan: {
        _id: loan._id,
        amount: loan.amount,
        status: loan.status,
      },
    });
  } catch (error) {
    console.error('Approve loan error:', error);
    res.status(500).json({ message: 'Error approving loan', error: error.message });
  }
};

// @route   POST /api/admin/loan/:id/reject
// @desc    Reject loan application
// @access  Private/Admin
exports.rejectLoan = async (req, res) => {
  try {
    const { reason } = req.body;

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Loan is not pending' });
    }

    // Update loan
    loan.status = 'rejected';
    loan.rejectionReason = reason || 'Application rejected by admin';
    loan.approvalDate = Date.now();

    await loan.save();

    res.status(200).json({
      message: 'Loan rejected',
      loan: {
        _id: loan._id,
        status: loan.status,
        rejectionReason: loan.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Reject loan error:', error);
    res.status(500).json({ message: 'Error rejecting loan', error: error.message });
  }
};

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const totalTransactions = await Transaction.countDocuments();
    const completedTransactions = await Transaction.countDocuments({ status: 'completed' });
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });

    const totalLoans = await Loan.countDocuments();
    const approvedLoans = await Loan.countDocuments({ status: 'approved' });
    const disbursedLoans = await Loan.countDocuments({ status: 'disbursed' });
    const pendingLoans = await Loan.countDocuments({ status: 'pending' });

    const totalBalance = await Account.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]);

    res.status(200).json({
      message: 'Dashboard stats retrieved',
      stats: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          admins: totalAdmins,
        },
        transactions: {
          total: totalTransactions,
          completed: completedTransactions,
          pending: pendingTransactions,
        },
        loans: {
          total: totalLoans,
          approved: approvedLoans,
          disbursed: disbursedLoans,
          pending: pendingLoans,
        },
        totalSystemBalance: totalBalance[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error retrieving dashboard stats', error: error.message });
  }
};