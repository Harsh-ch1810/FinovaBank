import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const ApplyLoan = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    amount: '',
    monthlyIncome: '',
    loanReason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.amount || !formData.monthlyIncome || !formData.loanReason) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.amount);
    const income = parseFloat(formData.monthlyIncome);

    if (amount < 1000 || amount > 1000000) {
      setError('Loan amount must be between $1,000 and $1,000,000');
      setLoading(false);
      return;
    }

    if (income <= 0) {
      setError('Monthly income must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      const response = await API.post('/api/loan/apply', {
        amount: amount,
        monthlyIncome: income,
        loanReason: formData.loanReason,
      });

      setSuccess('Loan application submitted successfully! Check your loans to see status.');
      setFormData({
        amount: '',
        monthlyIncome: '',
        loanReason: '',
      });

      // Redirect after success
      setTimeout(() => {
        window.location.href = '/my-loans';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply for loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loan-container">
      <div className="loan-box">
        <div className="loan-form">
          <h1>📊 Apply for Loan</h1>
          <p>Quick and easy loan application</p>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Loan Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="50000"
                min="1000"
                max="1000000"
                step="1000"
                value={formData.amount}
                onChange={handleChange}
                required
              />
              <small>Min: ₹1,000 | Max: ₹1,000,000</small>
            </div>

            <div className="form-group">
              <label>Monthly Income</label>
              <input
                type="number"
                name="monthlyIncome"
                placeholder="5000"
                step="100"
                min="0"
                value={formData.monthlyIncome}
                onChange={handleChange}
                required
              />
              <small>Your monthly income (used to calculate debt ratio)</small>
            </div>

            <div className="form-group">
              <label>Reason for Loan</label>
              <textarea
                name="loanReason"
                placeholder="Tell us why you need this loan..."
                rows="4"
                value={formData.loanReason}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Applying...' : 'Apply for Loan'}
            </button>
          </form>

          <div className="loan-info">
            <h3>ℹ️ Loan Information</h3>
            <ul>
              <li><strong>Processing:</strong> Applications are reviewed within 24 hours</li>
              <li><strong>Requirements:</strong> Minimum monthly income of ₹1,000</li>
              <li><strong>Debt Ratio:</strong> Maximum debt-to-income ratio of 50%</li>
              <li><strong>Terms:</strong> Loans range from ₹1,000 to ₹1,000,000</li>
              <li><strong>Approval:</strong> Admin will contact you once approved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyLoan;