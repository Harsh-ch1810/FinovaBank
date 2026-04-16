// src/pages/Transfer.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { transactionAPI, accountAPI } from '../services/api';
import '../styles/transfer.css';

export default function Transfer() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    receiverAccountNumber: '',
    amount: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentBalance, setCurrentBalance] = useState(null);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const result = await accountAPI.getInfo();
        if (result.success) {
          setCurrentBalance(result.account.balance);
        }
      } catch (err) {
        console.error('Error loading balance:', err);
      }
    };

    if (token) {
      loadBalance();
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.receiverAccountNumber || !formData.amount) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.amount);

    if (amount <= 0) {
      setError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    if (currentBalance && amount > currentBalance) {
      setError('Insufficient balance');
      setLoading(false);
      return;
    }

    try {
      const result = await transactionAPI.sendMoney(
        formData.receiverAccountNumber,
        amount,
        formData.description
      );

      if (result.success) {
        setSuccess(`✅ Money transferred successfully!\nReference: ${result.transaction.id}`);
        setFormData({
          receiverAccountNumber: '',
          amount: '',
          description: '',
        });

        const updatedBalance = await accountAPI.getInfo();
        if (updatedBalance.success) {
          setCurrentBalance(updatedBalance.account.balance);
        }

        setTimeout(() => {
          navigate('/transactions');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-container">
      <div className="transfer-box">
        <h2>💸 Send Money</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {currentBalance !== null && (
          <div className="balance-info">
            <p>Current Balance: <strong>₹{currentBalance.toLocaleString('en-IN')}</strong></p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="transfer-form">
          {/* Receiver Account */}
          <div className="form-group">
            <label>Receiver Account Number *</label>
            <input
              type="text"
              name="receiverAccountNumber"
              value={formData.receiverAccountNumber}
              onChange={handleChange}
              placeholder="e.g., FIN123456"
            />
          </div>

          {/* Amount */}
          <div className="form-group">
            <label>Amount (₹) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              min="1"
              step="0.01"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a note for this transfer"
              rows="3"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="transfer-btn"
            disabled={loading}
          >
            {loading ? '⏳ Processing...' : '💸 Send Money'}
          </button>
        </form>

        {/* Info Box */}
        <div className="info-box">
          <h4>ℹ️ Transaction Info</h4>
          <ul>
            <li>✓ Transfer is instant and free</li>
            <li>✓ Money will be sent to receiver immediately</li>
            <li>✓ Both parties will receive email confirmation</li>
            <li>✓ Minimum balance must be maintained</li>
          </ul>
        </div>
      </div>
    </div>
  );
}