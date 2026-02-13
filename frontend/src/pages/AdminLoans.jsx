import React, { useState, useEffect } from 'react';
import API from '../services/api';

const AdminLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await API.get('/api/admin/loans');
      setLoans(response.data.loans);
    } catch (err) {
      setError('Failed to fetch loans');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loanId) => {
    setApprovingId(loanId);
    try {
      await API.post(`/api/admin/loan/${loanId}/approve`);
      alert('Loan approved successfully!');
      fetchLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve loan');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (loanId) => {
    if (!window.confirm('Are you sure you want to reject this loan?')) return;

    setApprovingId(loanId);
    try {
      await API.post(`/api/admin/loan/${loanId}/reject`);
      alert('Loan rejected successfully!');
      fetchLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject loan');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) return <div className="loading">Loading loans...</div>;

  const pendingLoans = loans.filter(l => l.status === 'pending');
  const approvedLoans = loans.filter(l => l.status === 'approved');
  const rejectedLoans = loans.filter(l => l.status === 'rejected');

  return (
  <div className="admin-container">

    <div className="admin-header">
      <h1>📋 Loan Applications</h1>
      <p>Review and manage loan applications</p>
    </div>

    {error && <div className="error">{error}</div>}

    {/* Stats Grid */}
    <div className="admin-stats-grid">

      <div className="admin-stat-card">
        <div className="admin-stat-label">Pending</div>
        <div className="admin-stat-value">
          {loans.filter(l => l.status === 'pending').length}
        </div>
      </div>

      <div className="admin-stat-card">
        <div className="admin-stat-label">Approved</div>
        <div className="admin-stat-value">
          {loans.filter(l => l.status === 'approved').length}
        </div>
      </div>

      <div className="admin-stat-card">
        <div className="admin-stat-label">Rejected</div>
        <div className="admin-stat-value">
          {loans.filter(l => l.status === 'rejected').length}
        </div>
      </div>

      <div className="admin-stat-card">
        <div className="admin-stat-label">Total Amount</div>
        <div className="admin-stat-value">
          ₹{loans.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}
        </div>
      </div>

    </div>

    {/* Loans Table */}
    {loans.length === 0 ? (
      <div className="empty-loans-card">
        <h3>No loan applications yet</h3>
        <p>Loan requests from users will appear here.</p>
      </div>
    ) : (
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Amount</th>
              <th>Purpose</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {loans.map((loan) => (
              <tr key={loan._id}>
                <td>
                  {new Date(loan.createdAt).toLocaleDateString()}
                </td>

                <td>
                  <strong>{loan.userName}</strong>
                  <div className="sub-text">
                    {loan.userEmail}
                  </div>
                </td>

                <td className="amount">
                  ₹{loan.amount.toLocaleString()}
                </td>

                <td>{loan.purpose}</td>

                <td>
                  <span className={`status-badge status-${loan.status}`}>
                    {loan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

  </div>
);

};

export default AdminLoans;