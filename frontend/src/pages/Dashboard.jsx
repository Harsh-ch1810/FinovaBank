import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { transactionAPI } from '../services/api';
import UserProfileModal from '../components/UserProfileModal';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, account } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // ✅ Redirect admin users to admin dashboard
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }
  }, [user, navigate]);

  // ==================== FETCH TRANSACTIONS ONLY ====================
  // ✅ DO NOT CALL getAccountInfo() - it overwrites the balance!
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // ✅ ONLY fetch transactions, NOT account info
        const txRes = await transactionAPI.getHistory(5);
        if (txRes.success) {
          setTransactions(txRes.transactions || []);
        }

      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role !== 'admin') {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <p>⏳ Loading...</p>
      </div>
    );
  }

  // ✅ USE ACCOUNT FROM CONTEXT - This will update when Investments page changes it
  const displayAccount = account;

  return (
    <div className="dashboard-container">
      <div className="dashboard-main">

        {/* ERROR */}
        {error && <div className="error-message">⚠️ {error}</div>}

        {/* WELCOME */}
        <div className="welcome-section">
          <div>
            <h1>👋 Welcome, {user?.firstName}</h1>
            <p>Manage your finances with Finova Bank</p>
          </div>

          <button
            className="user-profile-btn"
            onClick={() => setProfileModalOpen(true)}
          >
            👤 {user?.firstName}
          </button>
        </div>

        {/* STATS */}
        {displayAccount && (
          <div className="stats-section">

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <label>Available Balance</label>
                <p className="stat-value">
                  ₹{displayAccount.balance?.toLocaleString('en-IN') || '0'}
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <label>Account Type</label>
                <p className="stat-value">{displayAccount.accountType || 'N/A'}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <label>Interest Rate</label>
                <p className="stat-value">{displayAccount.interestRate || '0'}%</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔄</div>
              <div className="stat-content">
                <label>Daily Limit</label>
                <p className="stat-value">
                  ₹{displayAccount.dailyTransferLimit?.toLocaleString('en-IN') || '0'}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ACCOUNT DETAILS */}
        {displayAccount && (
          <div className="accounts-section">

            <div className="balance-card">
              <h3>💳 Account Details</h3>
              <div className="card-content">

                <div className="card-row">
                  <span>Account Number</span>
                  <span className="account-number">{displayAccount.accountNumber || 'N/A'}</span>
                </div>

                <div className="card-row">
                  <span>Account Type</span>
                  <span className="badge">{displayAccount.accountType || 'N/A'}</span>
                </div>

                <div className="card-row">
                  <span>Current Balance</span>
                  <span className="amount">
                    ₹{displayAccount.balance?.toLocaleString('en-IN') || '0'}
                  </span>
                </div>

                <div className="card-row">
                  <span>Minimum Balance</span>
                  <span>₹{displayAccount.minimumBalance?.toLocaleString('en-IN') || '1000'}</span>
                </div>

              </div>
            </div>

            <div className="limits-card">
              <h3>⚙️ Daily & Monthly Limits</h3>

              <div className="limits-grid">

                <div className="limit-item">
                  <span className="limit-label">Daily Transfers</span>
                  <p className="limit-value">
                    ₹{displayAccount.dailyTransferLimit?.toLocaleString('en-IN') || '100000'}
                  </p>
                </div>

                <div className="limit-item">
                  <span className="limit-label">Daily Withdrawals</span>
                  <p className="limit-value">
                    ₹{displayAccount.dailyWithdrawalLimit?.toLocaleString('en-IN') || '50000'}
                  </p>
                </div>

                <div className="limit-item">
                  <span className="limit-label">Monthly Transactions</span>
                  <p className="limit-value">
                    ₹{displayAccount.monthlyLimit?.toLocaleString('en-IN') || '1000000'}
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* SERVICES */}
        <div className="services-section">
          <h2>🏦 Banking Services</h2>

          <div className="services-grid">

            <div className="service-card">
              <div className="service-icon">💳</div>
              <h4>Cards</h4>
              <p>Manage your cards</p>
              <button className="service-btn" onClick={() => navigate('/cards')}>
                Manage
              </button>
            </div>

            <div className="service-card">
              <div className="service-icon">💵</div>
              <h4>Investments</h4>
              <p>Grow your money</p>
              <button className="service-btn" onClick={() => navigate('/investments')}>
                Invest
              </button>
            </div>

            <div className="service-card">
              <div className="service-icon">🏠</div>
              <h4>Savings</h4>
              <p>Track goals</p>
              <button className="service-btn" onClick={() => navigate('/savings-goal')}>
                Start
              </button>
            </div>

            <div className="service-card">
              <div className="service-icon">📱</div>
              <h4>Recharge</h4>
              <p>Mobile recharge</p>
              <button className="service-btn" onClick={() => navigate('/mobile-recharge')}>
                Recharge
              </button>
            </div>

          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="quick-actions">
          <h2>⚡ Quick Actions</h2>

          <div className="actions-grid">

            <button className="action-btn" onClick={() => navigate('/quick-transfer')}>
              <span>⚡</span>
              <span>Quick Transfer</span>
            </button>

            <button className="action-btn" onClick={() => navigate('/finova-cash')}>
              <span>💰</span>
              <span>Finova Cash</span>
            </button>

            <button className="action-btn" onClick={() => navigate('/insurance')}>
              <span>🛡️</span>
              <span>Insurance</span>
            </button>

          </div>
        </div>

        {/* ACTIVITY SECTION */}
        <div className="activity-section">
          <h2>📜 Recent Activity</h2>

          {transactions.length === 0 ? (
            <div className="activity-placeholder">
              <p>💡 No recent transactions</p>
            </div>
          ) : (
            <div className="activity-list">
              {transactions.map((tx, index) => {

                // 🔥 Determine if user is sender
                const isSender =
                  tx.from === user?.fullName ||
                  tx.from === user?.firstName;

                return (
                  <div key={index} className="activity-item">

                    {/* LEFT */}
                    <div>
                      <strong>
                        {isSender ? '💸 Sent' : '💰 Received'}
                      </strong>

                      <p>
                        {isSender
                          ? `To: ${tx.to}`
                          : `From: ${tx.from}`}
                      </p>
                    </div>

                    {/* RIGHT */}
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{
                        color: isSender ? '#ff4d4f' : '#2ecc71'
                      }}>
                        {isSender ? '-' : '+'} ₹{tx.amount?.toLocaleString('en-IN') || '0'}
                      </strong>

                      <p style={{ fontSize: '12px', color: '#999' }}>
                        {new Date(tx.date).toLocaleString()}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}