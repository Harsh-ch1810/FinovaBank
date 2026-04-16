// src/pages/MobileRecharge.jsx 
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountAPI } from '../services/api';
import '../styles/mobileRecharge.css';

export default function MobileRecharge() {
  const { token, account, updateBalance } = useAuth(); // ✅ GET updateBalance FROM CONTEXT

  const [localAccount, setLocalAccount] = useState(account);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('prepaid');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ INITIALIZE RECHARGE HISTORY FROM LOCALSTORAGE
  const [rechargeHistory, setRechargeHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('finova_recharge_history');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (err) {
      console.error('Error loading recharge history:', err);
      return [];
    }
  });

  // ✅ SAVE RECHARGE HISTORY TO LOCALSTORAGE WHENEVER IT CHANGES
  useEffect(() => {
    try {
      localStorage.setItem('finova_recharge_history', JSON.stringify(rechargeHistory));
    } catch (err) {
      console.error('Error saving recharge history:', err);
    }
  }, [rechargeHistory]);

  // ✅ SYNC LOCAL ACCOUNT WITH CONTEXT ACCOUNT
  useEffect(() => {
    if (account) {
      setLocalAccount(account);
    }
  }, [account]);

  // ✅ EXPANDED OPERATORS LIST
  const operators = [
    { name: 'Jio', logo: '🟡', color: '#FFD700' },
    { name: 'Airtel', logo: '🔴', color: '#E60000' },
    { name: 'Vodafone', logo: '🔴', color: '#E71C23' },
    { name: 'BSNL', logo: '🟠', color: '#FF6600' },
    { name: 'Idea', logo: '🟢', color: '#00B050' },
    { name: 'MTNL', logo: '🔵', color: '#0066CC' },
    { name: 'Reliance', logo: '🟤', color: '#8B4513' },
    { name: 'Telenor', logo: '💜', color: '#9933FF' },
  ];

  const prepaidPlans = {
    Jio: [
      { id: 1, amount: 99, validity: 7, data: '1GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 2, amount: 199, validity: 14, data: '3GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 3, amount: 299, validity: 28, data: '10GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 4, amount: 499, validity: 56, data: '25GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 5, amount: 799, validity: 84, data: '50GB', calls: 'Unlimited', sms: 'Unlimited' },
    ],
    Airtel: [
      { id: 1, amount: 99, validity: 7, data: '0.75GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 2, amount: 199, validity: 14, data: '2GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 3, amount: 299, validity: 28, data: '8GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 4, amount: 449, validity: 56, data: '20GB', calls: 'Unlimited', sms: 'Unlimited' },
    ],
    Vodafone: [
      { id: 1, amount: 89, validity: 7, data: '0.5GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 2, amount: 179, validity: 14, data: '1.5GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 3, amount: 279, validity: 28, data: '7GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 4, amount: 429, validity: 56, data: '18GB', calls: 'Unlimited', sms: 'Unlimited' },
    ],
    BSNL: [
      { id: 1, amount: 79, validity: 7, data: '1GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 2, amount: 149, validity: 14, data: '2GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 3, amount: 249, validity: 28, data: '5GB', calls: 'Unlimited', sms: 'Unlimited' },
    ],
    Idea: [
      { id: 1, amount: 89, validity: 7, data: '0.6GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 2, amount: 189, validity: 14, data: '1.8GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 3, amount: 289, validity: 28, data: '6GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 4, amount: 419, validity: 56, data: '16GB', calls: 'Unlimited', sms: 'Unlimited' },
    ],
    MTNL: [
      { id: 1, amount: 75, validity: 7, data: '0.8GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 2, amount: 149, validity: 14, data: '1.5GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 3, amount: 239, validity: 28, data: '4GB', calls: 'Unlimited', sms: 'Unlimited' },
    ],
    Reliance: [
      { id: 1, amount: 99, validity: 7, data: '1.5GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 2, amount: 199, validity: 14, data: '3.5GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 3, amount: 349, validity: 28, data: '10GB', calls: 'Unlimited', sms: 'Unlimited' },
    ],
    Telenor: [
      { id: 1, amount: 79, validity: 7, data: '0.5GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 2, amount: 159, validity: 14, data: '1.2GB', calls: 'Unlimited', sms: 'Unlimited' },
      { id: 3, amount: 259, validity: 28, data: '5GB', calls: 'Unlimited', sms: 'Unlimited' },
    ],
  };

  // ✅ FETCH REAL ACCOUNT BALANCE ON MOUNT
  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        setLoading(true);
        const result = await accountAPI.getInfo();
        if (result.success) {
          setLocalAccount(result.account);
        }
      } catch (err) {
        console.error('Error fetching account:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAccountInfo();
    }
  }, [token]);

  const getPlansForOperator = () => {
    return selectedOperator && prepaidPlans[selectedOperator] 
      ? prepaidPlans[selectedOperator] 
      : [];
  };

  const handleProceedRecharge = () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      alert('❌ Please enter valid 10-digit mobile number');
      return;
    }

    if (!selectedOperator) {
      alert('❌ Please select an operator');
      return;
    }

    if (!selectedPlan) {
      alert('❌ Please select a plan');
      return;
    }

    if (localAccount && selectedPlan.amount > localAccount.balance) {
      alert('❌ Insufficient balance in your account');
      return;
    }

    setShowConfirm(true);
  };

  // ✅ FIXED: UPDATE BOTH LOCAL STATE AND CONTEXT
  const handleConfirmRecharge = () => {
    setShowConfirm(false);

    if (!localAccount) return;

    // ✅ CALCULATE NEW BALANCE
    const newBalance = localAccount.balance - selectedPlan.amount;
    const updatedAccount = {
      ...localAccount,
      balance: newBalance,
    };

    // ✅ UPDATE LOCAL STATE
    setLocalAccount(updatedAccount);

    // ✅ UPDATE CONTEXT (THIS SYNCS TO DASHBOARD)
    console.log('🔄 Updating balance in context:', newBalance);
    updateBalance(newBalance);

    // ✅ ADD TO RECHARGE HISTORY WITH PERSISTENCE
    const newRecharge = {
      id: rechargeHistory.length + 1,
      number: mobileNumber,
      operator: selectedOperator,
      amount: selectedPlan.amount,
      plan: `${selectedPlan.data} data`,
      date: new Date().toISOString(),
      status: 'Success',
    };

    setRechargeHistory([newRecharge, ...rechargeHistory]);

    // ✅ SHOW SUCCESS MESSAGE
    setSuccessMessage(
      `✅ Recharge Successful!\n\n📱 Mobile: ${mobileNumber}\n📡 Operator: ${selectedOperator}\n📊 Plan: ${selectedPlan.data} (${selectedPlan.validity} days)\n💰 Amount Deducted: ₹${selectedPlan.amount}\n\n✓ New Balance: ₹${newBalance.toLocaleString('en-IN')}`
    );
    setShowSuccessModal(true);

    // ✅ RESET FORM
    setMobileNumber('');
    setSelectedOperator('');
    setSelectedPlan(null);

    setTimeout(() => {
      setShowSuccessModal(false);
    }, 4000);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Loading...</div>;
  }

  return (
    <div className="mobile-recharge-container">
      <div className="recharge-header">
        <h1>📱 Mobile Recharge & Bill Payment</h1>
        <p className="available-balance">Available Balance: ₹{localAccount ? localAccount.balance.toLocaleString('en-IN') : 'Loading...'}</p>
      </div>

      {/* Tabs */}
      <div className="recharge-tabs">
        <button 
          className={`tab-btn ${activeTab === 'prepaid' ? 'active' : ''}`}
          onClick={() => setActiveTab('prepaid')}
        >
          Prepaid Recharge
        </button>
        <button 
          className={`tab-btn ${activeTab === 'postpaid' ? 'active' : ''}`}
          onClick={() => setActiveTab('postpaid')}
        >
          Postpaid Bill Payment
        </button>
      </div>

      {/* Prepaid Recharge Section */}
      {activeTab === 'prepaid' && (
        <div className="recharge-section">
          {/* Mobile Number Input */}
          <div className="recharge-form">
            <div className="form-section">
              <h3>Enter Details</h3>
              
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.slice(0, 10))}
                  maxLength="10"
                />
              </div>

              {/* Operator Selection - ✅ WITH MORE OPERATORS */}
              <div className="form-group">
                <label>Select Operator</label>
                <div className="operator-buttons">
                  {operators.map((op) => (
                    <button
                      key={op.name}
                      className={`operator-btn ${selectedOperator === op.name ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedOperator(op.name);
                        setSelectedPlan(null); // Reset plan when changing operator
                      }}
                      style={{ 
                        borderColor: selectedOperator === op.name ? op.color : '#EFEFEF',
                        color: selectedOperator === op.name ? op.color : '#717171'
                      }}
                      title={op.name}
                    >
                      <span className="operator-logo">{op.logo}</span>
                      <span>{op.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Plans Display */}
            {selectedOperator && (
              <div className="plans-section">
                <h3>Available Plans for {selectedOperator}</h3>
                <div className="plans-grid">
                  {getPlansForOperator().map((plan) => (
                    <div
                      key={plan.id}
                      className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="plan-amount">₹{plan.amount}</div>
                      <div className="plan-validity">{plan.validity} days</div>
                      <div className="plan-details">
                        <p>📊 {plan.data}</p>
                        <p>☎️ {plan.calls}</p>
                        <p>💬 {plan.sms}</p>
                      </div>
                      {selectedPlan?.id === plan.id && <div className="checkmark">✓</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recharge Button */}
            <button 
              className="btn-recharge"
              onClick={handleProceedRecharge}
              disabled={!mobileNumber || !selectedOperator || !selectedPlan}
            >
              {selectedPlan ? `Recharge ₹${selectedPlan.amount}` : 'Select a Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Postpaid Bill Payment Section */}
      {activeTab === 'postpaid' && (
        <div className="recharge-section">
          <div className="bill-payment-form">
            <h3>Postpaid Bill Payment</h3>
            
            <div className="form-group">
              <label>Mobile Number</label>
              <input 
                type="tel" 
                placeholder="Enter mobile number"
                maxLength="10"
              />
            </div>

            <div className="form-group">
              <label>Select Operator</label>
              <select>
                <option>Jio</option>
                <option>Airtel</option>
                <option>Vodafone</option>
                <option>BSNL</option>
                <option>Idea</option>
                <option>MTNL</option>
                <option>Reliance</option>
                <option>Telenor</option>
              </select>
            </div>

            <div className="bill-info">
              <p>📄 Outstanding Bill: <strong>₹1,299</strong></p>
              <p>📅 Due Date: 25th March 2026</p>
            </div>

            <button className="btn-pay-bill">Pay Bill Now</button>
          </div>
        </div>
      )}

      {/* ✅ Recharge History - NOW WITH PERSISTENCE */}
      <div className="recharge-history">
        <h2>📋 Recharge History</h2>
        <div className="history-list">
          {rechargeHistory.length === 0 ? (
            <p className="no-history">No recharge history yet</p>
          ) : (
            rechargeHistory.map((charge) => (
              <div key={charge.id} className="history-item">
                <div className="history-icon">📱</div>
                <div className="history-details">
                  <div>
                    <h4>{charge.number}</h4>
                    <p>{charge.operator} - {charge.plan}</p>
                  </div>
                  <div className="history-amount">
                    <p className="amount">₹{charge.amount}</p>
                    <p className="date">
                      {new Date(charge.date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className={`history-status ${charge.status.toLowerCase()}`}>
                    {charge.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="recharge-benefits">
        <h2>✨ Recharge Benefits</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <span className="benefit-icon">⚡</span>
            <h4>Instant Recharge</h4>
            <p>Get your recharge activated within seconds</p>
          </div>

          <div className="benefit-card">
            <span className="benefit-icon">💰</span>
            <h4>Cashback & Offers</h4>
            <p>Enjoy exclusive cashback on every recharge</p>
          </div>

          <div className="benefit-card">
            <span className="benefit-icon">🔒</span>
            <h4>Safe & Secure</h4>
            <p>256-bit encryption for secure transactions</p>
          </div>

          <div className="benefit-card">
            <span className="benefit-icon">🎯</span>
            <h4>Scheduled Recharge</h4>
            <p>Set up auto-recharge for peace of mind</p>
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* ✅ Confirmation Modal - NO OTP */}
      {showConfirm && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Confirm Recharge</h2>
              <button className="close-btn" onClick={() => setShowConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="confirm-section">
                <p><strong>📱 Mobile Number:</strong> {mobileNumber}</p>
                <p><strong>📡 Operator:</strong> {selectedOperator}</p>
                <p><strong>📊 Data:</strong> {selectedPlan.data}</p>
                <p><strong>📅 Validity:</strong> {selectedPlan.validity} days</p>
                <p className="amount-line"><strong>💰 Amount:</strong> ₹{selectedPlan.amount}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleConfirmRecharge}>Confirm & Recharge</button>
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ SUCCESS MODAL - DIRECT MESSAGE */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Recharge Successful!</h2>
              <button className="close-btn" onClick={() => setShowSuccessModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎉</div>
                <p style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#333', fontSize: '15px' }}>
                  {successMessage}
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
    </div>
  );
}