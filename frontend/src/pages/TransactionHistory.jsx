import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';




const TransactionHistory = () => {

  const { user } = useContext(AuthContext);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await API.get('/transaction/history');
      setTransactions(res.data.transactions || []);
    } catch (err) {
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading transactions...</div>;

  return (
    <div className="dashboard-container">

      {/* Header */}
      <div className="dashboard-content">
        <h1>📝 Transaction History</h1>
        <p>View all your recent transactions</p>
      </div>

      {error && <div className="error">{error}</div>}

      {transactions.length === 0 ? (
        <div className="empty-history-card">
          <h3>No transactions yet</h3>
          <p>Your transaction history will appear here.</p>
        </div>
      ) : (
        <div className="transactions-card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>From / To</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
  {transactions.map((tx) => {
    const isSent = tx.senderId === user?._id;

    return (
      <tr key={tx._id}>
        <td>
          <div className="tx-date">
            {new Date(tx.createdAt).toLocaleDateString()}
          </div>
          <div className="tx-time">
            {new Date(tx.createdAt).toLocaleTimeString()}
          </div>
        </td>

        <td>
          <span className={`tx-type ${isSent ? 'sent' : 'received'}`}>
            {isSent ? 'Sent' : 'Received'}
          </span>
        </td>

        <td>
          <div className="tx-name">
            <strong>From:</strong> {tx.senderName}
          </div>
          <div className="tx-name">
            <strong>To:</strong> {tx.receiverName}
          </div>
          <div className="tx-desc">
            {tx.description || 'No description'}
          </div>
        </td>

        <td className={`tx-amount ${isSent ? 'amount-negative' : 'amount-positive'}`}>
          {isSent ? '-' : '+'}₹{tx.amount}
        </td>

        <td>
          <span className={`status-badge status-${tx.status.toLowerCase()}`}>
            {tx.status}
          </span>
        </td>
      </tr>
    );
  })}
</tbody>



          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
