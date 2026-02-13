import React, { useState, useEffect } from 'react';
import API from '../services/api';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await API.get('/admin/transactions');
      setTransactions(response.data.transactions);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = filterStatus === 'all' 
    ? transactions 
    : transactions.filter(t => t.status === filterStatus);

  if (loading) return <div className="loading">Loading transactions...</div>;

  return (
  <div className="admin-container">

    <div className="admin-header">
      <h1>💳 All Transactions</h1>
      <p>View all transactions in the system</p>
    </div>

    {error && <div className="error">{error}</div>}

    {/* Stats Grid */}
    <div className="admin-stats-grid">

      <div className="admin-stat-card">
        <div className="admin-stat-label">Total Transactions</div>
        <div className="admin-stat-value">
          {transactions.length}
        </div>
      </div>

      <div className="admin-stat-card">
        <div className="admin-stat-label">Total Volume</div>
        <div className="admin-stat-value">
          ₹{transactions
            .reduce((sum, t) => sum + t.amount, 0)
            .toLocaleString()}
        </div>
      </div>

      <div className="admin-stat-card">
        <div className="admin-stat-label">Completed</div>
        <div className="admin-stat-value">
          {transactions.filter(t => t.status === 'completed').length}
        </div>
      </div>

    </div>

    {/* Filter */}
    <div className="admin-filter-bar">
      <label>Filter by Status:</label>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        <option value="all">All</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
      </select>
    </div>

    {/* Table */}
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>From</th>
            <th>To</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Status</th>
            <th>Description</th>
          </tr>
        </thead>

        <tbody>
          {filteredTransactions.map((transaction) => (
            <tr key={transaction._id}>
              <td>
                {new Date(transaction.createdAt).toLocaleDateString()}
              </td>

              <td>
                <strong>{transaction.senderName}</strong>
                <div className="sub-text">
                  {transaction.senderAccountId?.slice(-6)}
                </div>
              </td>

              <td>
                <strong>{transaction.receiverName}</strong>
                <div className="sub-text">
                  {transaction.receiverAccountId?.slice(-6)}
                </div>
              </td>

              <td className="amount">
                ₹{transaction.amount.toFixed(2)}
              </td>

              <td style={{ textTransform: 'capitalize' }}>
                {transaction.transactionType}
              </td>

              <td>
                <span className={`status-badge status-${transaction.status}`}>
                  {transaction.status}
                </span>
              </td>

              <td>
                {transaction.description || '-'}
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>

  </div>
);
};

export default AdminTransactions;