import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchAccount();
  }, [user]);

  const fetchAccount = async () => {
    try {
      const response = await API.get('/account/info');
      setAccount(response.data.account);
    } catch (err) {
      setError('Failed to fetch account information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading your dashboard...</div>;

  return (
    <div className="dashboard-container">

      {/* Header */}
      <div className="dashboard-content">
        <h1 className="dashboard-title">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="dashboard-subtitle">
          Manage your finances with ease and security
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Account Cards */}
      <div className="card-grid">

        {/* Main Balance Card */}
        <div className="account-card">
          <div className="account-header">
            <div>
              <div className="account-label">💳 Card</div>
              <div className="account-number">
                {account?.accountNumber?.slice(-4) || '••••'}
              </div>
            </div>
            <span className="account-chip">💰</span>
          </div>

          <div className="account-balance-section">
            <div className="account-label">Current Balance</div>
            <div className="account-balance-amount">
              ₹{account?.balance?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="premium-card">
          <span className="card-icon">📊</span>
          <h3 className="card-title">Quick Stats</h3>
          <p className="card-subtitle">Account Number (Last 4)</p>
          <div className="card-amount">
            {account?.accountNumber?.slice(-4) || 'N/A'}
          </div>
        </div>

        {/* Security */}
        <div className="premium-card">
          <span className="card-icon">🔒</span>
          <h3 className="card-title">Security</h3>
          <p className="card-subtitle">Your account status</p>
          <div className="security-status">✓ Protected</div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>

        <div className="actions-grid">
          <button className="action-button" onClick={() => navigate('/transfer')}>
            <span className="action-icon">💸</span>
            <span className="action-text">Send Money</span>
          </button>

          <button className="action-button" onClick={() => navigate('/history')}>
            <span className="action-icon">📝</span>
            <span className="action-text">Transaction History</span>
          </button>

          <button className="action-button" onClick={() => navigate('/apply-loan')}>
            <span className="action-icon">📊</span>
            <span className="action-text">Apply Loan</span>
          </button>

          <button className="action-button" onClick={() => navigate('/my-loans')}>
            <span className="action-icon">💰</span>
            <span className="action-text">My Loans</span>
          </button>
        </div>
      </div>

      {/* Account Information */}
      <div className="account-info-section">
        <h2 className="section-title">Account Information</h2>

        <div className="stats-grid">

          <div className="stat-card">
            <div className="stat-label">Account Type</div>
            <div className="stat-value">
              {user?.role === 'admin' ? '🛡 Admin' : '👤 Customer'}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Email</div>
            <div className="stat-value email-value">
              {user?.email}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Total Balance</div>
            <div className="stat-value">
              ₹{account?.balance?.toFixed(2) || '0.00'}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
