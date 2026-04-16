// frontend/src/services/newFeaturesAPI.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5189/api';

// ==================== QUICK TRANSFER API ====================
export const quickTransferAPI = {
  createTransfer: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/quick-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getHistory: async () => {
    try {
      const response = await fetch(`${API_BASE}/quick-transfer/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getSavedBeneficiaries: async () => {
    try {
      const response = await fetch(`${API_BASE}/quick-transfer/beneficiaries`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  verifyBeneficiary: async (accountNumber) => {
    try {
      const response = await fetch(`${API_BASE}/quick-transfer/verify-beneficiary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ accountNumber }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
};

// ==================== FINOVA CASH API ====================
export const finanovaCashAPI = {
  withdraw: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/finova-cash/withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  deposit: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/finova-cash/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getTransactions: async (type = 'all') => {
    try {
      const response = await fetch(
        `${API_BASE}/finova-cash/transactions?type=${type}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getTransactionDetails: async (reference) => {
    try {
      const response = await fetch(
        `${API_BASE}/finova-cash/transactions/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
};

// ==================== INSURANCE API ====================
export const insuranceAPI = {
  buyPolicy: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/insurance/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getMyPolicies: async () => {
    try {
      const response = await fetch(`${API_BASE}/insurance/my-policies`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getPolicyDetails: async (policyNumber) => {
    try {
      const response = await fetch(`${API_BASE}/insurance/policy/${policyNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  fileClaim: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/insurance/file-claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  payPremium: async (policyNumber) => {
    try {
      const response = await fetch(`${API_BASE}/insurance/pay-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ policyNumber }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getPlans: async (type = null) => {
    try {
      const url = type ? `${API_BASE}/insurance/plans/${type}` : `${API_BASE}/insurance/plans`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
};