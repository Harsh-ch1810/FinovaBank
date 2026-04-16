// src/pages/AdminFraudDetection.jsx - FRAUD DETECTION & SECURITY MONITORING
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import '../styles/adminfraud.css';

export default function AdminFraudDetection() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');

  const [fraudAlerts, setFraudAlerts] = useState([
    {
      id: 'FA001',
      type: 'Multiple Failed Logins',
      userId: 'U004',
      userName: 'Sneha Sharma',
      severity: 'critical',
      count: 5,
      attempts: [
        { time: '2026-03-19 2:30 PM', ip: '192.168.1.100', device: 'Chrome on Windows' },
        { time: '2026-03-19 2:25 PM', ip: '192.168.1.100', device: 'Chrome on Windows' },
        { time: '2026-03-19 2:20 PM', ip: '192.168.1.100', device: 'Chrome on Windows' },
        { time: '2026-03-19 2:15 PM', ip: '192.168.1.100', device: 'Chrome on Windows' },
        { time: '2026-03-19 2:10 PM', ip: '192.168.1.100', device: 'Chrome on Windows' },
      ],
      status: 'active',
      action: 'Account Frozen',
      detectedAt: '2026-03-19 02:30 PM',
      riskScore: 95,
    },
    {
      id: 'FA002',
      type: 'Large Unusual Transfer',
      userId: 'U004',
      userName: 'Sneha Sharma',
      severity: 'high',
      amount: 500000,
      from: 'Savings Account',
      to: 'Unknown External Account',
      status: 'pending_review',
      detectedAt: '2026-03-14 02:00 PM',
      riskScore: 78,
      description: 'Transfer amount is 5x higher than average monthly transaction. Pattern unusual for this account.',
    },
    {
      id: 'FA003',
      type: 'Rapid Multiple Transactions',
      userId: 'U001',
      userName: 'Harsh Chauhan',
      severity: 'medium',
      transactionCount: 8,
      timespan: '30 minutes',
      totalAmount: 200000,
      status: 'reviewed',
      detectedAt: '2026-03-18 10:15 AM',
      riskScore: 45,
      description: '8 transactions within 30 minutes. Pattern suggests possible automation or account compromise.',
    },
    {
      id: 'FA004',
      type: 'Unusual Location Login',
      userId: 'U003',
      userName: 'Amit Patel',
      severity: 'low',
      previousLocation: 'Mumbai, India',
      currentLocation: 'New York, USA',
      timeDifference: '12 hours',
      status: 'reviewed',
      detectedAt: '2026-03-17 08:30 PM',
      riskScore: 35,
      description: 'Login from geographically impossible location within short timeframe.',
    },
    {
      id: 'FA005',
      type: 'Suspicious Login Device',
      userId: 'U005',
      userName: 'Rajesh Kumar',
      severity: 'low',
      newDevice: 'Mobile Safari on iOS',
      previousDevices: ['Chrome on Windows', 'Chrome on Windows'],
      status: 'reviewed',
      detectedAt: '2026-03-16 03:45 PM',
      riskScore: 30,
      description: 'Login from new unregistered device. User normally logs in from Windows PC only.',
    },
  ]);

  const [securityMetrics] = useState({
    totalAlerts: 5,
    criticalAlerts: 1,
    highAlerts: 1,
    mediumAlerts: 1,
    lowAlerts: 2,
    accountsBlocked: 1,
    suspiciousActivities: 12,
    fraudAttempts: 8,
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [token, user, navigate]);

  const filteredAlerts = fraudAlerts.filter(alert => {
    if (filterSeverity === 'all') return true;
    return alert.severity === filterSeverity;
  });

  const handleViewAlert = (alert) => {
    setSelectedAlert(alert);
    setShowModal(true);
  };

  const handleResolveAlert = (alertId, action) => {
    setFraudAlerts(fraudAlerts.map(alert =>
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ));
    alert(`✅ Alert resolved!\nAction: ${action}`);
    setShowModal(false);
  };

  const handleBlockUser = (userId) => {
    alert(`✅ User blocked successfully!\nAll accounts associated with this user are now frozen.`);
    setShowModal(false);
  };

  const handleUnlockAccount = (userId) => {
    alert(`✅ Account unlocked successfully!\nUser can now login again.`);
    setShowModal(false);
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      critical: <span className="badge badge-critical">🔴 Critical</span>,
      high: <span className="badge badge-danger">🟠 High</span>,
      medium: <span className="badge badge-warning">🟡 Medium</span>,
      low: <span className="badge badge-info">🟢 Low</span>,
    };
    return badges[severity] || badges.low;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: <span className="badge badge-danger">⚠️ Active</span>,
      pending_review: <span className="badge badge-warning">⏳ Pending Review</span>,
      reviewed: <span className="badge badge-info">👁️ Reviewed</span>,
      resolved: <span className="badge badge-success">✓ Resolved</span>,
    };
    return badges[status] || badges.reviewed;
  };

  return (
    <div className="admin-container">
      <AdminNavbar />

      <div className="admin-content">
        <div className="admin-header">
          <h1>🛡️ Fraud Detection & Security</h1>
          <p>Monitor suspicious activities and protect the system</p>
        </div>

        {/* Security Metrics */}
        <div className="security-metrics">
          <div className="metric-card critical">
            <div className="metric-value">{securityMetrics.totalAlerts}</div>
            <div className="metric-label">Total Alerts</div>
          </div>
          <div className="metric-card critical">
            <div className="metric-value">{securityMetrics.criticalAlerts}</div>
            <div className="metric-label">Critical</div>
          </div>
          <div className="metric-card high">
            <div className="metric-value">{securityMetrics.highAlerts}</div>
            <div className="metric-label">High Risk</div>
          </div>
          <div className="metric-card medium">
            <div className="metric-value">{securityMetrics.mediumAlerts}</div>
            <div className="metric-label">Medium Risk</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{securityMetrics.accountsBlocked}</div>
            <div className="metric-label">Accounts Blocked</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{securityMetrics.fraudAttempts}</div>
            <div className="metric-label">Fraud Attempts</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <select 
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Severity Levels</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>

        {/* Fraud Alerts Table */}
        <div className="table-container">
          <table className="fraud-table">
            <thead>
              <tr>
                <th>Alert Type</th>
                <th>User</th>
                <th>Severity</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Detected</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className={`severity-${alert.severity}`}>
                    <td><strong>{alert.type}</strong></td>
                    <td>{alert.userName}</td>
                    <td>{getSeverityBadge(alert.severity)}</td>
                    <td>
                      <div className="risk-score">
                        <div className="score-bar">
                          <div className="score-fill" style={{width: `${alert.riskScore}%`}}></div>
                        </div>
                        <span>{alert.riskScore}%</span>
                      </div>
                    </td>
                    <td>{getStatusBadge(alert.status)}</td>
                    <td>{alert.detectedAt}</td>
                    <td>
                      <button 
                        className="btn-action btn-view"
                        onClick={() => handleViewAlert(alert)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    No fraud alerts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Modal */}
      {showModal && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔍 Fraud Alert Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Alert Overview */}
              <div className="info-section alert-overview">
                <div className="overview-grid">
                  <div className="overview-item">
                    <label>Alert Type</label>
                    <h4>{selectedAlert.type}</h4>
                  </div>
                  <div className="overview-item">
                    <label>User</label>
                    <h4>{selectedAlert.userName}</h4>
                  </div>
                  <div className="overview-item">
                    <label>Severity</label>
                    {getSeverityBadge(selectedAlert.severity)}
                  </div>
                  <div className="overview-item">
                    <label>Risk Score</label>
                    <h4>{selectedAlert.riskScore}%</h4>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="info-section">
                <h3>📝 Description</h3>
                <p>{selectedAlert.description || 'No additional details available.'}</p>
              </div>

              {/* Alert Details */}
              <div className="info-section">
                <h3>🔎 Alert Details</h3>
                {selectedAlert.type === 'Multiple Failed Logins' && (
                  <div className="details-content">
                    <p><strong>Failed Login Attempts:</strong> {selectedAlert.count}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedAlert.status)}</p>
                    <div className="attempts-list">
                      <h4>Login Attempts:</h4>
                      {selectedAlert.attempts.map((attempt, idx) => (
                        <div key={idx} className="attempt-item">
                          <span className="attempt-time">{attempt.time}</span>
                          <span className="attempt-ip">{attempt.ip}</span>
                          <span className="attempt-device">{attempt.device}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAlert.type === 'Large Unusual Transfer' && (
                  <div className="details-content">
                    <p><strong>Amount:</strong> ₹{selectedAlert.amount.toLocaleString('en-IN')}</p>
                    <p><strong>From:</strong> {selectedAlert.from}</p>
                    <p><strong>To:</strong> {selectedAlert.to}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedAlert.status)}</p>
                  </div>
                )}

                {selectedAlert.type === 'Rapid Multiple Transactions' && (
                  <div className="details-content">
                    <p><strong>Transaction Count:</strong> {selectedAlert.transactionCount}</p>
                    <p><strong>Timespan:</strong> {selectedAlert.timespan}</p>
                    <p><strong>Total Amount:</strong> ₹{selectedAlert.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                )}

                {selectedAlert.type === 'Unusual Location Login' && (
                  <div className="details-content">
                    <p><strong>Previous Location:</strong> {selectedAlert.previousLocation}</p>
                    <p><strong>Current Location:</strong> {selectedAlert.currentLocation}</p>
                    <p><strong>Time Difference:</strong> {selectedAlert.timeDifference}</p>
                  </div>
                )}

                {selectedAlert.type === 'Suspicious Login Device' && (
                  <div className="details-content">
                    <p><strong>New Device:</strong> {selectedAlert.newDevice}</p>
                    <p><strong>Previous Devices:</strong> {selectedAlert.previousDevices.join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Recommended Actions */}
              <div className="info-section recommended-actions">
                <h3>⚡ Recommended Actions</h3>
                <div className="actions-list">
                  {selectedAlert.severity === 'critical' && (
                    <>
                      <div className="action-item danger">
                        <span>🔒 Immediate Account Freeze Required</span>
                      </div>
                      <div className="action-item danger">
                        <span>📞 Contact User to Verify</span>
                      </div>
                      <div className="action-item warning">
                        <span>📋 Review Recent Transactions</span>
                      </div>
                    </>
                  )}
                  {selectedAlert.severity === 'high' && (
                    <>
                      <div className="action-item warning">
                        <span>⚠️ Verify Transaction with User</span>
                      </div>
                      <div className="action-item warning">
                        <span>📊 Monitor Account for More Alerts</span>
                      </div>
                    </>
                  )}
                  {selectedAlert.severity === 'medium' && (
                    <>
                      <div className="action-item info">
                        <span>👁️ Monitor Activity</span>
                      </div>
                      <div className="action-item info">
                        <span>📧 Send Security Alert to User</span>
                      </div>
                    </>
                  )}
                  {selectedAlert.severity === 'low' && (
                    <div className="action-item info">
                      <span>✓ Monitor and Record</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              {selectedAlert.status !== 'resolved' && (
                <>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleBlockUser(selectedAlert.userId)}
                  >
                    🚫 Block User Account
                  </button>
                  <button 
                    className="btn btn-warning"
                    onClick={() => handleResolveAlert(selectedAlert.id, 'Verified - False Positive')}
                  >
                    ✓ Mark as False Positive
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleResolveAlert(selectedAlert.id, 'Resolved - Fraud Confirmed')}
                  >
                    ✓ Resolve Alert
                  </button>
                </>
              )}
              <button 
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}