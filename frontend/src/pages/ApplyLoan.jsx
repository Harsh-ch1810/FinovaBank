// src/pages/ApplyLoan.jsx - CENTERED LAYOUT VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountAPI, loanAPI } from '../services/api';
import '../styles/applyloan.css';

export default function ApplyLoan() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emiInfo, setEmiInfo] = useState(null);

  const [formData, setFormData] = useState({
    loanType: 'Personal',
    amount: '',
    tenureMonths: 12,
    purpose: '',
  });

  // Fetch real account info
  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      const fetchAccount = async () => {
        try {
          const result = await accountAPI.getInfo();
          if (result.success) {
            setAccount(result.account);
          }
        } catch (err) {
          console.error('Error fetching account:', err);
        }
      };
      fetchAccount();
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' || name === 'tenureMonths' ? parseFloat(value) : value,
    }));
    setEmiInfo(null);
  };

  const handleCalculateEMI = async () => {
    if (!formData.amount || !formData.tenureMonths) {
      setError('❌ Please fill amount and tenure');
      return;
    }

    try {
      const result = await loanAPI.calculateEMI(
        formData.amount,
        formData.tenureMonths
      );

      if (result.success) {
        setEmiInfo(result.emiCalculation);
        setError('');
      } else {
        setError(result.message);
      }
    } catch (err) {
      // Calculate locally if API fails
      const monthlyRate = 0.09 / 12; // 9% annual
      const emiAmount =
        (formData.amount * monthlyRate * Math.pow(1 + monthlyRate, formData.tenureMonths)) /
        (Math.pow(1 + monthlyRate, formData.tenureMonths) - 1);

      const totalPayable = emiAmount * formData.tenureMonths;
      const totalInterest = totalPayable - formData.amount;

      setEmiInfo({
        amount: formData.amount,
        interestRate: 9,
        tenureMonths: formData.tenureMonths,
        monthlyEMI: Math.round(emiAmount),
        totalInterest: Math.round(totalInterest),
        totalPayable: Math.round(totalPayable),
      });
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.amount || !formData.tenureMonths || !formData.purpose) {
      setError('❌ Please fill all required fields');
      setLoading(false);
      return;
    }

    if (formData.amount < 10000) {
      setError('❌ Minimum loan amount is ₹10,000');
      setLoading(false);
      return;
    }

    if (formData.amount > 5000000) {
      setError('❌ Maximum loan amount is ₹50,00,000');
      setLoading(false);
      return;
    }

    try {
      const result = await loanAPI.applyLoan(
        formData.loanType,
        formData.amount,
        formData.tenureMonths,
        formData.purpose
      );

      if (result.success) {
        setSuccess(`✅ Loan application submitted successfully!\nApplication ID: ${result.loan.id}`);
        setFormData({
          loanType: 'Personal',
          amount: '',
          tenureMonths: 12,
          purpose: '',
        });
        setEmiInfo(null);

        setTimeout(() => {
          navigate('/my-loans');
        }, 2000);
      } else {
        setError('❌ ' + result.message);
      }
    } catch (err) {
      setError('❌ Failed to apply for loan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loanTypes = ['Personal', 'Home', 'Vehicle', 'Education'];
  const tenureOptions = [6, 12, 24, 36, 48, 60];

  const interestRates = {
    Personal: 9,
    Home: 6.5,
    Vehicle: 7.5,
    Education: 6,
  };

  return (
    <div className="loan-container">
      {/* Header */}
      <div className="loan-header">
        <h1>💰 Apply for Loan</h1>
        <p>Get the funds you need with flexible repayment options</p>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Main Content */}
      <div className="loan-card">
        {/* Account Balance */}
        {account && (
          <div className="balance-info">
            <p>Available Balance: <strong>₹{account.balance.toLocaleString('en-IN')}</strong></p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="loan-form">
          {/* Loan Type */}
          <div className="form-group">
            <label>Loan Type *</label>
            <select
              name="loanType"
              value={formData.loanType}
              onChange={handleChange}
            >
              {loanTypes.map((type) => (
                <option key={type} value={type}>
                  {type} Loan {interestRates[type]}% p.a.
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label>Loan Amount (₹) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="100000"
              min="10000"
              step="1000"
            />
            <small>Min: ₹10,000 | Max: ₹50,00,000</small>
          </div>

          {/* Tenure */}
          <div className="form-group">
            <label>Loan Tenure (Months) *</label>
            <select
              name="tenureMonths"
              value={formData.tenureMonths}
              onChange={handleChange}
            >
              {tenureOptions.map((months) => (
                <option key={months} value={months}>
                  {months} months
                </option>
              ))}
            </select>
          </div>

          {/* Purpose */}
          <div className="form-group">
            <label>Purpose *</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="What do you need this loan for?"
              rows="4"
              maxLength="500"
            ></textarea>
            <small>{formData.purpose.length}/500 characters</small>
          </div>

          {/* Buttons */}
          <div className="form-buttons">
            <button
              type="button"
              className="btn-calculate"
              onClick={handleCalculateEMI}
              disabled={!formData.amount || !formData.tenureMonths}
            >
              📊 Calculate EMI
            </button>
            <button
              type="submit"
              className="btn-apply"
              disabled={loading || !formData.amount || !formData.tenureMonths || !formData.purpose}
            >
              {loading ? '⏳ Applying...' : '✅ Apply for Loan'}
            </button>
          </div>
        </form>

        {/* EMI Information */}
        {emiInfo && (
          <div className="emi-info">
            <h3>💡 Loan Calculation</h3>
            <div className="emi-detail">
              <div className="emi-row">
                <span className="label">Loan Amount:</span>
                <span className="value">₹{emiInfo.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="emi-row">
                <span className="label">Interest Rate:</span>
                <span className="value">{emiInfo.interestRate}% p.a.</span>
              </div>
              <div className="emi-row">
                <span className="label">Tenure:</span>
                <span className="value">{emiInfo.tenureMonths} months</span>
              </div>
              <div className="emi-row highlight">
                <span className="label">Monthly EMI:</span>
                <span className="value">₹{emiInfo.monthlyEMI.toLocaleString('en-IN')}</span>
              </div>
              <div className="emi-row">
                <span className="label">Total Interest:</span>
                <span className="value">₹{emiInfo.totalInterest.toLocaleString('en-IN')}</span>
              </div>
              <div className="emi-row highlight">
                <span className="label">Total Payable:</span>
                <span className="value">₹{emiInfo.totalPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="loan-info">
        <div className="info-row">
          <div className="info-card">
            <h4>✓ Quick Approval</h4>
            <p>Get approved in minutes</p>
          </div>
          <div className="info-card">
            <h4>📅 Flexible Terms</h4>
            <p>6 to 60 months tenure</p>
          </div>
          <div className="info-card">
            <h4>💰 Easy Repayment</h4>
            <p>Affordable EMI options</p>
          </div>
          <div className="info-card">
            <h4>🔒 Secure</h4>
            <p>Bank-level encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
}