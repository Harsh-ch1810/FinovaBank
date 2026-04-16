// frontend/src/pages/AdminLoans.jsx - UPDATED TO FETCH REAL DATA
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminLoanAPI } from '../services/api';
import AdminNavbar from '../components/AdminNavbar';
import '../styles/adminLoans.css';

export default function AdminLoans() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backendConnected, setBackendConnected] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // =====================================================
  // AUTHENTICATION CHECK
  // =====================================================
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    // Check backend connection on mount
    checkBackendConnection();
  }, [token, user, navigate]);

  // =====================================================
  // FETCH LOANS WHEN FILTER CHANGES
  // =====================================================
  useEffect(() => {
    if (backendConnected) {
      fetchLoans();
    }
  }, [filterStatus, backendConnected]);

  // =====================================================
  // CHECK BACKEND CONNECTION
  // =====================================================
  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5189/api/admin/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        console.log('✅ Backend connected');
        setBackendConnected(true);
        setError('');
      } else {
        console.warn('⚠️ Backend returned error:', response.status);
        setBackendConnected(false);
        setError('Backend is not responding properly');
      }
    } catch (err) {
      console.error('❌ Backend connection failed:', err.message);
      setBackendConnected(false);
      setError('Cannot connect to backend server on port 5189');
    }
  };

  // =====================================================
  // FETCH LOANS FROM BACKEND
  // =====================================================
  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError('');

      console.log(`🔄 Fetching ${filterStatus} loans from backend...`);

      // Call API using the existing API service
      const response = await adminLoanAPI.getAllLoans(filterStatus);

      if (response.success && response.loans) {
        setLoans(response.loans);
        console.log(`✅ Loaded ${response.loans.length} ${filterStatus} loans`);
        setBackendConnected(true);
      } else {
        setError(response.message || 'Failed to fetch loans from backend');
        setLoans([]);
        setBackendConnected(false);
      }
    } catch (err) {
      console.error('❌ Error fetching loans:', err.message);
      setError(`Connection error: ${err.message}`);
      setLoans([]);
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FILTER LOANS BY SEARCH TERM
  // =====================================================
  const filteredLoans = loans.filter(loan => {
    const query = searchTerm.toLowerCase();
    return (
      loan.userName?.toLowerCase().includes(query) ||
      loan.userEmail?.toLowerCase().includes(query) ||
      loan._id?.toLowerCase().includes(query)
    );
  });

  // =====================================================
  // APPROVE LOAN
  // =====================================================
  const handleApproveLoan = async () => {
    if (!selectedLoan) return;

    try {
      setActionLoading(true);

      console.log('✅ Approving loan:', selectedLoan._id);

      // Call API
      const response = await adminLoanAPI.approveLoan(selectedLoan._id, 'Approved by admin');

      if (response.success) {
        alert('✅ Loan approved successfully!\n\nUser will receive notification email.');
        await fetchLoans(); // Refresh list
        setShowModal(false);
        setSelectedLoan(null);
      } else {
        alert(`❌ Error: ${response.message}`);
      }
    } catch (err) {
      console.error('❌ Approval error:', err);
      alert(`❌ Failed to approve loan: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // REJECT LOAN
  // =====================================================
  const handleRejectLoan = async () => {
    if (!selectedLoan) return;

    if (!rejectReason.trim()) {
      alert('❌ Please enter a rejection reason');
      return;
    }

    try {
      setActionLoading(true);

      console.log('❌ Rejecting loan:', selectedLoan._id);

      // Call API
      const response = await adminLoanAPI.rejectLoan(selectedLoan._id, rejectReason);

      if (response.success) {
        alert('✅ Loan rejected successfully!\n\nUser will receive notification email with reason.');
        await fetchLoans(); // Refresh list
        setShowModal(false);
        setSelectedLoan(null);
        setRejectReason('');
        setShowRejectForm(false);
      } else {
        alert(`❌ Error: ${response.message}`);
      }
    } catch (err) {
      console.error('❌ Rejection error:', err);
      alert(`❌ Failed to reject loan: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // STATUS BADGE
  // =====================================================
  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="badge badge-warning">⏳ Pending</span>,
      approved: <span className="badge badge-success">✓ Approved</span>,
      rejected: <span className="badge badge-danger">✕ Rejected</span>,
      active: <span className="badge badge-info">💰 Active</span>,
      closed: <span className="badge badge-secondary">✓ Closed</span>,
    };
    return badges[status] || <span className="badge">{status}</span>;
  };

  return (
    <div className="admin-container">
      <AdminNavbar />

      <div className="admin-content">
        {/* Header */}
        <div className="admin-header">
          <h1>📋 Loan Management</h1>
          <p>Manage and approve/reject loan applications</p>
        </div>

        {/* Connection Status */}
        {!backendConnected && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>🔌 Backend is NOT connected. Attempting to reconnect...</span>
            <button
              onClick={() => {
                checkBackendConnection();
              }}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Try Reconnecting
            </button>
          </div>
        )}

        {backendConnected && (
          <div style={{
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            color: '#155724',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            ✅ Backend connected successfully. Showing REAL loan data.
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            color: '#856404',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, email, or Application ID..."
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
            <option value="pending">⏳ Pending ({loans.filter(l => l.status === 'pending').length})</option>
            <option value="approved">✓ Approved ({loans.filter(l => l.status === 'approved').length})</option>
            <option value="rejected">✕ Rejected ({loans.filter(l => l.status === 'rejected').length})</option>
            <option value="active">💰 Active ({loans.filter(l => l.status === 'active').length})</option>
            <option value="closed">✓ Closed ({loans.filter(l => l.status === 'closed').length})</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#6c757d' }}>
            ⏳ Loading loans...
          </div>
        )}

        {/* Loans Table */}
        {!loading && (
          <div className="table-container">
            {filteredLoans.length > 0 ? (
              <table className="loans-table">
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Applicant Name</th>
                    <th>Email</th>
                    <th>Loan Amount</th>
                    <th>Tenure</th>
                    <th>EMI</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => (
                    <tr key={loan._id}>
                      <td><strong>{loan._id?.slice(-8).toUpperCase()}</strong></td>
                      <td>{loan.userName || 'N/A'}</td>
                      <td>{loan.userEmail || 'N/A'}</td>
                      <td>₹{loan.amount?.toLocaleString('en-IN') || '0'}</td>
                      <td>{loan.tenureMonths} months</td>
                      <td>₹{loan.monthlyEMI?.toLocaleString('en-IN') || '0'}</td>
                      <td>{loan.loanType || 'N/A'}</td>
                      <td>{getStatusBadge(loan.status)}</td>
                      <td>{new Date(loan.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <button
                          className="btn-action btn-view"
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowModal(true);
                            setShowRejectForm(false);
                          }}
                          disabled={actionLoading}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                {loans.length === 0 ? '❌ No loans found' : '❌ No matching loans found'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loan Details Modal */}
      {showModal && selectedLoan && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Loan Application Details</h2>
              <button
                className="close-btn"
                onClick={() => !actionLoading && setShowModal(false)}
                disabled={actionLoading}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Applicant Info */}
              <div className="info-section">
                <h3>👤 Applicant Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name</label>
                    <p>{selectedLoan.userName || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{selectedLoan.userEmail || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>User ID</label>
                    <p>{selectedLoan.userId || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Applied Date</label>
                    <p>{new Date(selectedLoan.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="info-section">
                <h3>💰 Loan Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Loan Amount</label>
                    <p className="highlight">₹{selectedLoan.amount?.toLocaleString('en-IN') || '0'}</p>
                  </div>
                  <div className="info-item">
                    <label>Tenure (Months)</label>
                    <p>{selectedLoan.tenureMonths || '0'}</p>
                  </div>
                  <div className="info-item">
                    <label>Interest Rate</label>
                    <p>{selectedLoan.interestRate || '0'}% p.a.</p>
                  </div>
                  <div className="info-item">
                    <label>Monthly EMI</label>
                    <p className="highlight">₹{selectedLoan.monthlyEMI?.toLocaleString('en-IN') || '0'}</p>
                  </div>
                  <div className="info-item">
                    <label>Loan Type</label>
                    <p>{selectedLoan.loanType || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Total Payable</label>
                    <p>₹{selectedLoan.totalPayable?.toLocaleString('en-IN') || '0'}</p>
                  </div>
                </div>
                <div className="info-item full-width">
                  <label>Purpose of Loan</label>
                  <p>{selectedLoan.purpose || 'Not specified'}</p>
                </div>
              </div>

              {/* Status */}
              <div className="info-section">
                <h3>📊 Current Status</h3>
                <div className="status-display">
                  {getStatusBadge(selectedLoan.status)}
                </div>
                {selectedLoan.rejectionReason && (
                  <div className="rejection-reason">
                    <p><strong>Rejection Reason:</strong> {selectedLoan.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Rejection Form */}
              {showRejectForm && (
                <div className="info-section reject-form">
                  <h3>❌ Rejection Reason</h3>
                  <textarea
                    placeholder="Enter reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows="4"
                    disabled={actionLoading}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontFamily: 'inherit',
                    }}
                  ></textarea>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {selectedLoan.status === 'pending' && !showRejectForm && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={handleApproveLoan}
                    disabled={actionLoading}
                    style={{
                      padding: '8px 16px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {actionLoading ? '⏳ Processing...' : '✓ Approve Loan'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionLoading}
                    style={{
                      padding: '8px 16px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ✕ Reject Loan
                  </button>
                </>
              )}
              {showRejectForm && (
                <>
                  <button
                    className="btn btn-danger"
                    onClick={handleRejectLoan}
                    disabled={actionLoading || !rejectReason.trim()}
                    style={{
                      padding: '8px 16px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {actionLoading ? '⏳ Processing...' : '✕ Confirm Rejection'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason('');
                    }}
                    disabled={actionLoading}
                    style={{
                      padding: '8px 16px',
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
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