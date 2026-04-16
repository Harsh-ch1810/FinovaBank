// src/pages/FinovaCash.jsx - FIXED WITH AUTHCONTEXT SYNC
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { finanovaCashAPI, accountAPI } from '../services/api';
import '../styles/transfer.css';

export default function FinovaCash() {
  const navigate = useNavigate();
  const { token, account, setAccount } = useAuth();
  const [activeTab, setActiveTab] = useState('withdraw');
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    withdrawalMode: 'atm',
    depositMode: 'branch',
    chequeNumber: '',
    chequeBank: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentBalance, setCurrentBalance] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // ==================== LOAD BALANCE FROM ACCOUNT CONTEXT ====================
  useEffect(() => {
    if (account) {
      setCurrentBalance(account.balance);
      console.log('✅ Balance loaded from AuthContext:', account.balance);
    }
  }, [account]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==================== HANDLE WITHDRAWAL ====================
  const handleWithdrawal = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const amount = parseFloat(formData.amount);

    if (amount < 100) {
      setError('Minimum withdrawal amount is ₹100');
      setLoading(false);
      return;
    }

    if (currentBalance && amount > currentBalance) {
      setError('Insufficient balance');
      setLoading(false);
      return;
    }

    try {
      const result = await finanovaCashAPI.withdraw({
        amount,
        paymentMethod: formData.paymentMethod,
        withdrawalMode: formData.withdrawalMode,
        description: formData.description,
      });

      if (result.success) {
        setSuccess(`✅ Withdrawal ${result.withdrawal.status}!\nRef: ${result.withdrawal.reference}`);
        setFormData({
          amount: '',
          paymentMethod: 'cash',
          withdrawalMode: 'atm',
          depositMode: 'branch',
          chequeNumber: '',
          chequeBank: '',
          description: '',
        });

        // ==================== SYNC BALANCE WITH AUTHCONTEXT ====================
        // Method 1: Fetch from server
        try {
          console.log('📍 Fetching updated balance from server...');
          const balanceResult = await accountAPI.getInfo();
          if (balanceResult.success && balanceResult.account) {
            const newBalance = balanceResult.account.balance;
            console.log('✅ Updated balance from server:', newBalance);
            
            // Update AuthContext with new account
            setAccount(balanceResult.account);
            setCurrentBalance(newBalance);
          }
        } catch (fetchErr) {
          console.warn('⚠️ Could not fetch from server, updating locally:', fetchErr);
          
          // Method 2: Update locally if server fetch fails
          const newBalance = currentBalance - amount;
          if (account) {
            const updatedAccount = { ...account, balance: newBalance };
            setAccount(updatedAccount);
            setCurrentBalance(newBalance);
            console.log('✅ Balance updated locally:', newBalance);
          }
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('❌ Withdrawal error:', err);
      setError('Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== HANDLE DEPOSIT ====================
  const handleDeposit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const amount = parseFloat(formData.amount);

    if (amount < 100) {
      setError('Minimum deposit amount is ₹100');
      setLoading(false);
      return;
    }

    try {
      const result = await finanovaCashAPI.deposit({
        amount,
        paymentMethod: formData.paymentMethod,
        depositMode: formData.depositMode,
        chequeNumber: formData.depositMode === 'cheque' ? formData.chequeNumber : undefined,
        chequeBank: formData.depositMode === 'cheque' ? formData.chequeBank : undefined,
        description: formData.description,
      });

      if (result.success) {
        setSuccess(`✅ Deposit ${result.deposit.status}!\nRef: ${result.deposit.reference}`);
        setFormData({
          amount: '',
          paymentMethod: 'cash',
          withdrawalMode: 'atm',
          depositMode: 'branch',
          chequeNumber: '',
          chequeBank: '',
          description: '',
        });

        // ==================== SYNC BALANCE WITH AUTHCONTEXT ====================
        // Method 1: Fetch from server
        try {
          console.log('📍 Fetching updated balance from server...');
          const balanceResult = await accountAPI.getInfo();
          if (balanceResult.success && balanceResult.account) {
            const newBalance = balanceResult.account.balance;
            console.log('✅ Updated balance from server:', newBalance);
            
            // Update AuthContext with new account
            setAccount(balanceResult.account);
            setCurrentBalance(newBalance);
          }
        } catch (fetchErr) {
          console.warn('⚠️ Could not fetch from server, updating locally:', fetchErr);
          
          // Method 2: Update locally if server fetch fails
          const newBalance = currentBalance + amount;
          if (account) {
            const updatedAccount = { ...account, balance: newBalance };
            setAccount(updatedAccount);
            setCurrentBalance(newBalance);
            console.log('✅ Balance updated locally:', newBalance);
          }
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('❌ Deposit error:', err);
      setError('Deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-container">
      <div className="transfer-box">
        <h2>💰 Finova Cash</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {currentBalance !== null && (
          <div className="balance-info">
            <p>
              Current Balance: <strong>₹{currentBalance.toLocaleString('en-IN')}</strong>
            </p>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
            onClick={() => setActiveTab('withdraw')}
          >
            💸 Withdraw Cash
          </button>
          <button
            className={`tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
            onClick={() => setActiveTab('deposit')}
          >
            💰 Deposit Cash
          </button>
        </div>

        {/* Withdrawal Form */}
        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdrawal} className="transfer-form">
            {/* Amount */}
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="1000"
                min="100"
                step="100"
                required
              />
              <small>Minimum: ₹100</small>
            </div>

            {/* Withdrawal Mode */}
            <div className="form-group">
              <label>Withdrawal Mode *</label>
              <select
                name="withdrawalMode"
                value={formData.withdrawalMode}
                onChange={handleChange}
              >
                <option value="atm">ATM Withdrawal</option>
                <option value="branch">Branch Withdrawal</option>
                <option value="home-delivery">Home Delivery</option>
              </select>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Why do you need this withdrawal?"
                rows="2"
              ></textarea>
            </div>

            <button type="submit" className="transfer-btn" disabled={loading}>
              {loading ? '⏳ Processing...' : '💸 Withdraw'}
            </button>
          </form>
        )}

        {/* Deposit Form */}
        {activeTab === 'deposit' && (
          <form onSubmit={handleDeposit} className="transfer-form">
            {/* Amount */}
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="5000"
                min="100"
                step="100"
                required
              />
              <small>Minimum: ₹100</small>
            </div>

            {/* Deposit Mode */}
            <div className="form-group">
              <label>Deposit Mode *</label>
              <select
                name="depositMode"
                value={formData.depositMode}
                onChange={handleChange}
              >
                <option value="branch">Branch Deposit</option>
                <option value="atm">ATM Deposit</option>
                <option value="cheque">Cheque Deposit</option>
              </select>
            </div>

            {/* Cheque Details (if mode is cheque) */}
            {formData.depositMode === 'cheque' && (
              <>
                <div className="form-group">
                  <label>Cheque Number *</label>
                  <input
                    type="text"
                    name="chequeNumber"
                    value={formData.chequeNumber}
                    onChange={handleChange}
                    placeholder="000123456"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Cheque Bank *</label>
                  <input
                    type="text"
                    name="chequeBank"
                    value={formData.chequeBank}
                    onChange={handleChange}
                    placeholder="Bank Name"
                    required
                  />
                </div>
              </>
            )}

            {/* Description */}
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Purpose of deposit"
                rows="2"
              ></textarea>
            </div>

            <button type="submit" className="transfer-btn" disabled={loading}>
              {loading ? '⏳ Processing...' : '💰 Deposit'}
            </button>
          </form>
        )}

        {/* Info Box */}
        <div className="info-box">
          <h4>ℹ️ Finova Cash Services</h4>
          <ul>
            <li>✓ Instant ATM withdrawals available 24/7</li>
            <li>✓ Branch deposits with immediate credit</li>
            <li>✓ Home delivery available for large amounts</li>
            <li>✓ Cheque deposits processed in 2-3 business days</li>
          </ul>
        </div>
      </div>
    </div>
  );
}