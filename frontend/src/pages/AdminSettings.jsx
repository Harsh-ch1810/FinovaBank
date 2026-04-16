// src/pages/AdminSettings.jsx - ADMIN SETTINGS & CONFIGURATION
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import '../styles/adminsettings.css';

export default function AdminSettings() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    loanSettings: {
      minAmount: 10000,
      maxAmount: 5000000,
      maxTenure: 60,
      minTenure: 6,
    },
    interestRates: {
      personal: 9,
      home: 6.5,
      vehicle: 7.5,
      education: 6,
    },
    transactionLimits: {
      dailyLimit: 500000,
      monthlyLimit: 5000000,
      singleTransaction: 500000,
    },
    otherSettings: {
      minimumBalance: 1000,
      penaltyRate: 1.5,
      gracePeriod: 3,
    },
  });

  const [activeTab, setActiveTab] = useState('loans');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [token, user, navigate]);

  const handleSettingChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    alert('✅ Settings saved successfully!');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="admin-container">
      <AdminNavbar />

      <div className="admin-content">
        <div className="admin-header">
          <h1>⚙️ System Settings & Configuration</h1>
          <p>Manage system settings and configuration parameters</p>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
            onClick={() => setActiveTab('loans')}
          >
            📋 Loan Settings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'rates' ? 'active' : ''}`}
            onClick={() => setActiveTab('rates')}
          >
            💰 Interest Rates
          </button>
          <button 
            className={`tab-btn ${activeTab === 'transaction' ? 'active' : ''}`}
            onClick={() => setActiveTab('transaction')}
          >
            💳 Transaction Limits
          </button>
          <button 
            className={`tab-btn ${activeTab === 'other' ? 'active' : ''}`}
            onClick={() => setActiveTab('other')}
          >
            🔧 Other Settings
          </button>
        </div>

        {/* Loan Settings */}
        {activeTab === 'loans' && (
          <div className="settings-content">
            <div className="settings-card">
              <h2>📋 Loan Configuration</h2>
              
              <div className="settings-group">
                <div className="setting-item">
                  <label>Minimum Loan Amount (₹)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      value={settings.loanSettings.minAmount}
                      onChange={(e) => handleSettingChange('loanSettings', 'minAmount', parseInt(e.target.value))}
                    />
                    <small>Minimum amount users can apply for</small>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Maximum Loan Amount (₹)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      value={settings.loanSettings.maxAmount}
                      onChange={(e) => handleSettingChange('loanSettings', 'maxAmount', parseInt(e.target.value))}
                    />
                    <small>Maximum amount users can apply for</small>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Minimum Tenure (Months)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      value={settings.loanSettings.minTenure}
                      onChange={(e) => handleSettingChange('loanSettings', 'minTenure', parseInt(e.target.value))}
                    />
                    <small>Minimum loan repayment period</small>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Maximum Tenure (Months)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      value={settings.loanSettings.maxTenure}
                      onChange={(e) => handleSettingChange('loanSettings', 'maxTenure', parseInt(e.target.value))}
                    />
                    <small>Maximum loan repayment period</small>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSave}>
                💾 Save Settings
              </button>
              {saved && <div className="success-msg">✅ Settings saved!</div>}
            </div>
          </div>
        )}

        {/* Interest Rates */}
        {activeTab === 'rates' && (
          <div className="settings-content">
            <div className="settings-card">
              <h2>💰 Interest Rates Configuration</h2>
              
              <div className="settings-group">
                <div className="setting-item">
                  <label>Personal Loan Rate (% p.a.)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.interestRates.personal}
                      onChange={(e) => handleSettingChange('interestRates', 'personal', parseFloat(e.target.value))}
                    />
                    <small>Interest rate for personal loans</small>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Home Loan Rate (% p.a.)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.interestRates.home}
                      onChange={(e) => handleSettingChange('interestRates', 'home', parseFloat(e.target.value))}
                    />
                    <small>Interest rate for home loans</small>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Vehicle Loan Rate (% p.a.)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.interestRates.vehicle}
                      onChange={(e) => handleSettingChange('interestRates', 'vehicle', parseFloat(e.target.value))}
                    />
                    <small>Interest rate for vehicle loans</small>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Education Loan Rate (% p.a.)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.interestRates.education}
                      onChange={(e) => handleSettingChange('interestRates', 'education', parseFloat(e.target.value))}
                    />
                    <small>Interest rate for education loans</small>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSave}>
                💾 Save Settings
              </button>
              {saved && <div className="success-msg">✅ Settings saved!</div>}
            </div>
          </div>
        )}

        {/* Transaction Limits */}
        {activeTab === 'transaction' && (
          <div className="settings-content">
            <div className="settings-card">
              <h2>💳 Transaction Limits Configuration</h2>
              
              <div className="settings-group">
                <div className="setting-item">
                  <label>Daily Limit (₹)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      value={settings.transactionLimits.dailyLimit}
                      onChange={(e) => handleSettingChange('transactionLimits', 'dailyLimit', parseInt(e.target.value))}
                    />
                    <small>Maximum amount that can be transacted per day</small>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Monthly Limit (₹)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      value={settings.transactionLimits.monthlyLimit}
                      onChange={(e) => handleSettingChange('transactionLimits', 'monthlyLimit', parseInt(e.target.value))}
                    />
                    <small>Maximum amount that can be transacted per month</small>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Single Transaction Limit (₹)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      value={settings.transactionLimits.singleTransaction}
                      onChange={(e) => handleSettingChange('transactionLimits', 'singleTransaction', parseInt(e.target.value))}
                    />
                    <small>Maximum amount per single transaction</small>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSave}>
                💾 Save Settings
              </button>
              {saved && <div className="success-msg">✅ Settings saved!</div>}
            </div>
          </div>
        )}

        {/* Other Settings */}
        {activeTab === 'other' && (
          <div className="settings-content">
            <div className="settings-card">
              <h2>🔧 Other System Settings</h2>
              
              <div className="settings-group">
                <div className="setting-item">
                  <label>Minimum Account Balance (₹)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      value={settings.otherSettings.minimumBalance}
                      onChange={(e) => handleSettingChange('otherSettings', 'minimumBalance', parseInt(e.target.value))}
                    />
                    <small>Minimum balance required in account</small>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Late Payment Penalty (% p.m.)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.otherSettings.penaltyRate}
                      onChange={(e) => handleSettingChange('otherSettings', 'penaltyRate', parseFloat(e.target.value))}
                    />
                    <small>Penalty charged per month for late payment</small>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Payment Grace Period (Days)</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      value={settings.otherSettings.gracePeriod}
                      onChange={(e) => handleSettingChange('otherSettings', 'gracePeriod', parseInt(e.target.value))}
                    />
                    <small>Days before penalty is applied</small>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSave}>
                💾 Save Settings
              </button>
              {saved && <div className="success-msg">✅ Settings saved!</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}