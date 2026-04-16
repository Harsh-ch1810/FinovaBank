// src/services/api.js - FIXED WITH BETTER ERROR HANDLING
const API_BASE_URL = 'http://localhost:5189';

const getToken = () => localStorage.getItem('token');
const getAdminToken = () => localStorage.getItem('adminToken');

const createHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken() || getAdminToken()}`,
});

// ==================== ERROR HANDLER ====================
const handleFetchError = (err) => {
  console.error('API Error:', err);
  
  if (err.message === 'Failed to fetch') {
    return {
      success: false,
      message: 'Connection error. Please check if the backend server is running on port 5189.',
      error: err,
    };
  }
  
  return {
    success: false,
    message: err.message || 'An error occurred',
    error: err,
  };
};

// ==================== AUTH APIs ====================
export const authAPI = {
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  verifyAadhaar: async (aadhaarNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-aadhaar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarNumber }),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getSecurityQuestion: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/security-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  resetPasswordWithAnswer: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },
};

// ==================== ACCOUNT APIs ====================
export const accountAPI = {
  getInfo: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/account/info`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getLimits: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/account/limits`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  upgradeAccount: async (newType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/account/upgrade`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ newType }),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getTransactions: async (limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/account/transactions?limit=${limit}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },
};

// ==================== INVESTMENT APIs ====================
export const investmentAPI = {
  getMyInvestments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investment/my-investments`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  buyInvestment: async (investmentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investment/buy`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(investmentData),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  sellInvestment: async (investmentId, amount) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investment/${investmentId}/sell`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ amount }),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  addMoreInvestment: async (investmentId, amount) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investment/${investmentId}/add-more`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ amount }),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getInvestmentDetails: async (investmentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investment/${investmentId}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  deleteInvestment: async (investmentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investment/${investmentId}`, {
        method: 'DELETE',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },
};

// ==================== TRANSACTION APIs ====================
export const transactionAPI = {
  sendMoney: async (receiverAccountNumber, amount, description) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction/send-money`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ receiverAccountNumber, amount, description }),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getHistory: async (limit = 20) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction/history?limit=${limit}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getDetails: async (transactionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction/${transactionId}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },
};

// ==================== LOAN APIs ====================
export const loanAPI = {
  applyLoan: async (loanType, amount, tenureMonths, purpose) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/loan/apply`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ loanType, amount, tenureMonths, purpose }),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getMyLoans: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/loan/my-loans`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getLoanDetails: async (loanId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/loan/${loanId}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  calculateEMI: async (amount, tenureMonths, interestRate = 8.5) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/loan/calculate-emi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, tenureMonths, interestRate }),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },
};

// ==================== ADMIN LOAN APIs ====================
export const adminLoanAPI = {
  getAllLoans: async (status = 'pending') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/loans?status=${status}`,
        {
          method: 'GET',
          headers: createHeaders(),
        }
      );
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getLoanDetails: async (loanId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/loans/${loanId}`,
        {
          method: 'GET',
          headers: createHeaders(),
        }
      );
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  approveLoan: async (loanId, approvalReason) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/loans/${loanId}/approve`,
        {
          method: 'POST',
          headers: createHeaders(),
          body: JSON.stringify({ approvalReason }),
        }
      );
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  rejectLoan: async (loanId, rejectionReason) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/loans/${loanId}/reject`,
        {
          method: 'POST',
          headers: createHeaders(),
          body: JSON.stringify({ rejectionReason }),
        }
      );
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },
};

// ==================== ADMIN TRANSACTION APIs ====================
export const adminTransactionAPI = {
  getAllTransactions: async (type = 'all', status = 'all') => {
    try {
      const params = new URLSearchParams();
      if (type !== 'all') params.append('type', type);
      if (status !== 'all') params.append('status', status);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/transactions?${params.toString()}`,
        {
          method: 'GET',
          headers: createHeaders(),
        }
      );
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getTransactionDetails: async (txnId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/transactions/${txnId}`,
        {
          method: 'GET',
          headers: createHeaders(),
        }
      );
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  processRefund: async (txnId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/transactions/${txnId}/refund`,
        {
          method: 'POST',
          headers: createHeaders(),
        }
      );
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },
};

// ==================== QUICK TRANSFER APIs ====================
export const quickTransferAPI = {
  createTransfer: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quick-transfer`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getHistory: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quick-transfer/history`, {
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getSavedBeneficiaries: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quick-transfer/beneficiaries`, {
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  verifyBeneficiary: async (accountNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quick-transfer/verify-beneficiary`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ accountNumber }),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },
};

// ==================== FINOVA CASH APIs ====================
export const finanovaCashAPI = {
  withdraw: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finova-cash/withdrawal`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  deposit: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finova-cash/deposit`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getTransactions: async (type = 'all') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/finova-cash/transactions?type=${type}`,
        {
          headers: createHeaders(),
        }
      );
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getTransactionDetails: async (reference) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/finova-cash/transactions/${reference}`,
        {
          headers: createHeaders(),
        }
      );
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },
};

// ==================== INSURANCE APIs ====================
export const insuranceAPI = {
  buyPolicy: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/insurance/buy`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getMyPolicies: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/insurance/my-policies`, {
        headers: createHeaders(),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getPolicyDetails: async (policyNumber) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/insurance/policy/${policyNumber}`,
        {
          headers: createHeaders(),
        }
      );
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  fileClaim: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/insurance/file-claim`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  payPremium: async (policyNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/insurance/pay-premium`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ policyNumber }),
      });
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },

  getPlans: async (type = null) => {
    try {
      const url = type
        ? `${API_BASE_URL}/api/insurance/plans/${type}`
        : `${API_BASE_URL}/api/insurance/plans`;
      const response = await fetch(url);
      return response.json();
    } catch (err) {
      return handleFetchError(err);
    }
  },
};