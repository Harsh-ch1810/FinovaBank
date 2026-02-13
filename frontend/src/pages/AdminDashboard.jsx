import React, { useState, useEffect } from 'react';
import API from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await API.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Filter users
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  // 📊 Stats
  const totalUsers = filteredUsers.length;

  const totalBalance = filteredUsers.reduce(
    (sum, user) => sum + (user.balance || 0),
    0
  );

  const avgBalance =
    totalUsers > 0 ? (totalBalance / totalUsers).toFixed(2) : 0;

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="admin-container">

      <div className="admin-header">
        <h1>👥 Admin Dashboard</h1>
        <p>Manage users and view system statistics</p>
      </div>

      {error && <div className="error">{error}</div>}

      {/* 🔍 Search */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search "
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 📊 Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Users</div>
          <div className="admin-stat-value">{totalUsers}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Balance</div>
          <div className="admin-stat-value">
            ₹{totalBalance.toFixed(2)}
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Average Balance</div>
          <div className="admin-stat-value">
            ₹{avgBalance}
          </div>
        </div>
      </div>

      {/* 📋 Users Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Account Number</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span
                    className={`role-badge ${
                      user.role === 'admin'
                        ? 'role-admin'
                        : 'role-customer'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td>{user.accountNumber || 'N/A'}</td>
                <td>₹{user.balance?.toFixed(2) || '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminDashboard;
