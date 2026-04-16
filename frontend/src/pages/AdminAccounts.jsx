// src/pages/AdminAccounts.jsx - ACCOUNT MANAGEMENT & FREEZE/UNFREEZE
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import '../styles/adminaccounts.css';

export default function AdminAccounts() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [limitsForm, setLimitsForm] = useState({});

  const [accounts, setAccounts] = useState([
    {
      id: 'ACC001',
      userId: 'U001',
      userName: 'Harsh Chauhan',
      accountNumber: '1234567890123456',
      accountType: 'Savings',
      balance: 250000,
      status: 'active',
      frozen: false,
      dailyLimit: 500000,
      monthlyLimit: 5000000,
      createdDate: '2025-01-15',
      lastActivity: '2026-03-19 10:30 AM',
      totalTransactions: 45,
      monthlyTransactions: 12,
      interestRate: 3.5,
      statements: [
        { date: '2026-03-19', type: 'debit', amount: 50000, description: 'Transfer' },
        { date: '2026-03-18', type: 'credit', amount: 100000, description: 'Salary' },
      ]
    },
    {
      id: 'ACC002',
      userId: 'U002',
      userName: 'Priya Singh',
      accountNumber: '1234567890123457',
      accountType: 'Current',
      balance: 150000,
      status: 'active',
      frozen: false,
      dailyLimit: 1000000,
      monthlyLimit: 10000000,
      createdDate: '2025-02-10',
      lastActivity: 'Never',
      totalTransactions: 0,
      monthlyTransactions: 0,
      interestRate: 0,
      statements: []
    },
    {
      id: 'ACC003',
      userId: 'U003',
      userName: 'Amit Patel',
      accountNumber: '1234567890123458',
      accountType: 'Savings',
      balance: 500000,
      status: 'active',
      frozen: false,
      dailyLimit: 500000,
      monthlyLimit: 5000000,
      createdDate: '2025-01-20',
      lastActivity: '2026-03-19 08:15 AM',
      totalTransactions: 28,
      monthlyTransactions: 8,
      interestRate: 3.5,
      statements: [
        { date: '2026-03-19', type: 'credit', amount: 200000, description: 'Business Income' },
      ]
    },
    {
      id: 'ACC004',
      userId: 'U004',
      userName: 'Sneha Sharma',
      accountNumber: '1234567890123459',
      accountType: 'Savings',
      balance: 0,
      status: 'inactive',
      frozen: true,
      dailyLimit: 0,
      monthlyLimit: 0,
      createdDate: '2025-02-05',
      lastActivity: '2026-03-15 03:30 PM',
      totalTransactions: 15,
      monthlyTransactions: 2,
      interestRate: 3.5,
      freezeReason: 'Suspicious activity detected - Multiple failed login attempts',
      statements: []
    },
    {
      id: 'ACC005',
      userId: 'U005',
      userName: 'Rajesh Kumar',
      accountNumber: '1234567890123460',
      accountType: 'Savings',
      balance: 75000,
      status: 'active',
      frozen: false,
      dailyLimit: 500000,
      monthlyLimit: 5000000,
      createdDate: '2025-02-15',
      lastActivity: '2026-03-19 11:45 AM',
      totalTransactions: 32,
      monthlyTransactions: 9,
      interestRate: 3.5,
      statements: [
        { date: '2026-03-19', type: 'credit', amount: 75000, description: 'Recharge Payment' },
      ]
    },
  ]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [token, user, navigate]);

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = 
      acc.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumber.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || acc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewAccount = (acc) => {
    setSelectedAccount(acc);
    setLimitsForm({
      dailyLimit: acc.dailyLimit,
      monthlyLimit: acc.monthlyLimit
    });
    setShowModal(true);
  };

  const handleFreezeAccount = (accId) => {
    const acc = accounts.find(a => a.id === accId);
    const isFrozen = acc.frozen;
    
    setAccounts(accounts.map(a => 
      a.id === accId ? { 
        ...a, 
        frozen: !isFrozen,
        status: !isFrozen ? 'inactive' : 'active',
        dailyLimit: !isFrozen ? 0 : 500000,
        monthlyLimit: !isFrozen ? 0 : 5000000
      } : a
    ));
    
    const action = isFrozen ? 'unfrozen' : 'frozen';
    alert(`✅ Account ${action} successfully!`);
    setShowModal(false);
  };

  const handleUpdateLimits = () => {
    if (limitsForm.dailyLimit < 0 || limitsForm.monthlyLimit < 0) {
      alert('❌ Limits cannot be negative');
      return;
    }
    
    if (limitsForm.dailyLimit > limitsForm.monthlyLimit) {
      alert('❌ Daily limit cannot be greater than monthly limit');
      return;
    }

    setAccounts(accounts.map(acc => 
      acc.id === selectedAccount.id ? {
        ...acc,
        dailyLimit: limitsForm.dailyLimit,
        monthlyLimit: limitsForm.monthlyLimit
      } : acc
    ));

    alert(`✅ Account limits updated successfully!\nDaily: ₹${limitsForm.dailyLimit.toLocaleString('en-IN')}\nMonthly: ₹${limitsForm.monthlyLimit.toLocaleString('en-IN')}`);
    setShowLimitsModal(false);
    setShowModal(false);
  };

  const handleCloseAccount = () => {
    if (window.confirm('⚠️ This will close the account permanently. Continue?')) {
      setAccounts(accounts.map(acc => 
        acc.id === selectedAccount.id ? {
          ...acc,
          status: 'closed',
          frozen: true,
          dailyLimit: 0,
          monthlyLimit: 0
        } : acc
      ));
      alert('✅ Account closed successfully!');
      setShowCloseModal(false);
      setShowModal(false);
    }
  };

  const getStatusBadge = (status, frozen) => {
    if (frozen) {
      return <span className="badge badge-danger">🔒 Frozen</span>;
    }
    const badges = {
      active: <span className="badge badge-success">✓ Active</span>,
      inactive: <span className="badge badge-warning">⏳ Inactive</span>,
      closed: <span className="badge badge-danger">✕ Closed</span>,
    };
    return badges[status] || badges.active;
  };

  return (
    <div className="admin-container">
      <AdminNavbar />

      <div className="admin-content">
        <div className="admin-header">
          <h1>🏦 Account Management</h1>
          <p>Manage bank accounts, limits, and freeze status</p>
        </div>

        {/* Summary Cards */}
        <div className="account-summary">
          <div className="summary-card">
            <label>Total Accounts</label>
            <h3>{accounts.length}</h3>
          </div>
          <div className="summary-card">
            <label>Active Accounts</label>
            <h3>{accounts.filter(a => a.status === 'active' && !a.frozen).length}</h3>
          </div>
          <div className="summary-card">
            <label>Frozen Accounts</label>
            <h3>{accounts.filter(a => a.frozen).length}</h3>
          </div>
          <div className="summary-card">
            <label>Total Balance</label>
            <h3>₹{accounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by account holder name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Accounts Table */}
        <div className="table-container">
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Account Number</th>
                <th>Account Holder</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Daily Limit</th>
                <th>Status</th>
                <th>Last Activity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id}>
                    <td><strong>{acc.accountNumber}</strong></td>
                    <td>{acc.userName}</td>
                    <td>{acc.accountType}</td>
                    <td>₹{acc.balance.toLocaleString('en-IN')}</td>
                    <td>₹{acc.dailyLimit.toLocaleString('en-IN')}</td>
                    <td>{getStatusBadge(acc.status, acc.frozen)}</td>
                    <td>{acc.lastActivity}</td>
                    <td>
                      <button 
                        className="btn-action btn-view"
                        onClick={() => handleViewAccount(acc)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                    No accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Management Modal */}
      {showModal && selectedAccount && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏦 Account Management</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Account Info */}
              <div className="info-section">
                <h3>📋 Account Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Account Number</label>
                    <p>{selectedAccount.accountNumber}</p>
                  </div>
                  <div className="info-item">
                    <label>Account Holder</label>
                    <p>{selectedAccount.userName}</p>
                  </div>
                  <div className="info-item">
                    <label>Account Type</label>
                    <p>{selectedAccount.accountType}</p>
                  </div>
                  <div className="info-item">
                    <label>Created Date</label>
                    <p>{selectedAccount.createdDate}</p>
                  </div>
                </div>
              </div>

              {/* Balance & Limits */}
              <div className="info-section">
                <h3>💰 Balance & Limits</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Current Balance</label>
                    <p className="highlight">₹{selectedAccount.balance.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="info-item">
                    <label>Daily Limit</label>
                    <p>₹{selectedAccount.dailyLimit.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="info-item">
                    <label>Monthly Limit</label>
                    <p>₹{selectedAccount.monthlyLimit.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="info-item">
                    <label>Interest Rate</label>
                    <p>{selectedAccount.interestRate}% p.a.</p>
                  </div>
                </div>
              </div>

              {/* Status & Activity */}
              <div className="info-section">
                <h3>📊 Status & Activity</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Account Status</label>
                    <p>{getStatusBadge(selectedAccount.status, selectedAccount.frozen)}</p>
                  </div>
                  <div className="info-item">
                    <label>Total Transactions</label>
                    <p>{selectedAccount.totalTransactions}</p>
                  </div>
                  <div className="info-item">
                    <label>Monthly Transactions</label>
                    <p>{selectedAccount.monthlyTransactions}</p>
                  </div>
                  <div className="info-item">
                    <label>Last Activity</label>
                    <p>{selectedAccount.lastActivity}</p>
                  </div>
                </div>
              </div>

              {selectedAccount.frozen && (
                <div className="info-section freeze-reason">
                  <h3>🔒 Freeze Reason</h3>
                  <p>{selectedAccount.freezeReason}</p>
                </div>
              )}

              {/* Update Limits Modal */}
              {showLimitsModal && (
                <div className="info-section limits-form">
                  <h3>📝 Modify Account Limits</h3>
                  <div className="form-group">
                    <label>Daily Limit (₹)</label>
                    <input 
                      type="number" 
                      value={limitsForm.dailyLimit}
                      onChange={(e) => setLimitsForm({...limitsForm, dailyLimit: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Monthly Limit (₹)</label>
                    <input 
                      type="number" 
                      value={limitsForm.monthlyLimit}
                      onChange={(e) => setLimitsForm({...limitsForm, monthlyLimit: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                    <button className="btn btn-primary" onClick={handleUpdateLimits}>
                      ✓ Update Limits
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowLimitsModal(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Close Account Modal */}
              {showCloseModal && (
                <div className="info-section close-account-warning">
                  <h3>⚠️ Close Account Warning</h3>
                  <p>This action will permanently close the account. The account balance must be ₹0 or transferred before closing.</p>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                    <button className="btn btn-danger" onClick={handleCloseAccount}>
                      ✓ Confirm Close
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowCloseModal(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Statements */}
              {selectedAccount.statements.length > 0 && (
                <div className="info-section">
                  <h3>📄 Recent Statements</h3>
                  <div className="statements-list">
                    {selectedAccount.statements.map((stmt, idx) => (
                      <div key={idx} className={`statement-item ${stmt.type}`}>
                        <span className="stmt-date">{stmt.date}</span>
                        <span className="stmt-desc">{stmt.description}</span>
                        <span className={`stmt-amount ${stmt.type}`}>
                          {stmt.type === 'debit' ? '-' : '+'} ₹{stmt.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              {!showLimitsModal && !showCloseModal && (
                <>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowLimitsModal(true)}
                  >
                    ⚙️ Modify Limits
                  </button>
                  <button 
                    className={selectedAccount.frozen ? 'btn btn-success' : 'btn btn-warning'}
                    onClick={() => handleFreezeAccount(selectedAccount.id)}
                  >
                    {selectedAccount.frozen ? '✓ Unfreeze Account' : '🔒 Freeze Account'}
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => setShowCloseModal(true)}
                  >
                    🔚 Close Account
                  </button>
                </>
              )}
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setShowLimitsModal(false);
                  setShowCloseModal(false);
                }}
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