// frontend/src/pages/Insurance.jsx - FIXED WITH MODAL POLICY VIEWER
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { insuranceAPI } from '../services/api';
import '../styles/applyloan.css';

export default function Insurance() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('my-policies'); // 'my-policies', 'buy'
  const [policies, setPolicies] = useState([]);
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedType, setSelectedType] = useState('life');
  const [selectedPlan, setSelectedPlan] = useState(null);

  // ✅ NEW: Modal state for policy viewer
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const [buyFormData, setBuyFormData] = useState({
    insuranceType: 'life',
    policyName: '',
    coverAmount: '',
    monthlyPremium: '',
    policyTerm: 5,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    vehicleRegistration: '',
    vehicleType: '',
    familyMembers: [],
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load my policies
        const policiesResult = await insuranceAPI.getMyPolicies();
        if (policiesResult.success) {
          setPolicies(policiesResult.policies);
        }

        // Load available plans
        const plansResult = await insuranceAPI.getPlans();
        if (plansResult.success) {
          setPlans(plansResult.plans);
        }
      } catch (err) {
        setError('Failed to load insurance data');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    }
  }, [token]);

  const handleBuyFormChange = (e) => {
    const { name, value } = e.target;
    setBuyFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setBuyFormData((prev) => ({
      ...prev,
      policyName: plan.name,
      monthlyPremium: plan.minPremium,
      coverAmount: plan.minCover,
    }));
  };

  const handleBuyPolicy = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await insuranceAPI.buyPolicy(buyFormData);

      if (result.success) {
        alert(`✅ Policy purchased!\nPolicy Number: ${result.policy.policyNumber}`);
        
        // Reload policies
        const policiesResult = await insuranceAPI.getMyPolicies();
        if (policiesResult.success) {
          setPolicies(policiesResult.policies);
        }

        setActiveTab('my-policies');
        setBuyFormData({
          insuranceType: 'life',
          policyName: '',
          coverAmount: '',
          monthlyPremium: '',
          policyTerm: 5,
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: '',
          email: '',
          phone: '',
          vehicleRegistration: '',
          vehicleType: '',
          familyMembers: [],
        });
        setSelectedPlan(null);
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert('Failed to purchase policy');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPremium = async (policyNumber) => {
    if (window.confirm('Pay premium for this policy?')) {
      try {
        const result = await insuranceAPI.payPremium(policyNumber);

        if (result.success) {
          alert('✅ Premium paid successfully');
          
          // Reload policies
          const policiesResult = await insuranceAPI.getMyPolicies();
          if (policiesResult.success) {
            setPolicies(policiesResult.policies);
          }
        } else {
          alert(result.message);
        }
      } catch (err) {
        alert('Failed to pay premium');
      }
    }
  };

  // ✅ NEW: Handle view policy - open modal instead of navigate
  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
    setShowPolicyModal(true);
  };

  // ✅ NEW: State for deactivate action choice
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateAction, setDeactivateAction] = useState('deactivate'); // 'deactivate' or 'remove'

  // ✅ NEW: Handle deactivate policy - show options
  const handleDeactivatePolicy = (policy) => {
    setSelectedPolicy(policy);
    setShowDeactivateModal(true);
    setDeactivateAction('deactivate'); // Reset to default
  };

  // ✅ NEW: Confirm deactivate action
  const confirmDeactivateAction = async () => {
    if (!selectedPolicy) return;

    setLoading(true);

    try {
      if (deactivateAction === 'deactivate') {
        // ✅ DEACTIVATE ONLY - Keep in list but mark as inactive
        const updatedPolicies = policies.map((policy) =>
          policy.policyNumber === selectedPolicy.policyNumber
            ? { ...policy, status: 'inactive' }
            : policy
        );
        setPolicies(updatedPolicies);

        const updatedPolicy = updatedPolicies.find(
          (p) => p.policyNumber === selectedPolicy.policyNumber
        );
        setSelectedPolicy(updatedPolicy);

        alert(`✅ Policy Deactivated Successfully!\n\nPolicy: ${selectedPolicy.policyName}\nStatus: Inactive`);
      } else if (deactivateAction === 'remove') {
        // ✅ DEACTIVATE & REMOVE - Remove from list permanently
        const updatedPolicies = policies.filter(
          (policy) => policy.policyNumber !== selectedPolicy.policyNumber
        );
        setPolicies(updatedPolicies);

        alert(`✅ Policy Deactivated & Removed!\n\nPolicy: ${selectedPolicy.policyName}\n\nThe policy has been removed from your list permanently.`);
      }

      setShowDeactivateModal(false);
      setSelectedPolicy(null);
    } catch (err) {
      alert('❌ Failed to deactivate policy');
      console.error('Error deactivating policy:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">⏳ Loading...</div>;
  }

  return (
    <div className="loan-container">
      <h2>🛡️ Insurance</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Tab Buttons */}
      <div className="tab-buttons" style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <button
          className={`tab-btn ${activeTab === 'my-policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-policies')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid #EFEFEF',
            background: activeTab === 'my-policies' ? '#FF6B6B' : 'white',
            color: activeTab === 'my-policies' ? 'white' : '#222222',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          📋 My Policies
        </button>
        <button
          className={`tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid #EFEFEF',
            background: activeTab === 'buy' ? '#FF6B6B' : 'white',
            color: activeTab === 'buy' ? 'white' : '#222222',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          🛒 Buy Insurance
        </button>
      </div>

      {/* My Policies Tab */}
      {activeTab === 'my-policies' && (
        <div className="loan-content">
          {policies.length === 0 ? (
            <div className="empty-state">
              <p>No active policies</p>
              <button
                className="empty-state-button"
                onClick={() => setActiveTab('buy')}
              >
                Buy Insurance
              </button>
            </div>
          ) : (
            <div className="loans-grid">
              {policies.map((policy) => (
                <div key={policy.policyNumber} className="loan-card">
                  <div className="loan-header">
                    <h3>{policy.insuranceType.toUpperCase()}</h3>
                    <span 
                      className="status-badge"
                      style={{
                        backgroundColor: policy.status === 'active' ? '#1FB981' : '#F59E0B',
                      }}
                    >
                      {policy.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="loan-details">
                    <div className="detail-row">
                      <span className="label">Policy Number:</span>
                      <span className="value">{policy.policyNumber}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Policy Name:</span>
                      <span className="value">{policy.policyName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Coverage:</span>
                      <span className="value amount">₹{policy.coverAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Monthly Premium:</span>
                      <span className="value amount">₹{policy.monthlyPremium.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Next Due:</span>
                      <span className="value">{new Date(policy.nextPremiumDueDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Maturity:</span>
                      <span className="value">{new Date(policy.maturityDate).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="loan-item-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn-primary"
                        onClick={() => handlePayPremium(policy.policyNumber)}
                        style={{ flex: 1 }}
                      >
                        💳 Pay Premium
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => handleViewPolicy(policy)}
                        style={{ flex: 1 }}
                      >
                        👁️ View
                      </button>
                    </div>
                    <button 
                      className="btn-danger"
                      onClick={() => handleDeactivatePolicy(policy)}
                      disabled={policy.status === 'inactive'}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: policy.status === 'inactive' ? '#BDBDBD' : '#FF6B6B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: policy.status === 'inactive' ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        opacity: policy.status === 'inactive' ? 0.6 : 1,
                      }}
                      title={policy.status === 'inactive' ? 'Policy is already inactive' : 'Deactivate this policy'}
                    >
                      🚫 Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buy Insurance Tab */}
      {activeTab === 'buy' && (
        <div className="loan-content">
          {/* Insurance Type Selection */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
              Select Insurance Type
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {['life', 'health', 'accident', 'motor'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setBuyFormData((prev) => ({ ...prev, insuranceType: type }));
                    setSelectedPlan(null);
                  }}
                  style={{
                    padding: '12px',
                    border: `2px solid ${selectedType === type ? '#FF6B6B' : '#EFEFEF'}`,
                    background: selectedType === type ? '#FFF5F5' : 'white',
                    color: selectedType === type ? '#FF6B6B' : '#222222',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}
                >
                  {type === 'life' && '🧬 Life'}
                  {type === 'health' && '⚕️ Health'}
                  {type === 'accident' && '🚨 Accident'}
                  {type === 'motor' && '🏍️ Motor'}
                </button>
              ))}
            </div>
          </div>

          {/* Available Plans */}
          {plans[selectedType] && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                Available Plans
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {plans[selectedType].map((plan) => (
                  <div
                    key={plan.name}
                    onClick={() => handleSelectPlan(plan)}
                    style={{
                      padding: '16px',
                      border: `2px solid ${selectedPlan?.name === plan.name ? '#FF6B6B' : '#EFEFEF'}`,
                      background: selectedPlan?.name === plan.name ? '#FFF5F5' : 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <h4 style={{ marginBottom: '8px', color: '#222222' }}>{plan.name}</h4>
                    <p style={{ fontSize: '13px', color: '#717171', marginBottom: '8px' }}>
                      {plan.description}
                    </p>
                    <p style={{ fontSize: '12px', color: '#BDBDBD' }}>
                      Coverage: ₹{plan.minCover.toLocaleString('en-IN')} - ₹{plan.maxCover.toLocaleString('en-IN')}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#FF6B6B', marginTop: '8px' }}>
                      From ₹{plan.minPremium}/month
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buy Form */}
          {selectedPlan && (
            <form onSubmit={handleBuyPolicy} style={{ background: '#FAFAFA', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                Policy Details
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={buyFormData.firstName}
                    onChange={handleBuyFormChange}
                    placeholder="John"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={buyFormData.lastName}
                    onChange={handleBuyFormChange}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={buyFormData.dateOfBirth}
                    onChange={handleBuyFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={buyFormData.gender}
                    onChange={handleBuyFormChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={buyFormData.email}
                    onChange={handleBuyFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={buyFormData.phone}
                    onChange={handleBuyFormChange}
                    placeholder="9876543210"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Coverage Amount (₹) *</label>
                  <input
                    type="number"
                    name="coverAmount"
                    value={buyFormData.coverAmount}
                    onChange={handleBuyFormChange}
                    min={selectedPlan.minCover}
                    max={selectedPlan.maxCover}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Policy Term (Years) *</label>
                  <select
                    name="policyTerm"
                    value={buyFormData.policyTerm}
                    onChange={handleBuyFormChange}
                    required
                  >
                    <option value="5">5 Years</option>
                    <option value="10">10 Years</option>
                    <option value="15">15 Years</option>
                    <option value="20">20 Years</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="apply-btn" disabled={loading}>
                {loading ? '⏳ Processing...' : '🛒 Buy Policy'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ==================== POLICY DETAILS MODAL ==================== */}
      {showPolicyModal && selectedPolicy && (
        <div 
          className="modal-overlay"
          onClick={() => setShowPolicyModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              borderBottom: '1px solid #EFEFEF',
              paddingBottom: '16px',
            }}>
              <h2 style={{ margin: 0, color: '#222222', fontSize: '24px' }}>
                📋 Policy Details
              </h2>
              <button 
                onClick={() => setShowPolicyModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#717171',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ marginBottom: '24px' }}>
              {/* Status Badge */}
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: '0', fontSize: '18px' }}>
                  {selectedPolicy.insuranceType.toUpperCase()}
                </h3>
                <span 
                  style={{
                    backgroundColor: selectedPolicy.status === 'active' ? '#1FB981' : '#F59E0B',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  {selectedPolicy.status.toUpperCase()}
                </span>
              </div>

              {/* Policy Information Section */}
              <div style={{
                background: '#FAFAFA',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#222222', fontSize: '14px', fontWeight: '600' }}>
                  Policy Information
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#717171', fontSize: '14px' }}>Policy Number:</span>
                    <span style={{ color: '#222222', fontWeight: '600' }}>{selectedPolicy.policyNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#717171', fontSize: '14px' }}>Policy Name:</span>
                    <span style={{ color: '#222222', fontWeight: '600' }}>{selectedPolicy.policyName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#717171', fontSize: '14px' }}>Insurance Type:</span>
                    <span style={{ color: '#222222', fontWeight: '600', textTransform: 'capitalize' }}>
                      {selectedPolicy.insuranceType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coverage & Premium Section */}
              <div style={{
                background: '#FAFAFA',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#222222', fontSize: '14px', fontWeight: '600' }}>
                  Coverage & Premium
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#717171', fontSize: '14px' }}>Coverage Amount:</span>
                    <span style={{ color: '#222222', fontWeight: '600', fontSize: '16px' }}>
                      ₹{selectedPolicy.coverAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#717171', fontSize: '14px' }}>Monthly Premium:</span>
                    <span style={{ color: '#222222', fontWeight: '600', fontSize: '16px' }}>
                      ₹{selectedPolicy.monthlyPremium.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#717171', fontSize: '14px' }}>Annual Premium:</span>
                    <span style={{ color: '#222222', fontWeight: '600', fontSize: '16px' }}>
                      ₹{(selectedPolicy.monthlyPremium * 12).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Important Dates Section */}
              <div style={{
                background: '#FAFAFA',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#222222', fontSize: '14px', fontWeight: '600' }}>
                  Important Dates
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#717171', fontSize: '14px' }}>Policy Start Date:</span>
                    <span style={{ color: '#222222', fontWeight: '600' }}>
                      {selectedPolicy.startDate ? new Date(selectedPolicy.startDate).toLocaleDateString('en-IN') : 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#717171', fontSize: '14px' }}>Maturity Date:</span>
                    <span style={{ color: '#222222', fontWeight: '600' }}>
                      {new Date(selectedPolicy.maturityDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#717171', fontSize: '14px' }}>Next Premium Due:</span>
                    <span style={{ color: '#222222', fontWeight: '600' }}>
                      {new Date(selectedPolicy.nextPremiumDueDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div style={{
                background: '#FFF5F5',
                border: '1px solid #FFE0E0',
                padding: '16px',
                borderRadius: '8px',
              }}>
                <p style={{ margin: '0', color: '#222222', fontSize: '13px' }}>
                  ℹ️ <strong>For claims or policy modifications,</strong> please contact our customer support team.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              borderTop: '1px solid #EFEFEF',
              paddingTop: '16px',
            }}>
              <button 
                onClick={() => handlePayPremium(selectedPolicy.policyNumber)}
                style={{
                  padding: '10px 20px',
                  background: '#FF6B6B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                💳 Pay Premium
              </button>
              <button 
                onClick={() => setShowPolicyModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#EFEFEF',
                  color: '#222222',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==================== DEACTIVATE OPTIONS MODAL ==================== */}
      {showDeactivateModal && selectedPolicy && (
        <div 
          className="modal-overlay"
          onClick={() => setShowDeactivateModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              borderBottom: '1px solid #EFEFEF',
              paddingBottom: '16px',
            }}>
              <h2 style={{ margin: 0, color: '#222222', fontSize: '24px' }}>
                🚨 Deactivate Policy
              </h2>
              <button 
                onClick={() => setShowDeactivateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#717171',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ 
                marginBottom: '20px', 
                fontSize: '14px', 
                color: '#717171',
                textAlign: 'center'
              }}>
                What would you like to do with <strong>{selectedPolicy.policyName}</strong>?
              </p>

              {/* OPTION 1: DEACTIVATE ONLY */}
              <div 
                style={{
                  border: deactivateAction === 'deactivate' ? '2px solid #667eea' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  background: deactivateAction === 'deactivate' ? '#f0f4ff' : '#ffffff',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setDeactivateAction('deactivate')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="radio" 
                    name="deactivateAction" 
                    value="deactivate" 
                    checked={deactivateAction === 'deactivate'}
                    onChange={() => setDeactivateAction('deactivate')}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#1a1a1a', fontWeight: '600' }}>
                      🚫 Deactivate Policy
                    </h4>
                    <p style={{ margin: '0', color: '#717171', fontSize: '13px' }}>
                      Policy will be marked as inactive but still visible in your list. You can view it anytime, but you won't be able to use it or pay premiums.
                    </p>
                  </div>
                </div>
              </div>

              {/* OPTION 2: DEACTIVATE & REMOVE */}
              <div 
                style={{
                  border: deactivateAction === 'remove' ? '2px solid #ef4444' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                  cursor: 'pointer',
                  background: deactivateAction === 'remove' ? '#fee' : '#ffffff',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setDeactivateAction('remove')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="radio" 
                    name="deactivateAction" 
                    value="remove" 
                    checked={deactivateAction === 'remove'}
                    onChange={() => setDeactivateAction('remove')}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#1a1a1a', fontWeight: '600' }}>
                      🗑️ Deactivate & Remove Permanently
                    </h4>
                    <p style={{ margin: '0', color: '#717171', fontSize: '13px' }}>
                      Policy will be deactivated and removed from your list permanently. You won't be able to see it or recover it later.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                background: '#FFF3E0',
                border: '1px solid #FFE0B2',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '13px',
                color: '#E65100',
              }}>
                ⚠️ <strong>Important:</strong> Once deactivated, you won't be able to use this policy for transactions. This action cannot be undone.
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              borderTop: '1px solid #EFEFEF',
              paddingTop: '16px',
            }}>
              <button 
                onClick={confirmDeactivateAction}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: deactivateAction === 'remove' ? '#ef4444' : '#FF6B6B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '⏳ Processing...' : (deactivateAction === 'remove' ? '🗑️ Deactivate & Remove' : '🚫 Deactivate')}
              </button>
              <button 
                onClick={() => setShowDeactivateModal(false)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#EFEFEF',
                  color: '#222222',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}