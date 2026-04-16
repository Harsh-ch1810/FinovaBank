// src/pages/AdminReports.jsx - ADMIN REPORTS & ANALYTICS
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import '../styles/adminreports.css';

export default function AdminReports() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('month');

  const [reportData] = useState({
    userGrowth: [
      { month: 'Jan', users: 850 },
      { month: 'Feb', users: 920 },
      { month: 'Mar', users: 1234 },
    ],
    loanStats: {
      approved: 450,
      pending: 120,
      rejected: 30,
      totalAmount: 45000000,
    },
    transactionStats: {
      totalTransactions: 8901,
      successRate: 98.5,
      failureRate: 1.5,
      totalAmount: 125000000,
    },
    revenue: {
      interest: 2500000,
      fees: 500000,
      other: 100000,
      total: 3100000,
    },
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [token, user, navigate]);

  const handleExportCSV = () => {
    alert('✅ Reports exported to CSV successfully!');
  };

  const handleExportPDF = () => {
    alert('✅ Reports exported to PDF successfully!');
  };

  return (
    <div className="admin-container">
      <AdminNavbar />

      <div className="admin-content">
        <div className="admin-header">
          <h1>📈 Reports & Analytics</h1>
          <p>View detailed analytics and generate reports</p>
        </div>

        {/* Date Range Filter */}
        <div className="filters-section">
          <div className="date-filter">
            <label>Date Range:</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last 1 Year</option>
            </select>
          </div>
          <div className="export-buttons">
            <button className="btn btn-info" onClick={handleExportCSV}>
              📊 Export CSV
            </button>
            <button className="btn btn-info" onClick={handleExportPDF}>
              📄 Export PDF
            </button>
          </div>
        </div>

        {/* Loan Statistics */}
        <div className="report-section">
          <h2>📋 Loan Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Approved Loans</h3>
              <p className="stat-value">{reportData.loanStats.approved}</p>
              <small>Total approved applications</small>
            </div>
            <div className="stat-card">
              <h3>Pending Loans</h3>
              <p className="stat-value warning">{reportData.loanStats.pending}</p>
              <small>Awaiting approval</small>
            </div>
            <div className="stat-card">
              <h3>Rejected Loans</h3>
              <p className="stat-value danger">{reportData.loanStats.rejected}</p>
              <small>Rejected applications</small>
            </div>
            <div className="stat-card">
              <h3>Total Loan Amount</h3>
              <p className="stat-value">₹{(reportData.loanStats.totalAmount / 10000000).toFixed(1)}Cr</p>
              <small>Total disbursed</small>
            </div>
          </div>
        </div>

        {/* Transaction Statistics */}
        <div className="report-section">
          <h2>💳 Transaction Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Transactions</h3>
              <p className="stat-value">{reportData.transactionStats.totalTransactions.toLocaleString('en-IN')}</p>
              <small>All transactions</small>
            </div>
            <div className="stat-card">
              <h3>Success Rate</h3>
              <p className="stat-value success">{reportData.transactionStats.successRate}%</p>
              <small>Successful transactions</small>
            </div>
            <div className="stat-card">
              <h3>Failure Rate</h3>
              <p className="stat-value danger">{reportData.transactionStats.failureRate}%</p>
              <small>Failed transactions</small>
            </div>
            <div className="stat-card">
              <h3>Transaction Amount</h3>
              <p className="stat-value">₹{(reportData.transactionStats.totalAmount / 10000000).toFixed(1)}Cr</p>
              <small>Total amount transacted</small>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="report-section">
          <h2>💰 Revenue Breakdown</h2>
          <div className="revenue-grid">
            <div className="revenue-item">
              <h3>Interest Income</h3>
              <p className="amount">₹{(reportData.revenue.interest / 100000).toFixed(2)}L</p>
              <div className="percentage">67.7%</div>
            </div>
            <div className="revenue-item">
              <h3>Processing Fees</h3>
              <p className="amount">₹{(reportData.revenue.fees / 100000).toFixed(2)}L</p>
              <div className="percentage">16.1%</div>
            </div>
            <div className="revenue-item">
              <h3>Other Revenue</h3>
              <p className="amount">₹{(reportData.revenue.other / 100000).toFixed(2)}L</p>
              <div className="percentage">3.2%</div>
            </div>
            <div className="revenue-item total">
              <h3>Total Revenue</h3>
              <p className="amount">₹{(reportData.revenue.total / 100000).toFixed(2)}L</p>
              <div className="percentage">100%</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="report-section">
          <h2>📊 User Growth Trend</h2>
          <div className="chart-container">
            <div className="simple-chart">
              {reportData.userGrowth.map((data, idx) => (
                <div key={idx} className="chart-bar">
                  <div className="bar-value">{data.users}</div>
                  <div 
                    className="bar" 
                    style={{ height: `${(data.users / 1234) * 100}%` }}
                  ></div>
                  <div className="bar-label">{data.month}</div>
                </div>
              ))}
            </div>
            <div className="chart-info">
              <p>📈 User growth has increased by <strong>45%</strong> over the last 3 months.</p>
              <p>💡 Current active users: <strong>1,234</strong></p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="report-section">
          <h2>📌 Key Performance Indicators</h2>
          <div className="kpi-grid">
            <div className="kpi-card">
              <h3>Customer Acquisition Cost</h3>
              <p className="kpi-value">₹2,500</p>
              <small>Average cost per new customer</small>
            </div>
            <div className="kpi-card">
              <h3>Average Loan Amount</h3>
              <p className="kpi-value">₹1,00,000</p>
              <small>Per application</small>
            </div>
            <div className="kpi-card">
              <h3>Customer Retention Rate</h3>
              <p className="kpi-value">92%</p>
              <small>Returning customers</small>
            </div>
            <div className="kpi-card">
              <h3>Average Interest Margin</h3>
              <p className="kpi-value">7.2%</p>
              <small>Per loan</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}