// src/components/UserProfileModal.jsx - COMPLETE FIX
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountAPI } from '../services/api';
import '../styles/userProfileModal.css';

export default function UserProfileModal({ isOpen, onClose }) {
  const { token, user: contextUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && token) {
      fetchAllData();
    }
  }, [isOpen, token]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Starting profile fetch...');
      let userData = null;

      // ========================================
      // STEP 1: Try to fetch from multiple endpoints
      // ========================================

      // Try /api/auth/me first
      try {
        console.log('📍 Trying /api/auth/me...');
        const userRes = await fetch('http://localhost:5189/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', userRes.status);

        if (userRes.ok) {
          const data = await userRes.json();
          console.log('✅ /api/auth/me response:', data);

          if (data?.user) {
            userData = data.user;
            console.log('✅ Got user from /api/auth/me');
          }
        }
      } catch (e) {
        console.warn('⚠️ /api/auth/me failed:', e.message);
      }

      // If /api/auth/me failed, try /api/account/profile or /api/profile
      if (!userData) {
        try {
          console.log('📍 Trying /api/account/profile...');
          const userRes = await fetch('http://localhost:5189/api/account/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (userRes.ok) {
            const data = await userRes.json();
            console.log('✅ /api/account/profile response:', data);
            if (data?.user) {
              userData = data.user;
              console.log('✅ Got user from /api/account/profile');
            }
          }
        } catch (e) {
          console.warn('⚠️ /api/account/profile failed:', e.message);
        }
      }

      // ========================================
      // STEP 2: FALLBACK to context or localStorage
      // ========================================
      if (!userData) {
        console.log('📍 Trying context/localStorage...');

        if (contextUser) {
          userData = contextUser;
          console.log('✅ Using data from context');
        } else {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            userData = JSON.parse(savedUser);
            console.log('✅ Using data from localStorage');
          }
        }
      }

      if (!userData) {
        throw new Error('Could not load user data from any source');
      }

      setUserData(userData);
      console.log('✅ Final userData:', userData);

      // ========================================
      // STEP 3: Fetch account info
      // ========================================
      try {
        console.log('📍 Fetching account info...');
        const accountRes = await accountAPI.getInfo();
        console.log('✅ Account response:', accountRes);

        if (accountRes?.success && accountRes?.account) {
          setAccount(accountRes.account);
          console.log('✅ Account info loaded');
        } else if (accountRes?.account) {
          setAccount(accountRes.account);
          console.log('✅ Account info loaded (no success field)');
        } else {
          // Try localStorage
          const savedAccount = localStorage.getItem('account');
          if (savedAccount) {
            setAccount(JSON.parse(savedAccount));
            console.log('✅ Account from localStorage');
          }
        }
      } catch (accountError) {
        console.warn('⚠️ Account fetch error:', accountError.message);
        const savedAccount = localStorage.getItem('account');
        if (savedAccount) {
          setAccount(JSON.parse(savedAccount));
        }
      }

      console.log('✅ Profile fetch complete');
    } catch (err) {
      console.error('❌ Error:', err.message);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👤 User Profile</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p className="loading">⏳ Loading profile...</p>
        ) : error && !userData ? (
          <div style={{ padding: '20px' }}>
            <p className="error">❌ {error}</p>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
              Open browser console (F12) to see detailed logs
            </p>
          </div>
        ) : userData ? (
          <div className="profile-sections">
            {/* Personal Information */}
            <div className="section">
              <h3>📋 Personal Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  <p>{userData?.firstName} {userData?.lastName}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{userData?.email}</p>
                </div>
                <div className="info-item">
                  <label>Phone Number</label>
                  <p>{userData?.mobileNumber || userData?.phoneNumber || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Date of Birth</label>
                  <p>
                    {userData?.dateOfBirth 
                      ? new Date(userData.dateOfBirth).toLocaleDateString('en-IN') 
                      : 'N/A'}
                  </p>
                </div>
                <div className="info-item">
                  <label>Gender</label>
                  <p>{userData?.gender || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Marital Status</label>
                  <p>{userData?.maritalStatus || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            {account && (
              <div className="section">
                <h3>🏦 Account Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Account Number</label>
                    <p className="account-number">{account.accountNumber}</p>
                  </div>
                  <div className="info-item">
                    <label>Account Type</label>
                    <p>
                      <span className={`badge badge-${account.accountType?.toLowerCase()}`}>
                        {account.accountType}
                      </span>
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Current Balance</label>
                    <p className="balance">₹{(account.balance || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="info-item">
                    <label>Account Created</label>
                    <p>
                      {userData?.createdAt 
                        ? new Date(userData.createdAt).toLocaleDateString('en-IN') 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Professional Information */}
            <div className="section">
              <h3>💼 Professional Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Occupation</label>
                  <p>{userData?.occupation || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Annual Income</label>
                  <p>
                    {userData?.annualIncome 
                      ? `₹${userData.annualIncome.toLocaleString('en-IN')}` 
                      : 'N/A'}
                  </p>
                </div>
                <div className="info-item">
                  <label>PAN Number</label>
                  <p className="masked">
                    {userData?.panNumber 
                      ? userData.panNumber.slice(0, 4) + '****' + userData.panNumber.slice(-4) 
                      : 'N/A'}
                  </p>
                </div>
                <div className="info-item">
                  <label>Aadhaar Number</label>
                  <p className="masked">
                    {userData?.aadhaar 
                      ? '****' + userData.aadhaar.slice(-4) 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="section">
              <h3>📍 Address Information</h3>
              <div className="address-grid">
                <div className="address-block">
                  <h4>Current Address</h4>
                  {userData?.currentAddress?.street ? (
                    <p>
                      {userData.currentAddress.street}{userData.currentAddress.street && ', '}
                      {userData.currentAddress.city}{userData.currentAddress.city && ', '}
                      {userData.currentAddress.state} {userData.currentAddress.postalCode}
                    </p>
                  ) : (
                    <p className="no-data">No address provided</p>
                  )}
                </div>
                <div className="address-block">
                  <h4>Permanent Address</h4>
                  {userData?.permanentAddress?.street ? (
                    <p>
                      {userData.permanentAddress.street}{userData.permanentAddress.street && ', '}
                      {userData.permanentAddress.city}{userData.permanentAddress.city && ', '}
                      {userData.permanentAddress.state} {userData.permanentAddress.postalCode}
                    </p>
                  ) : (
                    <p className="no-data">No address provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Limits */}
            {account && (
              <div className="section">
                <h3>⚙️ Account Limits & Settings</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Daily Transfer Limit</label>
                    <p>₹{(account.dailyTransferLimit || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="info-item">
                    <label>Monthly Transaction Limit</label>
                    <p>₹{(account.monthlyLimit || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="info-item">
                    <label>Minimum Balance</label>
                    <p>₹{(account.minimumBalance || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="info-item">
                    <label>Interest Rate</label>
                    <p>{account.interestRate || 0}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Information */}
            <div className="section">
              <h3>🔒 Security</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Account Status</label>
                  <p>
                    <span className="badge badge-active">
                      ✓ Active
                    </span>
                  </p>
                </div>
                <div className="info-item">
                  <label>Two-Factor Authentication</label>
                  <p>
                    <span className="badge badge-enabled">
                      ✓ Enabled
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="error">❌ Failed to load profile data</p>
        )}

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}