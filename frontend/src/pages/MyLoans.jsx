// src/pages/MyLoans.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loanAPI } from '../services/api';
import '../styles/myloans.css';

export default function MyLoans() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    const loadLoans = async () => {
      try {
        const result = await loanAPI.getMyLoans();
        if (result.success) {
          setLoans(result.loans);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Failed to load loans');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadLoans();
    }
  }, [token]);

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFC107',
      approved: '#4CAF50',
      active: '#2196F3',
      rejected: '#F44336',
      closed: '#9C27B0',
    };
    return colors[status] || '#666';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  if (loading) {
    return <div className="loading">⏳ Loading...</div>;
  }

  return (
    <div className="loans-container">
      <div className="loans-header">
        <h2>📋 My Loans</h2>
        <button 
          className="apply-new-btn"
          onClick={() => navigate('/apply-loan')}
        >
          + Apply New Loan
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loans.length === 0 ? (
        <div className="no-loans">
          <p>No loans yet</p>
          <button 
            className="action-btn"
            onClick={() => navigate('/apply-loan')}
          >
            Apply for a Loan
          </button>
        </div>
      ) : (
        <div className="loans-grid">
          {loans.map((loan) => (
            <div key={loan.id} className="loan-card">
              <div className="loan-header">
                <h3>{loan.type} Loan</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(loan.status) }}
                >
                  {loan.status.toUpperCase()}
                </span>
              </div>

              <div className="loan-details">
                <div className="detail-row">
                  <span className="label">Loan Amount:</span>
                  <span className="value">₹{loan.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Monthly EMI:</span>
                  <span className="value">₹{loan.monthlyEMI.toLocaleString('en-IN')}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Payable:</span>
                  <span className="value">₹{loan.totalPayable.toLocaleString('en-IN')}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Amount Paid:</span>
                  <span className="value">₹{loan.amountPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Remaining Amount:</span>
                  <span className="value">₹{loan.remainingAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="detail-row">
                  <span className="label">EMIs Paid:</span>
                  <span className="value">{loan.emisPaid} / {loan.tenureMonths}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Applied On:</span>
                  <span className="value">{formatDate(loan.createdAt)}</span>
                </div>
              </div>

              {loan.status === 'active' && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${(loan.amountPaid / loan.totalPayable) * 100}%`
                    }}
                  ></div>
                </div>
              )}

              <button 
                className="view-details-btn"
                onClick={() => navigate(`/loan/${loan.id}`)}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}