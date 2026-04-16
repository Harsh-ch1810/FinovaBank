// frontend/src/pages/QuickTransfer.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quickTransferAPI, accountAPI } from '../services/api';
import '../styles/transfer.css';

export default function QuickTransfer() {
  const navigate = useNavigate();
  const { token, account, updateBalance } = useAuth(); // ✅ GET updateBalance FROM CONTEXT
  const [formData, setFormData] = useState({
    beneficiaryName: '',
    beneficiaryAccountNumber: '',
    amount: '',
    transferType: 'other',
    purpose: '',
  });

  const [savedBeneficiaries, setSavedBeneficiaries] = useState([]);
  const [showAllBeneficiaries, setShowAllBeneficiaries] = useState(false); // ✅ SHOW ALL BENEFICIARIES
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentBalance, setCurrentBalance] = useState(null);
  const [beneficiaryVerified, setBeneficiaryVerified] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // ✅ SUCCESS MODAL

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // ✅ SYNC BALANCE FROM CONTEXT INSTEAD OF API
  useEffect(() => {
    if (account) {
      setCurrentBalance(account.balance);
    }
  }, [account]);

  // ✅ LOAD SAVED BENEFICIARIES
  useEffect(() => {
    const loadBeneficiaries = async () => {
      try {
        const beneficiariesResult = await quickTransferAPI.getSavedBeneficiaries();
        if (beneficiariesResult.success) {
          setSavedBeneficiaries(beneficiariesResult.beneficiaries || []);
        }
      } catch (err) {
        console.error('Error loading beneficiaries:', err);
      }
    };

    if (token) {
      loadBeneficiaries();
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'beneficiaryAccountNumber') {
      setBeneficiaryVerified(false);
    }
  };

  const handleSelectBeneficiary = (beneficiary) => {
    setFormData((prev) => ({
      ...prev,
      beneficiaryName: beneficiary.beneficiaryName,
      beneficiaryAccountNumber: beneficiary.beneficiaryAccountNumber,
    }));
    setBeneficiaryVerified(true);
    setShowAllBeneficiaries(false); // Close modal after selection
  };

  const handleVerifyBeneficiary = async () => {
    if (!formData.beneficiaryAccountNumber) {
      setError('Please enter account number');
      return;
    }

    setLoading(true);
    try {
      const result = await quickTransferAPI.verifyBeneficiary(
        formData.beneficiaryAccountNumber
      );

      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          beneficiaryName: result.beneficiary.name,
        }));
        setBeneficiaryVerified(true);
        setError('');
      } else {
        setError(result.message || 'Failed to verify beneficiary');
        setBeneficiaryVerified(false);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setBeneficiaryVerified(false);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED AMOUNT VALIDATION - ALLOW ANY AMOUNT IN RANGE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.beneficiaryAccountNumber || !formData.amount) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    if (!beneficiaryVerified) {
      setError('Please verify beneficiary first');
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.amount);

    // ✅ FIXED VALIDATION - ACCEPT ANY AMOUNT BETWEEN 1 AND 50000
    if (isNaN(amount) || amount <= 0 || amount > 50000) {
      setError('Amount must be between ₹1 and ₹50,000');
      setLoading(false);
      return;
    }

    if (currentBalance && amount > currentBalance) {
      setError(`Insufficient balance. Available: ₹${currentBalance.toLocaleString('en-IN')}`);
      setLoading(false);
      return;
    }

    try {
      const result = await quickTransferAPI.createTransfer({
        beneficiaryName: formData.beneficiaryName,
        beneficiaryAccountNumber: formData.beneficiaryAccountNumber,
        amount,
        transferType: formData.transferType,
        purpose: formData.purpose,
      });

      if (result.success) {
        // ✅ UPDATE BALANCE IN CONTEXT
        const newBalance = currentBalance - amount;
        updateBalance(newBalance);
        setCurrentBalance(newBalance);

        // ✅ SHOW SUCCESS MODAL INSTEAD OF ALERT
        setSuccess(
          `✅ Quick Transfer Successful!\n\n` +
          `📤 Sent to: ${formData.beneficiaryName}\n` +
          `💰 Amount: ₹${amount.toLocaleString('en-IN')}\n` +
          `📋 Ref ID: ${result.transfer.transactionId}\n\n` +
          `✓ New Balance: ₹${newBalance.toLocaleString('en-IN')}`
        );
        setShowSuccessModal(true);

        // Reset form
        setFormData({
          beneficiaryName: '',
          beneficiaryAccountNumber: '',
          amount: '',
          transferType: 'other',
          purpose: '',
        });
        setBeneficiaryVerified(false);

        // Redirect after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/transfer');
        }, 3000);
      } else {
        setError(result.message || 'Transfer failed');
      }
    } catch (err) {
      setError('Transfer failed. Please try again.');
      console.error('Transfer error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ DISPLAY BENEFICIARIES (FIRST 2) WITH "MORE" BUTTON
  const displayBeneficiaries = showAllBeneficiaries ? savedBeneficiaries : savedBeneficiaries.slice(0, 2);
  const hasMoreBeneficiaries = savedBeneficiaries.length > 2;

  return (
    <div className="transfer-container">
      <div className="transfer-box">
        <h2>⚡ Quick Transfer (Up to ₹50,000)</h2>

        {error && <div className="error-message">⚠️ {error}</div>}
        {success && <div className="success-message">✅ {success}</div>}

        {/* ✅ BALANCE FROM CONTEXT */}
        {currentBalance !== null && (
          <div className="balance-info">
            <p>Available Balance: <strong>₹{currentBalance.toLocaleString('en-IN')}</strong></p>
          </div>
        )}

        {/* ✅ SAVED BENEFICIARIES WITH MORE BUTTON */}
        {savedBeneficiaries.length > 0 && (
          <div className="saved-beneficiaries">
            <h4>💾 Saved Beneficiaries</h4>
            <div className="beneficiaries-list">
              {displayBeneficiaries.map((benef) => (
                <button
                  key={benef._id}
                  className="beneficiary-chip"
                  onClick={() => handleSelectBeneficiary(benef)}
                  title={benef.beneficiaryName}
                >
                  {benef.beneficiaryName}
                </button>
              ))}
            </div>
            
            {/* ✅ SHOW MORE BUTTON IF MORE BENEFICIARIES EXIST */}
            {hasMoreBeneficiaries && (
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="more-btn"
                  onClick={() => setShowAllBeneficiaries(!showAllBeneficiaries)}
                >
                  {showAllBeneficiaries ? '▲ Show Less' : `+ ${savedBeneficiaries.length - 2} More`}
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="transfer-form">
          {/* Transfer Type */}
          <div className="form-group">
            <label>Transfer Type</label>
            <select
              name="transferType"
              value={formData.transferType}
              onChange={handleChange}
            >
              <option value="own">Own Account</option>
              <option value="other">Other Account</option>
            </select>
          </div>

          {/* Account Number */}
          <div className="form-group">
            <label>Recipient Account Number *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                name="beneficiaryAccountNumber"
                value={formData.beneficiaryAccountNumber}
                onChange={handleChange}
                placeholder="e.g., FIN123456"
                disabled={beneficiaryVerified}
              />
              {!beneficiaryVerified && (
                <button
                  type="button"
                  className="verify-btn"
                  onClick={handleVerifyBeneficiary}
                  disabled={loading}
                >
                  {loading ? '⏳' : 'Verify'}
                </button>
              )}
            </div>
          </div>

          {beneficiaryVerified && (
            <div className="verified-badge">
              ✅ {formData.beneficiaryName}
            </div>
          )}

          {/* Amount - ✅ FIXED VALIDATION */}
          <div className="form-group">
            <label>Amount (₹) * (Max: ₹50,000)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="5000"
              min="1"
              max="50000"
              step="1"
            />
            {formData.amount && (
              <small style={{ color: '#667eea', marginTop: '4px' }}>
                ✓ Amount: ₹{parseFloat(formData.amount).toLocaleString('en-IN')}
              </small>
            )}
          </div>

          {/* Purpose */}
          <div className="form-group">
            <label>Purpose (Optional)</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Reason for transfer"
              rows="2"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="transfer-btn"
            disabled={loading || !beneficiaryVerified}
          >
            {loading ? '⏳ Processing...' : '⚡ Transfer Now'}
          </button>
        </form>

        {/* Info Box */}
        <div className="info-box">
          <h4>ℹ️ Quick Transfer Benefits</h4>
          <ul>
            <li>✓ Instant transfer up to ₹50,000</li>
            <li>✓ Save frequently used beneficiaries</li>
            <li>✓ No charges or hidden fees</li>
            <li>✓ 24/7 availability</li>
          </ul>
        </div>
      </div>

      {/* ✅ SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Transfer Successful!</h2>
              <button className="close-btn" onClick={() => setShowSuccessModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎉</div>
                <p style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#333', fontSize: '15px' }}>
                  {success}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-primary" 
                onClick={() => setShowSuccessModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ALL BENEFICIARIES MODAL */}
      {showAllBeneficiaries && savedBeneficiaries.length > 2 && (
        <div className="modal-overlay" onClick={() => setShowAllBeneficiaries(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💾 All Beneficiaries ({savedBeneficiaries.length})</h2>
              <button className="close-btn" onClick={() => setShowAllBeneficiaries(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <div className="beneficiaries-grid">
                {savedBeneficiaries.map((benef) => (
                  <button
                    key={benef._id}
                    className="beneficiary-card"
                    onClick={() => handleSelectBeneficiary(benef)}
                  >
                    <div className="beneficiary-name">{benef.beneficiaryName}</div>
                    <div className="beneficiary-account">{benef.beneficiaryAccountNumber}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowAllBeneficiaries(false)}
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