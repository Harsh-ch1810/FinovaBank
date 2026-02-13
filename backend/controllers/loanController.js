const Loan = require('../models/Loan');
const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Calculate monthly payment using loan formula
const calculateMonthlyPayment = (principal, rate, months) => {
  const monthlyRate = rate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) / (Math.pow(1 + monthlyRate, months) - 1);
};

// @route   POST /api/loan/apply
// @desc    Apply for loan
// @access  Private
exports.applyLoan = async (req, res) => {
  try {
    const { amount, monthlyIncome, loanReason } = req.body;

    // Validation
    if (!amount || !monthlyIncome || !loanReason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (amount < 1000 || amount > 1000000) {
      return res.status(400).json({ message: 'Loan amount must be between $1000 and $1000000' });
    }

    if (monthlyIncome < 1000) {
      return res.status(400).json({ message: 'Monthly income must be at least $1000' });
    }

    // Check if user already has pending loan
    const existingLoan = await Loan.findOne({ userId: req.user.id, status: 'pending' });
    if (existingLoan) {
      return res.status(400).json({ message: 'You already have a pending loan application' });
    }

    // Get account
    const account = await Account.findOne({ userId: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Create loan
    const loan = new Loan({
      userId: req.user.id,
      accountId: account._id,
      amount,
      monthlyIncome,
      loanReason,
      status: 'pending',
    });

    // Calculate monthly payment
    loan.monthlyPayment = calculateMonthlyPayment(amount, loan.interestRate, loan.loanTerm);
    loan.remainingAmount = amount;

    await loan.save();

    res.status(201).json({
      message: 'Loan application submitted successfully',
      loan: {
        _id: loan._id,
        amount: loan.amount,
        monthlyPayment: loan.monthlyPayment.toFixed(2),
        status: loan.status,
      },
    });
  } catch (error) {
    console.error('Apply loan error:', error);
    res.status(500).json({ message: 'Error applying for loan', error: error.message });
  }
};

// @route   GET /api/loan/myloans
// @desc    Get user's loans
// @access  Private
exports.getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Loans retrieved',
      loans,
      total: loans.length,
    });
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ message: 'Error retrieving loans', error: error.message });
  }
};

// @route   GET /api/loan/:id
// @desc    Get loan details
// @access  Private
exports.getLoanDetails = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('userId', 'name email').populate('approvedBy', 'name');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Check authorization
    if (loan.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this loan' });
    }

    res.status(200).json({
      message: 'Loan details retrieved',
      loan,
    });
  } catch (error) {
    console.error('Get loan details error:', error);
    res.status(500).json({ message: 'Error retrieving loan details', error: error.message });
  }
};

// @route   POST /api/loan/:id/payment
// @desc    Make loan payment
// @access  Private
exports.makeLoanPayment = async (req, res) => {
  try {
    const { amount } = req.body;

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Check authorization
    if (loan.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to pay this loan' });
    }

    if (loan.status !== 'disbursed') {
      return res.status(400).json({ message: 'Loan is not in disbursed status' });
    }

    const account = await Account.findOne({ userId: req.user.id });
    if (account.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance for payment' });
    }

    // Update loan
    loan.totalPaidAmount += amount;
    loan.remainingAmount = loan.amount - loan.totalPaidAmount;

    if (loan.remainingAmount <= 0) {
      loan.status = 'closed';
    }

    // Create transaction
    const transaction = new Transaction({
      senderId: req.user.id,
      senderAccountId: account._id,
      senderName: (await User.findById(req.user.id)).name,
      receiverId: null,
      receiverName: 'Loan Payment',
      amount,
      transactionType: 'loan_payment',
      status: 'completed',
      reference: 'LPY' + Date.now(),
      description: `Loan payment for loan ${loan._id}`,
    });

    // Update account
    account.balance -= amount;

    await loan.save();
    await transaction.save();
    await account.save();

    res.status(200).json({
      message: 'Payment processed successfully',
      loan: {
        totalPaid: loan.totalPaidAmount,
        remaining: loan.remainingAmount,
        status: loan.status,
      },
    });
  } catch (error) {
    console.error('Loan payment error:', error);
    res.status(500).json({ message: 'Error processing loan payment', error: error.message });
  }
};