// src/pages/AdminDashboard.jsx - ADMIN DASHBOARD
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import '../styles/adminDashboard.css';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 1234,
    totalLoans: 567,
    totalTransactions: 8901,
    totalRevenue: 5000000,
    pendingLoans: 45,
  });

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, type: 'User Registration', message: 'Harsh Chauhan registered', time: '5 mins ago' },
    { id: 2, type: 'Loan Approved', message: 'Loan #LP001 approved for ₹5,00,000', time: '20 mins ago' },
    { id: 3, type: 'Transaction', message: 'Transfer of ₹50,000 completed', time: '1 hour ago' },
    { id: 4, type: 'Loan Applied', message: 'New loan application #LP045 received', time: '2 hours ago' },
    { id: 5, type: 'User Updated', message: 'User profile updated', time: '3 hours ago' },
  ]);

  const [loanStats, setLoanStats] = useState({
    approved: 450,
    pending: 120,
    rejected: 30,
    disbursed: 350,
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }

    // Check if user is admin
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [token, user, navigate]);

  return (
    <div className="admin-container">
      <AdminNavbar />

      <div className="admin-content">
        {/* Header */}
        <div className="admin-header">
          <h1>📊 Admin Dashboard</h1>
          <p>Welcome back, {user?.firstName}! Here's your financial overview.</p>
        </div>

        {/* Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon users-icon">👥</div>
            <div className="metric-content">
              <p className="metric-label">Total Users</p>
              <h3 className="metric-value">{stats.totalUsers.toLocaleString('en-IN')}</h3>
              <small className="metric-change">+5% from last month</small>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon loans-icon">💰</div>
            <div className="metric-content">
              <p className="metric-label">Total Loans</p>
              <h3 className="metric-value">{stats.totalLoans}</h3>
              <small className="metric-change">+12% from last month</small>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon trans-icon">📈</div>
            <div className="metric-content">
              <p className="metric-label">Total Transactions</p>
              <h3 className="metric-value">{stats.totalTransactions.toLocaleString('en-IN')}</h3>
              <small className="metric-change">+8% from last month</small>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon revenue-icon">💵</div>
            <div className="metric-content">
              <p className="metric-label">Total Revenue</p>
              <h3 className="metric-value">₹{(stats.totalRevenue / 100000).toFixed(1)}L</h3>
              <small className="metric-change">+15% from last month</small>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Pending Applications */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>⏳ Pending Loan Applications</h2>
              <span className="badge-danger">{stats.pendingLoans}</span>
            </div>
            <div className="pending-section">
              <table className="pending-table">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Applicant</th>
                    <th>Amount</th>
                    <th>Applied Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#LP045</td>
                    <td>Raj Kumar</td>
                    <td>₹3,50,000</td>
                    <td>2026-03-19</td>
                    <td>
                      <button className="btn-action btn-view">View</button>
                    </td>
                  </tr>
                  <tr>
                    <td>#LP046</td>
                    <td>Priya Singh</td>
                    <td>₹2,00,000</td>
                    <td>2026-03-18</td>
                    <td>
                      <button className="btn-action btn-view">View</button>
                    </td>
                  </tr>
                  <tr>
                    <td>#LP047</td>
                    <td>Amit Patel</td>
                    <td>₹5,00,000</td>
                    <td>2026-03-17</td>
                    <td>
                      <button className="btn-action btn-view">View</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/admin/loans')}
                style={{ marginTop: '16px', width: '100%' }}
              >
                View All Pending Applications →
              </button>
            </div>
          </div>

          {/* Loan Status Breakdown */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>📊 Loan Status Breakdown</h2>
            </div>
            <div className="loan-status-grid">
              <div className="status-item">
                <div className="status-icon approved">✓</div>
                <div>
                  <p className="status-label">Approved</p>
                  <h4 className="status-count">{loanStats.approved}</h4>
                </div>
              </div>
              <div className="status-item">
                <div className="status-icon pending">⏳</div>
                <div>
                  <p className="status-label">Pending</p>
                  <h4 className="status-count">{loanStats.pending}</h4>
                </div>
              </div>
              <div className="status-item">
                <div className="status-icon rejected">✕</div>
                <div>
                  <p className="status-label">Rejected</p>
                  <h4 className="status-count">{loanStats.rejected}</h4>
                </div>
              </div>
              <div className="status-item">
                <div className="status-icon disbursed">💵</div>
                <div>
                  <p className="status-label">Disbursed</p>
                  <h4 className="status-count">{loanStats.disbursed}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h2>📜 Recent Activities</h2>
          </div>
          <div className="activities-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'User Registration' && '👤'}
                  {activity.type === 'Loan Approved' && '✓'}
                  {activity.type === 'Transaction' && '💳'}
                  {activity.type === 'Loan Applied' && '📝'}
                  {activity.type === 'User Updated' && '🔄'}
                </div>
                <div className="activity-content">
                  <p className="activity-type">{activity.type}</p>
                  <p className="activity-message">{activity.message}</p>
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>⚡ Quick Actions</h2>
          <div className="actions-grid">
            <button 
              className="action-btn"
              onClick={() => navigate('/admin/loans')}
            >
              <span className="action-icon">📋</span>
              <span className="action-text">Manage Loans</span>
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate('/admin/users')}
            >
              <span className="action-icon">👥</span>
              <span className="action-text">Manage Users</span>
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate('/admin/transactions')}
            >
              <span className="action-icon">💳</span>
              <span className="action-text">View Transactions</span>
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate('/admin/reports')}
            >
              <span className="action-icon">📊</span>
              <span className="action-text">Generate Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}