// src/pages/Cards.jsx - WITH BLOCK & REMOVE OPTION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccountBalance } from '../hooks/useAccountBalance';
import '../styles/cards.css';

export default function Cards() {
  const { token } = useAuth();

  // ✅ CUSTOM HOOK FOR REAL-TIME BALANCE
  const { balance, accountInfo, loading, error, fetchBalance } = useAccountBalance(token, 10000);

  // ✅ INITIALIZE CARDS FROM LOCALSTORAGE OR EMPTY ARRAY
  const [cards, setCards] = useState(() => {
    try {
      const savedCards = localStorage.getItem('finova_cards');
      return savedCards ? JSON.parse(savedCards) : [];
    } catch (err) {
      console.error('Error loading cards from localStorage:', err);
      return [];
    }
  });

  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockAction, setBlockAction] = useState('block'); // 'block' or 'remove'
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showIntlModal, setShowIntlModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [newCardForm, setNewCardForm] = useState({
    cardType: 'Debit Card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const [cardSettings, setCardSettings] = useState({
    internationalTransactions: true,
    locationServices: true,
    notificationsEnabled: true,
  });

  // ✅ SAVE CARDS TO LOCALSTORAGE WHENEVER THEY CHANGE
  useEffect(() => {
    try {
      localStorage.setItem('finova_cards', JSON.stringify(cards));
    } catch (err) {
      console.error('Error saving cards to localStorage:', err);
    }
  }, [cards]);

  // ✅ INITIALIZE DEFAULT CARD WITH REAL BALANCE
  useEffect(() => {
    if (balance !== null && cards.length === 0) {
      const defaultCard = {
        id: 1,
        cardNumber: '4532 1234 5678 9010',
        cardholderName: 'Harsh Chauhan',
        expiryDate: '12/26',
        cvv: '***',
        type: 'Debit',
        issuer: 'Visa',
        status: 'Active',
        balance: balance,
        dailyLimit: accountInfo?.dailyTransferLimit || 100000,
        spentToday: 0,
      };
      setCards([defaultCard]);
    }
  }, [balance, accountInfo]);

  // ✅ UPDATE CARD BALANCE WHEN ACCOUNT BALANCE CHANGES
  useEffect(() => {
    if (balance !== null && cards.length > 0) {
      setCards((prevCards) =>
        prevCards.map((card) => ({
          ...card,
          balance: balance,
          dailyLimit: accountInfo?.dailyTransferLimit || 100000,
        }))
      );
    }
  }, [balance, accountInfo]);

  const handleNewCardInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setNewCardForm({ ...newCardForm, [name]: formatted });
    } else if (name === 'expiryDate') {
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      if (formatted.length >= 2) {
        setNewCardForm({ ...newCardForm, [name]: `${formatted.slice(0, 2)}/${formatted.slice(2)}` });
      } else {
        setNewCardForm({ ...newCardForm, [name]: formatted });
      }
    } else if (name === 'cvv') {
      setNewCardForm({ ...newCardForm, [name]: value.replace(/\D/g, '').slice(0, 3) });
    } else {
      setNewCardForm({ ...newCardForm, [name]: value });
    }
  };

  const handleRequestCard = (e) => {
    e.preventDefault();

    if (!newCardForm.cardNumber.trim() || newCardForm.cardNumber.replace(/\s/g, '').length < 16) {
      alert('❌ Card number must be 16 digits');
      return;
    }
    if (!newCardForm.expiryDate.trim()) {
      alert('❌ Please enter expiry date');
      return;
    }
    if (!newCardForm.cvv.trim() || newCardForm.cvv.length < 3) {
      alert('❌ CVV must be 3 digits');
      return;
    }

    const newCard = {
      id: cards.length > 0 ? Math.max(...cards.map(c => c.id)) + 1 : 1,
      cardNumber: newCardForm.cardNumber,
      cardholderName: 'Harsh Chauhan',
      expiryDate: newCardForm.expiryDate,
      cvv: '***',
      type: newCardForm.cardType === 'Debit Card' ? 'Debit' : 'Credit',
      issuer: 'Visa',
      status: 'Active',
      balance: balance || 0,
      dailyLimit: accountInfo?.dailyTransferLimit || 100000,
      spentToday: 0,
    };

    // ✅ ADD NEW CARD AND PERSIST TO LOCALSTORAGE
    setCards([...cards, newCard]);
    
    setSuccessMessage(
      `✅ Card Generated Successfully!\n\nCard Number: ${newCardForm.cardNumber}\nType: ${newCardForm.cardType}\nStatus: Active\nBalance: ₹${balance?.toLocaleString('en-IN') || '0'}`
    );
    setShowSuccessModal(true);

    setNewCardForm({
      cardType: 'Debit Card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    });

    setShowAddCard(false);

    setTimeout(() => {
      setShowSuccessModal(false);
    }, 3000);
  };

  // ==================== BLOCK CARD ====================
  const handleBlockCard = () => {
    if (blockAction === 'block') {
      // ✅ JUST BLOCK - KEEP IN LIST
      const updatedCards = cards.map((card) =>
        card.id === selectedCard.id ? { ...card, status: 'Blocked' } : card
      );
      setCards(updatedCards);
      const blocked = updatedCards.find((card) => card.id === selectedCard.id);
      setSelectedCard(blocked);
      
      setSuccessMessage(`✅ Card Blocked Successfully!\n\nCard: ${selectedCard.cardNumber}\nStatus: Blocked\n\nYou can unblock it anytime.`);
      setShowSuccessModal(true);
      
    } else if (blockAction === 'remove') {
      // ✅ BLOCK & REMOVE - REMOVE FROM LIST (DECLUTTER)
      const updatedCards = cards.filter((card) => card.id !== selectedCard.id);
      setCards(updatedCards);
      
      setSuccessMessage(`✅ Card Blocked & Removed!\n\nCard: ${selectedCard.cardNumber}\n\nThe card has been blocked and removed from your list.`);
      setShowSuccessModal(true);
    }

    setShowBlockModal(false);
    setShowDetailsModal(false);
    setBlockAction('block'); // Reset to default
  };

  const handleUnblockCard = () => {
    const updatedCards = cards.map((card) =>
      card.id === selectedCard.id ? { ...card, status: 'Active' } : card
    );
    setCards(updatedCards);
    const unblocked = updatedCards.find((card) => card.id === selectedCard.id);
    setSelectedCard(unblocked);
    
    setSuccessMessage(`✅ Card Unblocked Successfully!\n\nCard: ${selectedCard.cardNumber}\nStatus: Active`);
    setShowSuccessModal(true);
    setShowDetailsModal(false);
  };

  const handleSaveSetting = (setting) => {
    alert(`✓ ${setting} updated successfully!`);
  };

  if (loading && balance === null) {
    return (
      <div className="cards-container">
        <p>⏳ Loading cards...</p>
      </div>
    );
  }

  return (
    <div className="cards-container">
      {/* HEADER */}
      <div className="cards-header">
        <h1>💳 My Cards</h1>
        <button 
          className="btn-add-card"
          onClick={() => setShowAddCard(!showAddCard)}
        >
          {showAddCard ? '✕ Cancel' : '+ Add New Card'}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          color: '#c33',
          padding: '12px',
          borderRadius: '6px',
          margin: '16px 0',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ADD NEW CARD FORM */}
      {showAddCard && (
        <div className="card-form-section">
          <h2>Add New Card</h2>
          <form className="card-form" onSubmit={handleRequestCard}>
            <div className="form-group">
              <label>Card Type</label>
              <select 
                name="cardType"
                value={newCardForm.cardType}
                onChange={handleNewCardInputChange}
              >
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>

            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                name="cardNumber"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                value={newCardForm.cardNumber}
                onChange={handleNewCardInputChange}
                maxLength="19"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="text"
                  name="expiryDate"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  value={newCardForm.expiryDate}
                  onChange={handleNewCardInputChange}
                  maxLength="5"
                  required
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="password"
                  name="cvv"
                  autoComplete="cc-csc"
                  placeholder="***"
                  value={newCardForm.cvv}
                  onChange={handleNewCardInputChange}
                  maxLength="3"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-submit">
              Request Card
            </button>
          </form>
        </div>
      )}

      {/* CARDS GRID */}
      <div className="cards-grid">
        {cards.length > 0 ? (
          cards.map((card) => (
            <div key={card.id} className="card-item">
              <div className={`card-visual ${card.issuer.toLowerCase()}`}>
                <div className="card-header-visual">
                  <span className="card-type-badge">{card.type}</span>
                  <span className="card-issuer">{card.issuer}</span>
                </div>

                <div className="card-chip">
                  <svg width="40" height="30" viewBox="0 0 40 30">
                    <rect x="2" y="2" width="36" height="26" fill="none" stroke="gold" strokeWidth="1" rx="2" />
                    <circle cx="10" cy="8" r="2" fill="gold" />
                    <circle cx="18" cy="8" r="2" fill="gold" />
                    <circle cx="10" cy="16" r="2" fill="gold" />
                    <circle cx="18" cy="16" r="2" fill="gold" />
                  </svg>
                </div>

                <div className="card-number">
                  <p>{card.cardNumber}</p>
                </div>

                <div className="card-footer-visual">
                  <div>
                    <span className="label">Card Holder</span>
                    <p>{card.cardholderName}</p>
                  </div>
                  <div>
                    <span className="label">Expires</span>
                    <p>{card.expiryDate}</p>
                  </div>
                </div>
              </div>

              <div className="card-details">
                <div className="detail-row">
                  <span>Status</span>
                  <span className={`status ${card.status.toLowerCase()}`}>{card.status}</span>
                </div>

                <div className="detail-row">
                  <span>Card Balance</span>
                  <span>₹{card.balance.toLocaleString('en-IN')}</span>
                </div>

                <div className="detail-row">
                  <span>Daily Limit</span>
                  <span>₹{card.dailyLimit.toLocaleString('en-IN')}</span>
                </div>

                <div className="detail-row">
                  <span>Spent Today</span>
                  <span>₹{card.spentToday.toLocaleString('en-IN')}</span>
                </div>

                <div className="card-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(card.spentToday / card.dailyLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedCard(card);
                      setShowDetailsModal(true);
                    }}
                  >
                    View Details
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedCard(card);
                      if (card.status === 'Blocked') {
                        handleUnblockCard();
                      } else {
                        setShowBlockModal(true);
                      }
                    }}
                  >
                    {card.status === 'Active' ? 'Block Card' : 'Unblock Card'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            gridColumn: '1 / -1',
            color: '#717171',
          }}>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>No cards yet</p>
            <button 
              className="btn-add-card"
              onClick={() => setShowAddCard(true)}
            >
              + Create Your First Card
            </button>
          </div>
        )}
      </div>

      {/* CARD SETTINGS */}
      <div className="cards-settings">
        <h2>⚙️ Card Settings</h2>
        <div className="settings-grid">
          <div className="setting-item">
            <h4>🔒 Security</h4>
            <p>Manage card security and fraud protection</p>
            <button 
              className="btn-setting"
              onClick={() => setShowSecurityModal(true)}
            >
              Manage
            </button>
          </div>

          <div className="setting-item">
            <h4>🌍 International Transactions</h4>
            <p>Enable/disable international purchases</p>
            <button 
              className="btn-setting"
              onClick={() => setShowIntlModal(true)}
            >
              Manage
            </button>
          </div>

          <div className="setting-item">
            <h4>📍 Location Services</h4>
            <p>Set location-based card usage</p>
            <button 
              className="btn-setting"
              onClick={() => setShowLocationModal(true)}
            >
              Manage
            </button>
          </div>

          <div className="setting-item">
            <h4>🔔 Notifications</h4>
            <p>Customize transaction notifications</p>
            <button 
              className="btn-setting"
              onClick={() => setShowNotificationModal(true)}
            >
              Manage
            </button>
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Success!</h2>
              <button className="close-btn" onClick={() => setShowSuccessModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>✨</div>
                <p style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#333' }}>
                  {successMessage}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-primary" 
                onClick={() => setShowSuccessModal(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Card Details</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Card Information</h4>
                <p><strong>Card Number:</strong> {selectedCard.cardNumber}</p>
                <p><strong>Card Holder:</strong> {selectedCard.cardholderName}</p>
                <p><strong>Expiry:</strong> {selectedCard.expiryDate}</p>
                <p><strong>Type:</strong> {selectedCard.type} Card ({selectedCard.issuer})</p>
                <p><strong>Status:</strong> <span className={`badge ${selectedCard.status.toLowerCase()}`}>{selectedCard.status}</span></p>
              </div>
              <div className="detail-section">
                <h4>Balance & Limits</h4>
                <p><strong>Card Balance:</strong> ₹{selectedCard.balance.toLocaleString('en-IN')}</p>
                <p><strong>Daily Limit:</strong> ₹{selectedCard.dailyLimit.toLocaleString('en-IN')}</p>
                <p><strong>Spent Today:</strong> ₹{selectedCard.spentToday.toLocaleString('en-IN')}</p>
                <p><strong>Available:</strong> ₹{(selectedCard.dailyLimit - selectedCard.spentToday).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="modal-footer">
              {selectedCard.status === 'Active' ? (
                <button className="btn-danger" onClick={() => {
                  setShowDetailsModal(false);
                  setShowBlockModal(true);
                }}>Block This Card</button>
              ) : (
                <button className="btn-success" onClick={() => {
                  handleUnblockCard();
                }}>Unblock Card</button>
              )}
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Block Card Modal - WITH TWO OPTIONS */}
      {showBlockModal && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚨 Block Card</h2>
              <button className="close-btn" onClick={() => setShowBlockModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '20px', fontSize: '14px' }}>
                What would you like to do with <strong>{selectedCard.cardNumber}</strong>?
              </p>

              {/* OPTION 1: BLOCK ONLY */}
              <div 
                style={{
                  border: blockAction === 'block' ? '2px solid #667eea' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  background: blockAction === 'block' ? '#f0f4ff' : '#ffffff',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setBlockAction('block')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="radio" 
                    name="blockAction" 
                    value="block" 
                    checked={blockAction === 'block'}
                    onChange={() => setBlockAction('block')}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#1a1a1a' }}>🔒 Block Only</h4>
                    <p style={{ margin: '0', color: '#717171', fontSize: '13px' }}>
                      Card will be blocked but still visible in your list. You can unblock it anytime.
                    </p>
                  </div>
                </div>
              </div>

              {/* OPTION 2: BLOCK & REMOVE */}
              <div 
                style={{
                  border: blockAction === 'remove' ? '2px solid #ef4444' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                  cursor: 'pointer',
                  background: blockAction === 'remove' ? '#fee' : '#ffffff',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setBlockAction('remove')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="radio" 
                    name="blockAction" 
                    value="remove" 
                    checked={blockAction === 'remove'}
                    onChange={() => setBlockAction('remove')}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#1a1a1a' }}>🗑️ Block & Remove</h4>
                    <p style={{ margin: '0', color: '#717171', fontSize: '13px' }}>
                      Card will be blocked and removed from your card list. Keeps your wallet clean and decluttered.
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
                ⚠️ Once blocked, you won't be able to use this card for transactions.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-danger" onClick={handleBlockCard}>
                {blockAction === 'remove' ? '🗑️ Block & Remove' : '🔒 Block Only'}
              </button>
              <button className="btn-secondary" onClick={() => setShowBlockModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="modal-overlay" onClick={() => setShowSecurityModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔒 Security Settings</h2>
              <button className="close-btn" onClick={() => setShowSecurityModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="setting-option">
                <h4>3D Secure</h4>
                <p>Adds an extra layer of security for online purchases</p>
                <label className="checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Enabled</span>
                </label>
              </div>
              <div className="setting-option">
                <h4>OTP Verification</h4>
                <p>Require OTP for large transactions</p>
                <label className="checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Enabled</span>
                </label>
              </div>
              <div className="setting-option">
                <h4>Fraud Detection</h4>
                <p>Real-time fraud monitoring</p>
                <label className="checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Enabled</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => {
                handleSaveSetting('Security settings');
                setShowSecurityModal(false);
              }}>Save Settings</button>
              <button className="btn-secondary" onClick={() => setShowSecurityModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* International Transactions Modal */}
      {showIntlModal && (
        <div className="modal-overlay" onClick={() => setShowIntlModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🌍 International Transactions</h2>
              <button className="close-btn" onClick={() => setShowIntlModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="setting-option">
                <h4>Enable International Transactions</h4>
                <p>Allow card usage outside India</p>
                <label className="checkbox">
                  <input 
                    type="checkbox" 
                    defaultChecked={cardSettings.internationalTransactions}
                    onChange={(e) => setCardSettings({...cardSettings, internationalTransactions: e.target.checked})}
                  />
                  <span>Enabled</span>
                </label>
              </div>
              <div className="setting-option">
                <h4>Transaction Limit</h4>
                <p>Maximum international transaction: ₹5,00,000 per day</p>
              </div>
              <div className="alert" style={{background: '#FFF3E0', padding: '12px', borderRadius: '8px', marginTop: '12px'}}>
                ⚠️ International transactions may have additional charges
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => {
                handleSaveSetting('International transaction settings');
                setShowIntlModal(false);
              }}>Save Settings</button>
              <button className="btn-secondary" onClick={() => setShowIntlModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Location Services Modal */}
      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📍 Location Services</h2>
              <button className="close-btn" onClick={() => setShowLocationModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="setting-option">
                <h4>Location-Based Verification</h4>
                <p>Verify card usage based on your location</p>
                <label className="checkbox">
                  <input 
                    type="checkbox" 
                    defaultChecked={cardSettings.locationServices}
                    onChange={(e) => setCardSettings({...cardSettings, locationServices: e.target.checked})}
                  />
                  <span>Enabled</span>
                </label>
              </div>
              <div className="setting-option">
                <h4>Current Location</h4>
                <p>📍 Jaipur, Rajasthan, India</p>
              </div>
              <div className="setting-option">
                <h4>Trusted Locations</h4>
                <p>Jaipur, Delhi, Mumbai</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => {
                handleSaveSetting('Location settings');
                setShowLocationModal(false);
              }}>Save Settings</button>
              <button className="btn-secondary" onClick={() => setShowLocationModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotificationModal && (
        <div className="modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔔 Notification Settings</h2>
              <button className="close-btn" onClick={() => setShowNotificationModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="setting-option">
                <h4>Transaction Notifications</h4>
                <p>Get notified for every transaction</p>
                <label className="checkbox">
                  <input 
                    type="checkbox" 
                    defaultChecked={cardSettings.notificationsEnabled}
                    onChange={(e) => setCardSettings({...cardSettings, notificationsEnabled: e.target.checked})}
                  />
                  <span>Enabled</span>
                </label>
              </div>
              <div className="setting-option">
                <h4>Large Transaction Alerts</h4>
                <p>Alert for transactions above ₹10,000</p>
                <label className="checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Enabled</span>
                </label>
              </div>
              <div className="setting-option">
                <h4>Security Alerts</h4>
                <p>Get notified of suspicious activities</p>
                <label className="checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Enabled</span>
                </label>
              </div>
              <div className="setting-option">
                <h4>Notification Channel</h4>
                <p>
                  <label className="radio">
                    <input type="radio" name="channel" defaultChecked /> SMS
                  </label>
                  <label className="radio">
                    <input type="radio" name="channel" /> Email
                  </label>
                  <label className="radio">
                    <input type="radio" name="channel" /> Push Notification
                  </label>
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => {
                handleSaveSetting('Notification preferences');
                setShowNotificationModal(false);
              }}>Save Settings</button>
              <button className="btn-secondary" onClick={() => setShowNotificationModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}