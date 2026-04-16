// src/pages/TransactionHistory.jsx - FINAL DYNAMIC VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { transactionAPI } from '../services/api';
import "../styles/transaction.css";

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { token, getAccountInfo } = useAuth(); // ✅ ADDED
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // 🔥 AUTO REFRESH (REAL-TIME LIKE BEHAVIOR)
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const result = await transactionAPI.getHistory();

        if (result.success && result.transactions) {
          setTransactions(result.transactions);
          setError('');

          // ✅ ALSO REFRESH ACCOUNT BALANCE
          await getAccountInfo();
        } else {
          setError(result.message || 'Failed to load transactions');
        }
      } catch (err) {
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadTransactions();

      // 🔥 POLLING EVERY 5 SECONDS (REAL-TIME EFFECT)
      const interval = setInterval(loadTransactions, 5000);

      return () => clearInterval(interval);
    }
  }, [token]);

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleString('en-IN');
    } catch {
      return 'Invalid date';
    }
  };

  // ✅ ICON
  const getTransactionIcon = (isSent) => {
    return isSent ? '📤' : '📥';
  };

  // ✅ LABEL
  const getTransactionLabel = (isSent) => {
    return isSent ? 'Sent to' : 'Received from';
  };

  // ✅ NAME FIX (IMPORTANT)
  const getOtherPartyName = (txn) => {
    if (txn.isSent) return txn.receiverName || 'Unknown';
    return txn.senderName || 'Unknown';
  };

  // ✅ AMOUNT WITH + / -
  const getAmountDisplay = (amount, isSent) => {
    const sign = isSent ? '-' : '+';
    return `${sign}₹${Number(amount).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="transactions-container">
        <h2>📜 Transaction History</h2>
        <div className="loading">⏳ Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      <h2>📜 Transaction History</h2>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No transactions yet</p>
          <button 
            className="action-btn"
            onClick={() => navigate('/transfer')}
          >
            💸 Send Money Now
          </button>
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map((txn) => (
            <div 
              key={txn.reference || txn.id}
              className="transaction-item"
            >
              {/* LEFT */}
              <div className="txn-left">
                <div className="txn-header">
                  <h4>
                    {getTransactionIcon(txn.isSent)} {getTransactionLabel(txn.isSent)}
                  </h4>

                  <span className={`status ${txn.status}`}>
                    {txn.status}
                  </span>
                </div>

                <p className="txn-description">
                  {getOtherPartyName(txn)}
                </p>

                <p className="txn-date">
                  📅 {formatDate(txn.date || txn.createdAt)}
                </p>

                <p className="txn-reference">
                  🔑 Ref: {txn.reference || txn.id}
                </p>
              </div>

              {/* RIGHT */}
              <div className="txn-right">
                <div className="txn-amount">
                  {getAmountDisplay(txn.amount, txn.isSent)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}