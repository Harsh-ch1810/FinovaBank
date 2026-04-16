// src/pages/AdminUsers.jsx - IMPROVED WITH FULL USER MANAGEMENT
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import '../styles/adminusers.css';

export default function AdminUsers() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('active');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [editForm, setEditForm] = useState({});

  const [users, setUsers] = useState([
    {
      id: 'U001',
      firstName: 'Harsh',
      lastName: 'Chauhan',
      email: 'harsh@email.com',
      phone: '9123456789',
      accountBalance: 250000,
      status: 'active',
      registrationStatus: 'approved',
      registeredDate: '2025-01-15',
      kycStatus: 'verified',
      loans: 2,
      totalLoans: 500000,
      documents: ['Aadhar', 'PAN', 'Bank Account'],
      failedLogins: 0,
      lastLogin: '2026-03-19 10:30 AM',
      accountStatus: 'active',
      fraudFlags: 0,
      activities: [
        { type: 'login', time: '2026-03-19 10:30 AM', status: 'success' },
        { type: 'transfer', time: '2026-03-18 2:15 PM', status: 'success', amount: 50000 },
        { type: 'profile_update', time: '2026-03-17 4:45 PM', status: 'success' },
      ]
    },
    {
      id: 'U002',
      firstName: 'Priya',
      lastName: 'Singh',
      email: 'priya@email.com',
      phone: '9123456790',
      accountBalance: 150000,
      status: 'pending',
      registrationStatus: 'pending',
      registeredDate: '2026-03-19',
      kycStatus: 'pending',
      loans: 0,
      totalLoans: 0,
      documents: ['Aadhar'],
      failedLogins: 0,
      lastLogin: 'Never',
      accountStatus: 'inactive',
      fraudFlags: 0,
      activities: [
        { type: 'registration', time: '2026-03-19 9:00 AM', status: 'pending' },
      ]
    },
    {
      id: 'U003',
      firstName: 'Amit',
      lastName: 'Patel',
      email: 'amit@email.com',
      phone: '9123456791',
      accountBalance: 500000,
      status: 'active',
      registrationStatus: 'approved',
      registeredDate: '2025-01-20',
      kycStatus: 'verified',
      loans: 0,
      totalLoans: 0,
      documents: ['Aadhar', 'PAN'],
      failedLogins: 0,
      lastLogin: '2026-03-19 8:15 AM',
      accountStatus: 'active',
      fraudFlags: 0,
      activities: [
        { type: 'login', time: '2026-03-19 8:15 AM', status: 'success' },
      ]
    },
    {
      id: 'U004',
      firstName: 'Sneha',
      lastName: 'Sharma',
      email: 'sneha@email.com',
      phone: '9123456792',
      accountBalance: 0,
      status: 'blocked',
      registrationStatus: 'approved',
      registeredDate: '2025-02-05',
      kycStatus: 'verified',
      loans: 1,
      totalLoans: 1000000,
      documents: ['Aadhar', 'PAN', 'Bank Account'],
      failedLogins: 5,
      lastLogin: '2026-03-15 3:30 PM',
      accountStatus: 'frozen',
      fraudFlags: 3,
      activities: [
        { type: 'login', time: '2026-03-15 3:30 PM', status: 'failed' },
        { type: 'large_transfer', time: '2026-03-14 2:00 PM', status: 'flagged', amount: 500000 },
      ]
    },
    {
      id: 'U005',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      email: 'rajesh@email.com',
      phone: '9123456793',
      accountBalance: 75000,
      status: 'active',
      registrationStatus: 'approved',
      registeredDate: '2025-02-15',
      kycStatus: 'verified',
      loans: 0,
      totalLoans: 0,
      documents: ['Aadhar'],
      failedLoans: 2,
      lastLogin: '2026-03-19 11:45 AM',
      accountStatus: 'active',
      fraudFlags: 0,
      activities: [
        { type: 'login', time: '2026-03-19 11:45 AM', status: 'success' },
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

  const getPendingUsers = () => users.filter(u => u.registrationStatus === 'pending');
  const getActiveUsers = () => users.filter(u => u.status === 'active');
  const getBlockedUsers = () => users.filter(u => u.status === 'blocked');

  const filteredUsers = (() => {
    let result = [];
    if (activeTab === 'pending') result = getPendingUsers();
    else if (activeTab === 'active') result = getActiveUsers();
    else if (activeTab === 'blocked') result = getBlockedUsers();
    else result = users;

    return result.filter(usr => 
      usr.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usr.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  })();

  const handleViewUser = (usr) => {
    setSelectedUser(usr);
    setEditForm({ ...usr });
    setShowModal(true);
  };

  const handleApproveRegistration = (userId) => {
    setUsers(users.map(usr => 
      usr.id === userId ? { 
        ...usr, 
        registrationStatus: 'approved',
        status: 'active',
        accountStatus: 'active',
        kycStatus: 'verified'
      } : usr
    ));
    alert('✅ User registration approved! Account activated.');
    setShowModal(false);
  };

  const handleRejectRegistration = (userId) => {
    if (window.confirm('Are you sure you want to reject this registration?')) {
      setUsers(users.filter(usr => usr.id !== userId));
      alert('✅ Registration rejected. User account deleted.');
      setShowModal(false);
    }
  };

  const handleResetPassword = (userId) => {
    if (!newPassword || newPassword.length < 8) {
      alert('❌ Password must be at least 8 characters');
      return;
    }
    alert(`✅ Password reset successfully!\nNew temporary password has been sent to ${selectedUser.email}`);
    setShowResetPassword(false);
    setNewPassword('');
  };

  const handleBlockUser = (userId) => {
    setUsers(users.map(usr => 
      usr.id === userId ? { ...usr, status: usr.status === 'blocked' ? 'active' : 'blocked' } : usr
    ));
    const action = users.find(u => u.id === userId)?.status === 'blocked' ? 'unblocked' : 'blocked';
    alert(`✅ User ${action} successfully!`);
    setShowModal(false);
  };

  const handleFreezeAccount = (userId) => {
    setUsers(users.map(usr => 
      usr.id === userId ? { ...usr, accountStatus: usr.accountStatus === 'frozen' ? 'active' : 'frozen' } : usr
    ));
    const action = users.find(u => u.id === userId)?.accountStatus === 'frozen' ? 'unfrozen' : 'frozen';
    alert(`✅ Account ${action} successfully!`);
    setShowModal(false);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('⚠️ This will permanently delete the user. Continue?')) {
      setUsers(users.filter(usr => usr.id !== userId));
      alert('✅ User deleted successfully!');
      setShowModal(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: <span className="badge badge-success">✓ Active</span>,
      pending: <span className="badge badge-warning">⏳ Pending</span>,
      blocked: <span className="badge badge-danger">🚫 Blocked</span>,
    };
    return badges[status] || badges.active;
  };

  const getKycBadge = (status) => {
    const badges = {
      verified: <span className="badge badge-success">✓ Verified</span>,
      pending: <span className="badge badge-warning">⏳ Pending</span>,
      rejected: <span className="badge badge-danger">✕ Rejected</span>,
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="admin-container">
      <AdminNavbar />

      <div className="admin-content">
        <div className="admin-header">
          <h1>👥 User Management</h1>
          <p>Manage user accounts, approvals, and security</p>
        </div>

        {/* Tabs */}
        <div className="user-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            ⏳ Pending Approvals ({getPendingUsers().length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            ✓ Active Users ({getActiveUsers().length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'blocked' ? 'active' : ''}`}
            onClick={() => setActiveTab('blocked')}
          >
            🚫 Blocked Users ({getBlockedUsers().length})
          </button>
        </div>

        {/* Search */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>{activeTab === 'pending' ? 'Status' : 'Balance'}</th>
                <th>{activeTab === 'pending' ? 'KYC' : 'Account'}</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((usr) => (
                  <tr key={usr.id}>
                    <td><strong>{usr.id}</strong></td>
                    <td>{usr.firstName} {usr.lastName}</td>
                    <td>{usr.email}</td>
                    <td>{usr.phone}</td>
                    <td>
                      {activeTab === 'pending' 
                        ? getStatusBadge(usr.registrationStatus)
                        : `₹${usr.accountBalance.toLocaleString('en-IN')}`
                      }
                    </td>
                    <td>
                      {activeTab === 'pending'
                        ? getKycBadge(usr.kycStatus)
                        : <span className="badge" style={{ background: usr.accountStatus === 'frozen' ? '#ff6b6b' : '#1fb981', color: 'white' }}>
                            {usr.accountStatus === 'frozen' ? '🔒 Frozen' : '✓ Active'}
                          </span>
                      }
                    </td>
                    <td>
                      <button 
                        className="btn-action btn-view"
                        onClick={() => handleViewUser(usr)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 User Management</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Personal Info */}
              <div className="info-section">
                <h3>📝 Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>User ID</label>
                    <p>{editForm.id}</p>
                  </div>
                  <div className="info-item">
                    <label>Name</label>
                    <p>{editForm.firstName} {editForm.lastName}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{editForm.email}</p>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <p>{editForm.phone}</p>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="info-section">
                <h3>💰 Account Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Account Balance</label>
                    <p className="highlight">₹{editForm.accountBalance?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="info-item">
                    <label>Account Status</label>
                    <p><span className={`badge ${editForm.accountStatus === 'frozen' ? 'badge-danger' : 'badge-success'}`}>
                      {editForm.accountStatus === 'frozen' ? '🔒 Frozen' : '✓ Active'}
                    </span></p>
                  </div>
                  <div className="info-item">
                    <label>Status</label>
                    <p>{getStatusBadge(editForm.status)}</p>
                  </div>
                  <div className="info-item">
                    <label>Registration Status</label>
                    <p>{getStatusBadge(editForm.registrationStatus)}</p>
                  </div>
                </div>
              </div>

              {/* KYC & Security */}
              <div className="info-section">
                <h3>🛡️ KYC & Security</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>KYC Status</label>
                    <p>{getKycBadge(editForm.kycStatus)}</p>
                  </div>
                  <div className="info-item">
                    <label>Failed Logins</label>
                    <p className={editForm.failedLogins > 3 ? 'highlight-danger' : ''}>{editForm.failedLogins}</p>
                  </div>
                  <div className="info-item">
                    <label>Fraud Flags</label>
                    <p className={editForm.fraudFlags > 0 ? 'highlight-danger' : ''}>{editForm.fraudFlags}</p>
                  </div>
                  <div className="info-item">
                    <label>Last Login</label>
                    <p>{editForm.lastLogin}</p>
                  </div>
                </div>
              </div>

              {/* Activity Logs */}
              <div className="info-section">
                <h3>📜 Recent Activity</h3>
                <div className="activity-logs">
                  {editForm.activities?.map((activity, idx) => (
                    <div key={idx} className="activity-log-item">
                      <span className="activity-type">{activity.type.replace('_', ' ').toUpperCase()}</span>
                      <span className="activity-time">{activity.time}</span>
                      <span className={`activity-status ${activity.status}`}>
                        {activity.status === 'success' && '✓'}
                        {activity.status === 'failed' && '✕'}
                        {activity.status === 'flagged' && '⚠️'}
                        {activity.status === 'pending' && '⏳'}
                      </span>
                      {activity.amount && <span className="activity-amount">₹{activity.amount.toLocaleString('en-IN')}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset Password Section */}
              {showResetPassword && (
                <div className="info-section reset-password-form">
                  <h3>🔑 Reset Password</h3>
                  <div className="form-group">
                    <label>New Password</label>
                    <input 
                      type="password" 
                      placeholder="Enter new password (min 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                    <button className="btn btn-primary" onClick={() => handleResetPassword(selectedUser.id)}>
                      Set Password
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowResetPassword(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              {selectedUser.registrationStatus === 'pending' && (
                <>
                  <button 
                    className="btn btn-success"
                    onClick={() => handleApproveRegistration(selectedUser.id)}
                  >
                    ✓ Approve Registration
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleRejectRegistration(selectedUser.id)}
                  >
                    ✕ Reject Registration
                  </button>
                </>
              )}
              {selectedUser.registrationStatus === 'approved' && (
                <>
                  {!showResetPassword && (
                    <button 
                      className="btn btn-info"
                      onClick={() => setShowResetPassword(true)}
                    >
                      🔑 Reset Password
                    </button>
                  )}
                  <button 
                    className={selectedUser.accountStatus === 'frozen' ? 'btn btn-success' : 'btn btn-warning'}
                    onClick={() => handleFreezeAccount(selectedUser.id)}
                  >
                    {selectedUser.accountStatus === 'frozen' ? '✓ Unfreeze Account' : '🔒 Freeze Account'}
                  </button>
                  <button 
                    className={selectedUser.status === 'blocked' ? 'btn btn-success' : 'btn btn-warning'}
                    onClick={() => handleBlockUser(selectedUser.id)}
                  >
                    {selectedUser.status === 'blocked' ? '✓ Unblock User' : '🚫 Block User'}
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDeleteUser(selectedUser.id)}
                  >
                    🗑️ Delete User
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