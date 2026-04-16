// src/pages/AdminTransactions.jsx - FIXED (Race Condition Prevention)
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import '../styles/adminTransactions.css';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
};

export default function AdminTransactions() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // 🔥 FIX: Track auth state separately
  const [authChecked, setAuthChecked] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // 🔥 FIX: Separate effect for authentication check
  useEffect(() => {
    if (!token || !user) {
      console.log('⚠️  No auth token or user - redirecting to login');
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      console.log('⚠️  User is not admin - redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    setAuthChecked(true);
  }, [token, user, navigate]); // Only these dependencies!

  // 🔥 FIX: Fetch function with proper error handling
  const fetchTransactions = useCallback(async () => {
    // Don't fetch if auth not checked
    if (!authChecked) return;

    try {
      setLoadingState(LOADING_STATES.LOADING);
      setError('');

      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const url = `http://localhost:5189/api/admin/transactions?${params.toString()}`;

      console.log('🔄 Fetching transactions from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      // 🔥 FIX: Handle network errors properly
      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ Unauthorized - token may be expired');
          navigate('/login');
          return;
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions || []);
        setLoadingState(LOADING_STATES.SUCCESS);
        console.log(`✅ Loaded ${data.transactions?.length || 0} transactions`);
      } else {
        throw new Error(data.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('❌ Error fetching transactions:', err);
      setError(err.message || 'Connection error. Please try again.');
      setTransactions([]);
      setLoadingState(LOADING_STATES.ERROR);
    }
  }, [authChecked, token, filterType, filterStatus, navigate]);

  // 🔥 FIX: Separate effect for data fetching
  useEffect(() => {
    if (authChecked) {
      fetchTransactions();
    }
  }, [authChecked, fetchTransactions]);

  // 🔥 FIX: Filter transactions safely
  const filteredTransactions = Array.isArray(transactions)
    ? transactions.filter(txn => {
        if (!txn) return false;
        const matchesSearch =
          (txn.senderName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (txn.receiverName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (txn.reference?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
      })
    : [];

  // 🔥 FIX: Process refund with proper error handling
  const handleRefund = async (txnId) => {
    const txn = transactions.find(t => t._id === txnId);
    if (!txn) {
      alert('❌ Transaction not found');
      return;
    }

    const confirmed = window.confirm(
      `🔄 Refund ₹${txn.amount?.toLocaleString('en-IN')} to ${txn.senderName}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:5189/api/admin/transactions/${txnId}/refund`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Refund failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        alert('✅ Refund processed successfully!\n\nUser will receive notification.');
        await fetchTransactions(); // Refresh list
        setShowModal(false);
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      console.error('❌ Refund error:', err);
      alert(`❌ Failed to process refund: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: <span className="badge badge-success">✓ Success</span>,
      pending: <span className="badge badge-warning">⏳ Pending</span>,
      failed: <span className="badge badge-danger">✕ Failed</span>,
      refunded: <span className="badge badge-info">💰 Refunded</span>,
    };
    return badges[status] || <span className="badge">{status}</span>;
  };

  const getTypeBadge = (type) => {
    const types = {
      transfer: <span className="type-badge transfer">💳 Transfer</span>,
      withdrawal: <span className="type-badge withdrawal">💸 Withdrawal</span>,
      deposit: <span className="type-badge deposit">💰 Deposit</span>,
      loan: <span className="type-badge loan">📋 Loan</span>,
    };
    return types[type] || <span>{type}</span>;
  };

  // 🔥 FIX: Show proper loading/error states
  if (!authChecked) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2>🔐 Verifying permissions...</h2>
          <p>Please wait while we verify your access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminNavbar />

      <div className="admin-content">
        <div className="admin-header">
          <h1>💳 Transaction Management</h1>
          <p>Monitor and manage all transactions</p>
        </div>

        {/* 🔥 FIX: Better error display with retry */}
        {loadingState === LOADING_STATES.ERROR && (
          <div
            style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              color: '#856404',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong>⚠️ Connection Error</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{error}</p>
            </div>
            <button
              onClick={() => {
                setRetryCount(c => c + 1);
                fetchTransactions();
              }}
              style={{
                padding: '8px 16px',
                background: '#ffc107',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              🔄 Retry
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by sender, receiver, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="transfer">💳 Transfer</option>
            <option value="withdrawal">💸 Withdrawal</option>
            <option value="deposit">💰 Deposit</option>
            <option value="loan">📋 Loan</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="completed">✓ Completed</option>
            <option value="pending">⏳ Pending</option>
            <option value="failed">✕ Failed</option>
          </select>
        </div>

        {/* 🔥 FIX: Proper loading state */}
        {loadingState === LOADING_STATES.LOADING && (
          <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '18px' }}>
            <div
              style={{
                display: 'inline-block',
                marginBottom: '20px',
                fontSize: '48px',
              }}
            >
              ⏳
            </div>
            <h3>Loading transactions...</h3>
            <p style={{ color: '#666' }}>This may take a moment</p>
          </div>
        )}

        {/* Transactions Table */}
        {loadingState === LOADING_STATES.SUCCESS && (
          <div className="table-container">
            {filteredTransactions.length > 0 ? (
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Date & Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <tr key={txn._id}>
                      <td>
                        <strong>{txn.reference?.slice(-8) || 'N/A'}</strong>
                      </td>
                      <td>{txn.senderName || 'N/A'}</td>
                      <td>{txn.receiverName || 'N/A'}</td>
                      <td>₹{txn.amount?.toLocaleString('en-IN') || '0'}</td>
                      <td>{getTypeBadge(txn.transactionType)}</td>
                      <td>{txn.description || 'N/A'}</td>
                      <td>{getStatusBadge(txn.status)}</td>
                      <td>
                        {txn.createdAt
                          ? new Date(txn.createdAt).toLocaleString('en-IN')
                          : 'N/A'}
                      </td>
                      <td>
                        <button
                          className="btn-action btn-view"
                          onClick={() => {
                            setSelectedTransaction(txn);
                            setShowModal(true);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <p style={{ fontSize: '18px', margin: 0 }}>
                  {searchTerm ? '🔍 No transactions match your search' : '📭 No transactions found'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 🔥 FIX: Empty state when nothing loaded */}
        {loadingState === LOADING_STATES.IDLE && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <p>Ready to load transactions...</p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showModal && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Transaction Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Transaction Info */}
              <div className="info-section">
                <h3>📋 Transaction Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Transaction ID</label>
                    <p>{selectedTransaction.reference || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Amount</label>
                    <p className="highlight">
                      ₹{selectedTransaction.amount?.toLocaleString('en-IN') || '0'}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Type</label>
                    <p>{getTypeBadge(selectedTransaction.transactionType)}</p>
                  </div>
                  <div className="info-item">
                    <label>Fee</label>
                    <p>₹{selectedTransaction.transactionFee || '0'}</p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="info-section">
                <h3>👥 Parties Involved</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Sender</label>
                    <p>{selectedTransaction.senderName || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Sender Account</label>
                    <p>{selectedTransaction.senderAccountNumber || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Receiver</label>
                    <p>{selectedTransaction.receiverName || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Receiver Account</label>
                    <p>{selectedTransaction.receiverAccountNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Status & Details */}
              <div className="info-section">
                <h3>📊 Status & Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Status</label>
                    <p>{getStatusBadge(selectedTransaction.status)}</p>
                  </div>
                  <div className="info-item">
                    <label>Description</label>
                    <p>{selectedTransaction.description || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Date & Time</label>
                    <p>
                      {selectedTransaction.createdAt
                        ? new Date(selectedTransaction.createdAt).toLocaleString('en-IN')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Failure Reason */}
              {selectedTransaction.failureReason && (
                <div className="info-section">
                  <h3>⚠️ Failure Reason</h3>
                  <p>{selectedTransaction.failureReason}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              {selectedTransaction.status === 'failed' && (
                <button
                  className="btn btn-success"
                  onClick={() => handleRefund(selectedTransaction._id)}
                >
                  💰 Process Refund
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}