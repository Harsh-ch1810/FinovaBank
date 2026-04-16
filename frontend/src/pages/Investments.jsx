// src/pages/Investments.jsx - FIXED (Remove investments when sold completely)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/investments.css';

export default function Investments() {
  const { account, updateBalance } = useAuth();
  const [loading, setLoading] = useState(false);
  const [investments, setInvestments] = useState([]);

  // Modals
  const [showInvestmentTypeModal, setShowInvestmentTypeModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showAddMoreModal, setShowAddMoreModal] = useState(false);
  const [showMutualFundsModal, setShowMutualFundsModal] = useState(false);
  const [showStocksModal, setShowStocksModal] = useState(false);
  const [showFDsModal, setShowFDsModal] = useState(false);
  const [showGoldModal, setShowGoldModal] = useState(false);

  // Form states
  const [sellAmount, setSellAmount] = useState('');
  const [addMoreAmount, setAddMoreAmount] = useState('');

  // Load investments from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('investments');
      if (saved) {
        setInvestments(JSON.parse(saved));
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading investments:', err);
      setLoading(false);
    }
  }, []);

  // Save investments to localStorage whenever they change
  useEffect(() => {
    if (investments.length > 0) {
      localStorage.setItem('investments', JSON.stringify(investments));
    } else {
      localStorage.removeItem('investments');
    }
  }, [investments]);

  // Get portfolio stats
  const portfolioValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalGain = portfolioValue - totalInvested;
  const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Handle start investing
  const handleStartInvesting = () => {
    setShowInvestmentTypeModal(true);
  };

  const handleSelectInvestmentType = (type) => {
    setShowInvestmentTypeModal(false);
    if (type === 'Mutual Fund') setShowMutualFundsModal(true);
    else if (type === 'Stock') setShowStocksModal(true);
    else if (type === 'FD') setShowFDsModal(true);
    else if (type === 'Gold') setShowGoldModal(true);
  };

  // View details
  const handleViewDetails = (investment) => {
    setSelectedInvestment(investment);
    setShowDetailsModal(true);
  };

  // ==================== SELL INVESTMENT - FIXED ====================
  const handleSellInvestment = () => {
    if (!sellAmount || isNaN(sellAmount) || parseInt(sellAmount) <= 0) {
      alert('Please enter valid amount');
      return;
    }

    const sellValue = parseInt(sellAmount);
    if (sellValue > selectedInvestment.currentValue) {
      alert('Cannot sell more than current value');
      return;
    }

    // ✅ NEW: Check if selling all holdings
    const isSellingAll = sellValue === selectedInvestment.currentValue;

    let updatedInvestments;

    if (isSellingAll) {
      // ✅ REMOVE investment from list if selling all
      updatedInvestments = investments.filter(inv => inv.id !== selectedInvestment.id);
      console.log('✅ Investment removed (sold completely)');
    } else {
      // ✅ Update investment value if partial sell
      updatedInvestments = investments.map(inv => {
        if (inv.id === selectedInvestment.id) {
          const newValue = inv.currentValue - sellValue;
          return {
            ...inv,
            currentValue: newValue,
            investedAmount: Math.max(0, inv.investedAmount - (sellValue * 0.9)),
          };
        }
        return inv;
      });
      console.log('✅ Investment partially sold');
    }

    setInvestments(updatedInvestments);

    const newBalance = account.balance + sellValue;
    updateBalance(newBalance);

    setShowSellModal(false);
    setSellAmount('');
    setShowDetailsModal(false);

    alert(
      `Successfully sold ₹${sellAmount}!\n\n` +
      `${isSellingAll ? 'Investment removed from portfolio.' : ''}\n` +
      `New Balance: ₹${newBalance.toLocaleString('en-IN')}`
    );
  };

  // Add more investment
  const handleAddMore = () => {
    if (!addMoreAmount || isNaN(addMoreAmount) || parseInt(addMoreAmount) <= 0) {
      alert('Please enter valid amount');
      return;
    }

    const addValue = parseInt(addMoreAmount);
    if (account && addValue > account.balance) {
      alert('Insufficient balance');
      return;
    }

    const updatedInvestments = investments.map(inv => {
      if (inv.id === selectedInvestment.id) {
        return {
          ...inv,
          currentValue: inv.currentValue + addValue,
          investedAmount: inv.investedAmount + addValue,
        };
      }
      return inv;
    });

    setInvestments(updatedInvestments);

    const newBalance = account.balance - addValue;
    updateBalance(newBalance);

    setShowAddMoreModal(false);
    setAddMoreAmount('');

    alert(
      `Successfully added ₹${addMoreAmount}!\n\n` +
      `New Balance: ₹${newBalance.toLocaleString('en-IN')}`
    );
  };

  // Buy investment
  const handleBuyInvestment = (type, amount) => {
    if (account && amount > account.balance) {
      alert('Insufficient balance in your account');
      return;
    }

    const newInvestment = {
      id: Date.now(),
      name: `New ${type} Investment`,
      type: type,
      currentValue: amount,
      investedAmount: amount,
      gain: 0,
      gainPercent: 0,
      riskLevel: 'Medium',
      returns1Y: 0,
    };

    setInvestments([...investments, newInvestment]);

    const newBalance = account.balance - amount;
    updateBalance(newBalance);

    alert(
      `Successfully invested ₹${amount} in ${type}!\n\n` +
      `New Balance: ₹${newBalance.toLocaleString('en-IN')}`
    );

    setShowMutualFundsModal(false);
    setShowStocksModal(false);
    setShowFDsModal(false);
    setShowGoldModal(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="investments-container">
      <div className="investments-header">
        <h1>💼 My Investments</h1>
        <button className="btn-invest" onClick={handleStartInvesting}>
          + Start Investing
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="portfolio-summary">
        <div className="summary-card">
          <label>Portfolio Value</label>
          <h3>₹{portfolioValue.toLocaleString('en-IN')}</h3>
          <p>As on today</p>
        </div>

        <div className="summary-card">
          <label>Total Invested</label>
          <h3>₹{totalInvested.toLocaleString('en-IN')}</h3>
          <p>All investments</p>
        </div>

        <div className="summary-card gain">
          <label>Total Gain</label>
          <h3>₹{totalGain.toLocaleString('en-IN')}</h3>
          <p style={{ color: '#1FB981' }}>+{gainPercent.toFixed(2)}%</p>
        </div>

        <div className="summary-card">
          <label>Available Balance</label>
          <h3>₹{account ? account.balance.toLocaleString('en-IN') : 'Loading...'}</h3>
          <p>Account balance</p>
        </div>
      </div>

      {/* Investments List */}
      <div className="investments-section">
        <h2>📊 Your Holdings</h2>
        {investments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#f5f7fa',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '18px', marginBottom: '20px' }}>No investments yet</p>
            <button className="btn-invest" onClick={handleStartInvesting}>
              Start Your First Investment
            </button>
          </div>
        ) : (
          <div className="investments-list">
            {investments.map((inv) => (
              <div key={inv.id} className="investment-card">
                <div className="investment-header">
                  <div>
                    <h4>{inv.name}</h4>
                    <p className="inv-type">{inv.type}</p>
                  </div>
                  <span className={`risk-badge ${inv.riskLevel.toLowerCase()}`}>
                    {inv.riskLevel}
                  </span>
                </div>

                <div className="investment-metrics">
                  <div className="metric">
                    <label>Current Value</label>
                    <p className="value">₹{inv.currentValue.toLocaleString('en-IN')}</p>
                  </div>

                  <div className="metric">
                    <label>Invested Amount</label>
                    <p>₹{inv.investedAmount.toLocaleString('en-IN')}</p>
                  </div>

                  <div className="metric">
                    <label>Gain/Loss</label>
                    <p className={inv.gain > 0 ? 'positive' : 'negative'}>
                      ₹{inv.gain.toLocaleString('en-IN')} ({inv.gainPercent.toFixed(2)}%)
                    </p>
                  </div>

                  <div className="metric">
                    <label>1Y Returns</label>
                    <p className="positive">{inv.returns1Y}%</p>
                  </div>
                </div>

                <div className="investment-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${Math.min((inv.currentValue / inv.investedAmount) * 100, 100)}%`,
                        background: inv.gain > 0 ? '#1FB981' : '#FF6B6B'
                      }}
                    ></div>
                  </div>
                </div>

                <div className="investment-actions">
                  <button className="btn-action" onClick={() => handleViewDetails(inv)}>
                    View Details
                  </button>
                  <button 
                    className="btn-action"
                    onClick={() => {
                      setSelectedInvestment(inv);
                      setShowSellModal(true);
                    }}
                  >
                    Sell
                  </button>
                  <button 
                    className="btn-action"
                    onClick={() => {
                      setSelectedInvestment(inv);
                      setShowAddMoreModal(true);
                    }}
                  >
                    Add More
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Savings Tips Section */}
      <div className="savings-tips-section">
        <h2>💡 Investment Tips</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">🎯</div>
            <h4>Diversify Your Portfolio</h4>
            <p>Spread investments across different asset classes (mutual funds, stocks, FDs) to reduce risk</p>
          </div>

          <div className="tip-card">
            <div className="tip-icon">⏰</div>
            <h4>Start Early, Invest Small</h4>
            <p>Begin with small amounts and let compound interest work in your favor over time</p>
          </div>

          <div className="tip-card">
            <div className="tip-icon">📊</div>
            <h4>Review Regularly</h4>
            <p>Monitor your investments monthly to track progress and adjust strategy if needed</p>
          </div>

          <div className="tip-card">
            <div className="tip-icon">🔒</div>
            <h4>Think Long-Term</h4>
            <p>Don't panic during market fluctuations. Hold investments for the long-term growth</p>
          </div>

          <div className="tip-card">
            <div className="tip-icon">🚀</div>
            <h4>Reinvest Returns</h4>
            <p>Use your gains to invest more and benefit from the power of compounding</p>
          </div>

          <div className="tip-card">
            <div className="tip-icon">💰</div>
            <h4>Emergency Fund First</h4>
            <p>Keep 6 months of expenses in savings before investing aggressively</p>
          </div>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Investment Type Selection Modal */}
      {showInvestmentTypeModal && (
        <div className="modal-overlay" onClick={() => setShowInvestmentTypeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Choose Investment Type</h2>
              <button className="close-btn" onClick={() => setShowInvestmentTypeModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div 
                  onClick={() => handleSelectInvestmentType('Mutual Fund')}
                  style={{
                    padding: '24px',
                    background: '#f0f4ff',
                    border: '2px solid #667eea',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '48px' }}>📈</div>
                  <h4 style={{ color: '#667eea' }}>Mutual Funds</h4>
                </div>

                <div 
                  onClick={() => handleSelectInvestmentType('Stock')}
                  style={{
                    padding: '24px',
                    background: '#f0fdf4',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '48px' }}>📊</div>
                  <h4 style={{ color: '#10b981' }}>Stocks</h4>
                </div>

                <div 
                  onClick={() => handleSelectInvestmentType('FD')}
                  style={{
                    padding: '24px',
                    background: '#fef3c7',
                    border: '2px solid #f59e0b',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '48px' }}>💰</div>
                  <h4 style={{ color: '#f59e0b' }}>Fixed Deposits</h4>
                </div>

                <div 
                  onClick={() => handleSelectInvestmentType('Gold')}
                  style={{
                    padding: '24px',
                    background: '#fef3c7',
                    border: '2px solid #f59e0b',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '48px' }}>🏆</div>
                  <h4 style={{ color: '#f59e0b' }}>Digital Gold</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedInvestment && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Investment Details</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Investment Information</h4>
                <p><strong>Name:</strong> {selectedInvestment.name}</p>
                <p><strong>Type:</strong> {selectedInvestment.type}</p>
                <p><strong>Risk Level:</strong> {selectedInvestment.riskLevel}</p>
              </div>
              <div className="detail-section">
                <h4>Performance</h4>
                <p><strong>Current Value:</strong> ₹{selectedInvestment.currentValue.toLocaleString('en-IN')}</p>
                <p><strong>Invested Amount:</strong> ₹{selectedInvestment.investedAmount.toLocaleString('en-IN')}</p>
                <p><strong>Gain/Loss:</strong> ₹{selectedInvestment.gain.toLocaleString('en-IN')} ({selectedInvestment.gainPercent.toFixed(2)}%)</p>
                <p><strong>1-Year Returns:</strong> {selectedInvestment.returns1Y}%</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => {
                setShowDetailsModal(false);
                setShowAddMoreModal(true);
              }}>Add More</button>
              <button className="btn-danger" onClick={() => {
                setShowDetailsModal(false);
                setShowSellModal(true);
              }}>Sell</button>
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && selectedInvestment && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sell Investment</h2>
              <button className="close-btn" onClick={() => setShowSellModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Investment:</strong> {selectedInvestment.name}</p>
              <p><strong>Current Value:</strong> ₹{selectedInvestment.currentValue.toLocaleString('en-IN')}</p>
              <p style={{ color: '#1FB981', marginBottom: '20px' }}>Amount will be credited to your account</p>
              <div className="form-group">
                <label>Amount to Sell (₹)</label>
                <input 
                  type="number" 
                  placeholder="Enter amount"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  max={selectedInvestment.currentValue}
                />
                <small style={{ color: '#717171', marginTop: '5px' }}>
                  Max: ₹{selectedInvestment.currentValue.toLocaleString('en-IN')}
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleSellInvestment}>Sell Now</button>
              <button className="btn-secondary" onClick={() => setShowSellModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add More Modal */}
      {showAddMoreModal && selectedInvestment && (
        <div className="modal-overlay" onClick={() => setShowAddMoreModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add More Investment</h2>
              <button className="close-btn" onClick={() => setShowAddMoreModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Investment:</strong> {selectedInvestment.name}</p>
              <p><strong>Available Balance:</strong> ₹{account ? account.balance.toLocaleString('en-IN') : '0'}</p>
              <p style={{ color: '#FF6B6B', marginBottom: '20px' }}>Amount will be deducted from your account</p>
              <div className="form-group">
                <label>Amount to Invest (₹)</label>
                <input 
                  type="number" 
                  placeholder="Enter amount"
                  value={addMoreAmount}
                  onChange={(e) => setAddMoreAmount(e.target.value)}
                  max={account ? account.balance : 0}
                />
                <small style={{ color: '#717171', marginTop: '5px' }}>
                  Max: ₹{account ? account.balance.toLocaleString('en-IN') : '0'}
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleAddMore}>Invest Now</button>
              <button className="btn-secondary" onClick={() => setShowAddMoreModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Mutual Funds Modal */}
      {showMutualFundsModal && (
        <div className="modal-overlay" onClick={() => setShowMutualFundsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Mutual Funds</h2>
              <button className="close-btn" onClick={() => setShowMutualFundsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="fund-option">
                <h4>HDFC Mid-Cap Fund</h4>
                <p>1-Year Return: 18.5%</p>
                <p>Risk: Medium</p>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('Mutual Fund', 10000)}>Invest ₹10,000</button>
              </div>
              <div className="fund-option">
                <h4>Axis Bluechip Fund</h4>
                <p>1-Year Return: 16.2%</p>
                <p>Risk: Low</p>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('Mutual Fund', 10000)}>Invest ₹10,000</button>
              </div>
              <div className="fund-option">
                <h4>SBI Small Cap Fund</h4>
                <p>1-Year Return: 22.1%</p>
                <p>Risk: High</p>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('Mutual Fund', 10000)}>Invest ₹10,000</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowMutualFundsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Stocks Modal */}
      {showStocksModal && (
        <div className="modal-overlay" onClick={() => setShowStocksModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Stocks</h2>
              <button className="close-btn" onClick={() => setShowStocksModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="fund-option">
                <h4>TCS</h4>
                <p>Current Price: ₹3,500</p>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('Stock', 7000)}>Buy 2 shares</button>
              </div>
              <div className="fund-option">
                <h4>Infosys</h4>
                <p>Current Price: ₹1,800</p>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('Stock', 9000)}>Buy 5 shares</button>
              </div>
              <div className="fund-option">
                <h4>ITC</h4>
                <p>Current Price: ₹420</p>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('Stock', 8400)}>Buy 20 shares</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowStocksModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* FDs Modal */}
      {showFDsModal && (
        <div className="modal-overlay" onClick={() => setShowFDsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Fixed Deposits</h2>
              <button className="close-btn" onClick={() => setShowFDsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="fund-option">
                <h4>1-Year FD</h4>
                <p>Interest Rate: 6.5% p.a.</p>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('FD', 50000)}>Invest ₹50,000</button>
              </div>
              <div className="fund-option">
                <h4>2-Year FD</h4>
                <p>Interest Rate: 6.75% p.a.</p>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('FD', 50000)}>Invest ₹50,000</button>
              </div>
              <div className="fund-option">
                <h4>3-Year FD</h4>
                <p>Interest Rate: 7.0% p.a.</p>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('FD', 50000)}>Invest ₹50,000</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowFDsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Gold Modal */}
      {showGoldModal && (
        <div className="modal-overlay" onClick={() => setShowGoldModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Digital Gold</h2>
              <button className="close-btn" onClick={() => setShowGoldModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Current Gold Price:</strong> ₹6,500 per gram</p>
              <div className="fund-option">
                <h4>5 Grams Gold</h4>
                <p>Amount: ₹32,500</p>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('Gold', 32500)}>Buy Now</button>
              </div>
              <div className="fund-option">
                <h4>10 Grams Gold</h4>
                <p>Amount: ₹65,000</p>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('Gold', 65000)}>Buy Now</button>
              </div>
              <div className="fund-option">
                <h4>Custom Amount</h4>
                <button className="btn-invest-modal" onClick={() => handleBuyInvestment('Gold', 50000)}>Invest ₹50,000</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowGoldModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}