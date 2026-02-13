import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const MyLoans = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const res = await API.get('/loan/my-loans');
      setLoans(res.data.loans || []);
    } catch (err) {
      setError('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading your loans...</div>;

  return (
    <div className="dashboard-container">

      {/* Header */}
      <div className="dashboard-content">
        <h1 className="dashboard-title">💰 My Loans</h1>
        <p className="dashboard-subtitle">
          View your loan applications and status
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Empty State */}
      {loans.length === 0 ? (
        <div className="empty-loans-card">
          <h3>No loan applications yet</h3>
          <p>You haven’t applied for any loans yet.</p>

          <button
            className="btn-primary"
            onClick={() => navigate('/apply-loan')}
          >
            Apply for Loan
          </button>
        </div>
      ) : (
        <div className="loans-container">
          {loans.map((loan) => (
            <div key={loan._id} className="loan-card">
              <div className="loan-header">
                <h3>₹{loan.amount}</h3>
                <span className={`status-badge status-${loan.status}`}>
                  {loan.status}
                </span>
              </div>

              <div className="loan-details">
                <div className="detail">
                  <span className="label">Monthly Income</span>
                  <span className="value">₹{loan.monthlyIncome}</span>
                </div>

                <div className="detail">
                  <span className="label">Reason</span>
                  <span className="value">{loan.reason}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MyLoans;
