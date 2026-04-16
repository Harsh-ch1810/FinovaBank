// src/pages/SavingsGoal.jsx - FIXED WITH BALANCE SYNC + PERSISTENCE
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountAPI } from '../services/api';
import '../styles/savingsGoal.css';

export default function SavingsGoal() {
  const { token, account, updateBalance } = useAuth();
  const [loading, setLoading] = useState(true);

  // ==================== GOALS STATE ====================
  const [goals, setGoals] = useState([]);

  // Modals
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showAddAmount, setShowAddAmount] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    priority: 'Medium',
    category: 'Other',
  });

  const [addAmountValue, setAddAmountValue] = useState('');
  const [editFormData, setEditFormData] = useState({});

  // ==================== LOAD GOALS FROM LOCALSTORAGE ON MOUNT ====================
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savingsGoals');
      if (saved) {
        const parsedGoals = JSON.parse(saved);
        setGoals(parsedGoals);
        console.log('✅ Goals loaded from localStorage:', parsedGoals);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading goals:', err);
      setLoading(false);
    }
  }, []);

  // ==================== SAVE GOALS TO LOCALSTORAGE WHENEVER THEY CHANGE ====================
  useEffect(() => {
    if (goals.length > 0) {
      localStorage.setItem('savingsGoals', JSON.stringify(goals));
      console.log('✅ Goals saved to localStorage:', goals);
    }
  }, [goals]);

  const handleCreateGoal = () => {
    if (!formData.name || !formData.targetAmount || !formData.deadline) {
      alert('❌ Please fill all fields');
      return;
    }

    const newGoal = {
      id: Date.now(),
      ...formData,
      targetAmount: parseInt(formData.targetAmount),
      savedAmount: 0,
      icon: '🎯',
      color: '#667eea',
      createdAt: new Date().toISOString(),
    };

    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);

    setFormData({
      name: '',
      targetAmount: '',
      deadline: '',
      priority: 'Medium',
      category: 'Other',
    });
    setShowCreateGoal(false);
    alert('✅ Goal created successfully!');
  };

  // ==================== ADD AMOUNT TO GOAL - SYNC WITH AUTHCONTEXT ====================
  const handleAddAmount = () => {
    if (!addAmountValue || isNaN(addAmountValue) || parseInt(addAmountValue) <= 0) {
      alert('❌ Please enter valid amount');
      return;
    }

    const addValue = parseInt(addAmountValue);
    if (account && addValue > account.balance) {
      alert('❌ Insufficient balance in account');
      return;
    }

    // ✅ Update goals
    const updatedGoals = goals.map(goal =>
      goal.id === selectedGoal.id
        ? { ...goal, savedAmount: goal.savedAmount + addValue }
        : goal
    );

    setGoals(updatedGoals);

    // ✅ UPDATE BALANCE IN AUTHCONTEXT
    const newBalance = account.balance - addValue;
    updateBalance(newBalance);
    console.log('💰 Balance updated after adding to goal:', newBalance);

    setShowAddAmount(false);
    setAddAmountValue('');
    alert(
      `✅ Successfully added ₹${addAmountValue} to "${selectedGoal.name}"!\n\n` +
      `Amount deducted from account.\n` +
      `New Balance: ₹${newBalance.toLocaleString('en-IN')}`
    );
  };

  const handleEditGoal = () => {
    if (!editFormData.name || !editFormData.targetAmount || !editFormData.deadline) {
      alert('❌ Please fill all fields');
      return;
    }

    const updatedGoals = goals.map(goal =>
      goal.id === selectedGoal.id
        ? {
            ...goal,
            name: editFormData.name,
            targetAmount: parseInt(editFormData.targetAmount),
            deadline: editFormData.deadline,
            priority: editFormData.priority,
          }
        : goal
    );

    setGoals(updatedGoals);
    setShowEditGoal(false);
    alert('✅ Goal updated successfully!');
  };

  const handleStartEdit = (goal) => {
    setSelectedGoal(goal);
    setEditFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      deadline: goal.deadline,
      priority: goal.priority,
    });
    setShowEditGoal(true);
  };

  // ==================== DELETE GOAL ====================
  const handleDeleteGoal = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      const updatedGoals = goals.filter(goal => goal.id !== goalId);
      setGoals(updatedGoals);
      alert('✅ Goal deleted successfully!');
    }
  };

  const calculateDaysLeft = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  const getTotalSavings = () => {
    return goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  };

  const getTotalTarget = () => {
    return goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  };

  const getCompletedGoals = () => {
    return goals.filter(goal => goal.savedAmount >= goal.targetAmount).length;
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Loading...</div>;
  }

  return (
    <div className="savings-goal-container">
      <div className="goal-header">
        <h1>🏠 Savings Goals</h1>
        <button 
          className="btn-create-goal"
          onClick={() => setShowCreateGoal(!showCreateGoal)}
        >
          {showCreateGoal ? '✕ Cancel' : '+ Create New Goal'}
        </button>
      </div>

      {/* Goals Overview */}
      <div className="goals-overview">
        <div className="overview-card">
          <label>Total Target</label>
          <h3>₹{getTotalTarget().toLocaleString('en-IN')}</h3>
          <p>All goals combined</p>
        </div>

        <div className="overview-card">
          <label>Total Saved</label>
          <h3>₹{getTotalSavings().toLocaleString('en-IN')}</h3>
          <p>{goals.length} active goals</p>
        </div>

        <div className="overview-card">
          <label>Completed Goals</label>
          <h3>{getCompletedGoals()}</h3>
          <p>Keep up the momentum!</p>
        </div>

        <div className="overview-card">
          <label>Available Balance</label>
          <h3>₹{account ? account.balance.toLocaleString('en-IN') : 'Loading...'}</h3>
          <p>Account balance</p>
        </div>
      </div>

      {/* Create Goal Form */}
      {showCreateGoal && (
        <div className="create-goal-section">
          <h2>Create New Savings Goal</h2>
          <div className="goal-form">
            <div className="form-group">
              <label>Goal Name</label>
              <input 
                type="text" 
                placeholder="e.g., Vacation, Car, House"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Target Amount</label>
              <input 
                type="number" 
                placeholder="100000"
                value={formData.targetAmount}
                onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Deadline</label>
                <input 
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option>Travel</option>
                <option>Electronics</option>
                <option>Events</option>
                <option>Education</option>
                <option>Home</option>
                <option>Other</option>
              </select>
            </div>

            <button className="btn-submit-goal" onClick={handleCreateGoal}>Create Goal</button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="goals-section">
        <h2>📊 Your Goals</h2>
        <div className="goals-list">
          {goals.length === 0 ? (
            <div className="no-goals">
              <p>No goals yet. Create one to get started! 🎯</p>
            </div>
          ) : (
            goals.map((goal) => {
              const progress = (goal.savedAmount / goal.targetAmount) * 100;
              const daysLeft = calculateDaysLeft(goal.deadline);
              const isCompleted = goal.savedAmount >= goal.targetAmount;

              return (
                <div key={goal.id} className="goal-card" style={{ borderLeftColor: goal.color }}>
                  <div className="goal-card-header">
                    <div>
                      <span className="goal-icon">{goal.icon}</span>
                      <div>
                        <h4>{goal.name}</h4>
                        <p className="goal-category">{goal.category}</p>
                      </div>
                    </div>
                    <span className={`priority-badge ${goal.priority.toLowerCase()}`}>
                      {goal.priority}
                    </span>
                  </div>

                  <div className="goal-card-content">
                    <div className="goal-amount">
                      <div className="amount-item">
                        <label>Target</label>
                        <p>₹{goal.targetAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="amount-item">
                        <label>Saved</label>
                        <p>₹{goal.savedAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="amount-item">
                        <label>Remaining</label>
                        <p>₹{Math.max(0, goal.targetAmount - goal.savedAmount).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="goal-progress-section">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <p className="progress-text">{Math.min(progress, 100).toFixed(1)}% completed</p>
                    </div>

                    <div className="goal-deadline">
                      {isCompleted ? (
                        <span className="completed-badge">✓ Goal Completed!</span>
                      ) : (
                        <p>{daysLeft} days remaining until {new Date(goal.deadline).toLocaleDateString('en-IN')}</p>
                      )}
                    </div>
                  </div>

                  <div className="goal-actions">
                    <button 
                      className="btn-add-amount"
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowAddAmount(true);
                      }}
                    >
                      Add Amount
                    </button>
                    <button 
                      className="btn-edit-goal"
                      onClick={() => handleStartEdit(goal)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete-goal"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      Delete
                    </button>
                    {isCompleted && <button className="btn-celebrate">🎉 Celebrate</button>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Goal Tips */}
      <div className="goal-tips">
        <h2>💡 Savings Tips</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>Set Realistic Targets</h4>
            <p>Break down large goals into smaller milestones for better motivation</p>
          </div>

          <div className="tip-card">
            <h4>Auto-Save Feature</h4>
            <p>Set up automatic transfers to save consistently towards your goals</p>
          </div>

          <div className="tip-card">
            <h4>Track Progress</h4>
            <p>Review your goals monthly to stay on track and adjust if needed</p>
          </div>

          <div className="tip-card">
            <h4>Celebrate Milestones</h4>
            <p>Acknowledge your progress and celebrate small wins along the way</p>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Add Amount Modal */}
      {showAddAmount && selectedGoal && (
        <div className="modal-overlay" onClick={() => setShowAddAmount(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Add Amount</h2>
              <button className="close-btn" onClick={() => setShowAddAmount(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Goal:</strong> {selectedGoal.name}</p>
              <p><strong>Target:</strong> ₹{selectedGoal.targetAmount.toLocaleString('en-IN')}</p>
              <p><strong>Current Saved:</strong> ₹{selectedGoal.savedAmount.toLocaleString('en-IN')}</p>
              <p><strong>Available Balance:</strong> ₹{account ? account.balance.toLocaleString('en-IN') : 'Loading...'}</p>
              <p style={{ color: '#FF6B6B', marginTop: '10px' }}>Amount will be deducted from your account</p>
              <div className="form-group">
                <label>Amount to Add (₹)</label>
                <input 
                  type="number" 
                  placeholder="Enter amount"
                  value={addAmountValue}
                  onChange={(e) => setAddAmountValue(e.target.value)}
                  max={account ? account.balance : 0}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleAddAmount}>Add Amount</button>
              <button className="btn-secondary" onClick={() => setShowAddAmount(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showEditGoal && selectedGoal && (
        <div className="modal-overlay" onClick={() => setShowEditGoal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Goal</h2>
              <button className="close-btn" onClick={() => setShowEditGoal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Goal Name</label>
                <input 
                  type="text" 
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Target Amount</label>
                <input 
                  type="number" 
                  value={editFormData.targetAmount || ''}
                  onChange={(e) => setEditFormData({...editFormData, targetAmount: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Deadline</label>
                <input 
                  type="date"
                  value={editFormData.deadline || ''}
                  onChange={(e) => setEditFormData({...editFormData, deadline: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={editFormData.priority || 'Medium'}
                  onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleEditGoal}>Save Changes</button>
              <button className="btn-secondary" onClick={() => setShowEditGoal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}