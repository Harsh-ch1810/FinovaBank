import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const Transfer = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    receiverEmail: '',
    amount: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

useEffect(() => {
  if (!user) return;

  if (user.role === 'admin') {
    setError('Admins cannot send money. Use Admin Dashboard.');
    setBalance(0);
    return;
  }

  fetchBalance();
}, [user]);

  const fetchBalance = async () => {
    try {
      const response = await API.get('/account/info');
      setBalance(response.data.account.balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

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
    if (!formData.receiverEmail || !formData.amount) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      setError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    if (amount > balance) {
      setError('Insufficient balance');
      setLoading(false);
      return;
    }

    try {
      const response = await API.post('/transaction/transfer', {
        receiverEmail: formData.receiverEmail,
        amount: amount,
        description: formData.description,
      });

      setSuccess(`Transfer successful! ₹${amount.toFixed(2)} sent to ${formData.receiverEmail}`);


      setFormData({
        receiverEmail: '',
        amount: '',
        description: '',
      });
      fetchBalance();

      // Redirect after success
      setTimeout(() => navigate('/history'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-container">
      <div className="transfer-box">
        <div className="transfer-form">
          <h1>💸 Send Money</h1>
          <p>Transfer funds to another account</p>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
         <div className="balance-box">
           <span className="balance-label">Available Balance</span>
             <span className="balance-amount">₹{balance.toFixed(2)}</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Recipient Email</label>
              <input
                type="email"
                name="receiverEmail"
                placeholder="recipient@email.com"
                value={formData.receiverEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                name="description"
                placeholder="What is this transfer for?"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <button
             type="submit"
             className="btn-submit"
            disabled={loading || user?.role === 'admin'}
             >
              {user?.role === 'admin' ? 'Admins cannot transfer' : 'Send Money'}
            </button>
          </form>

          <div className="transfer-info">
            <h3>ℹ️ Transfer Information</h3>
            <ul>
              <li>Transfers are processed instantly</li>
              <li>Make sure the recipient email is correct</li>
              <li>You can view transaction history anytime</li>
              <li>Maximum transfer: ₹1,000,000</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;