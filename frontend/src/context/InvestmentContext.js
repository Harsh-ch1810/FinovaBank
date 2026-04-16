import React, { createContext, useState, useContext, useEffect } from 'react';

const InvestmentContext = createContext();

export const InvestmentProvider = ({ children }) => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      setLoading(true);
      const savedInvestments = localStorage.getItem('investments');
      if (savedInvestments) {
        const parsed = JSON.parse(savedInvestments);
        setInvestments(parsed);
        console.log('Investments loaded from localStorage:', parsed);
      } else {
        console.log('No investments in localStorage');
        setInvestments([]);
      }
    } catch (err) {
      console.error('Error loading investments:', err);
      setError(err.message);
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add investment
  const addInvestment = (investment) => {
    try {
      const newInvestment = {
        id: Date.now(),
        ...investment,
        createdAt: new Date().toISOString(),
      };

      const updatedInvestments = [...investments, newInvestment];
      setInvestments(updatedInvestments);
      localStorage.setItem('investments', JSON.stringify(updatedInvestments));
      console.log('Investment added:', newInvestment);

      return newInvestment;
    } catch (err) {
      console.error('Error adding investment:', err);
      setError(err.message);
      throw err;
    }
  };

  // Update investment
  const updateInvestment = (investmentId, updates) => {
    try {
      const updatedInvestments = investments.map(inv =>
        inv.id === investmentId ? { ...inv, ...updates } : inv
      );
      setInvestments(updatedInvestments);
      localStorage.setItem('investments', JSON.stringify(updatedInvestments));
      console.log('Investment updated:', investmentId);

      return updatedInvestments.find(inv => inv.id === investmentId);
    } catch (err) {
      console.error('Error updating investment:', err);
      setError(err.message);
      throw err;
    }
  };

  // Sell investment
  const sellInvestment = (investmentId, sellAmount) => {
    try {
      const investment = investments.find(inv => inv.id === investmentId);
      if (!investment) {
        throw new Error('Investment not found');
      }

      if (sellAmount > investment.currentValue) {
        throw new Error('Cannot sell more than current value');
      }

      const newValue = investment.currentValue - sellAmount;
      const updates = {
        currentValue: newValue,
        investedAmount: Math.max(0, investment.investedAmount - (sellAmount * 0.9)),
      };

      updateInvestment(investmentId, updates);
      console.log('Sold amount:', sellAmount);

      return sellAmount;
    } catch (err) {
      console.error('Error selling investment:', err);
      setError(err.message);
      throw err;
    }
  };

  // Add more to investment
  const addMoreToInvestment = (investmentId, addAmount) => {
    try {
      const investment = investments.find(inv => inv.id === investmentId);
      if (!investment) {
        throw new Error('Investment not found');
      }

      const updates = {
        currentValue: investment.currentValue + addAmount,
        investedAmount: investment.investedAmount + addAmount,
      };

      updateInvestment(investmentId, updates);
      console.log('Added amount:', addAmount);

      return addAmount;
    } catch (err) {
      console.error('Error adding to investment:', err);
      setError(err.message);
      throw err;
    }
  };

  // Delete investment
  const deleteInvestment = (investmentId) => {
    try {
      const updatedInvestments = investments.filter(inv => inv.id !== investmentId);
      setInvestments(updatedInvestments);
      localStorage.setItem('investments', JSON.stringify(updatedInvestments));
      console.log('Investment deleted:', investmentId);
    } catch (err) {
      console.error('Error deleting investment:', err);
      setError(err.message);
      throw err;
    }
  };

  // Get portfolio stats
  const getPortfolioStats = () => {
    const portfolioValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
    const totalGain = portfolioValue - totalInvested;
    const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return {
      portfolioValue,
      totalInvested,
      totalGain,
      gainPercent,
      investmentCount: investments.length,
    };
  };

  // Context value
  const value = {
    investments,
    loading,
    error,
    addInvestment,
    updateInvestment,
    sellInvestment,
    addMoreToInvestment,
    deleteInvestment,
    getPortfolioStats,
    getInvestmentById: (id) => investments.find(inv => inv.id === id),
    getAllInvestments: () => investments,
  };

  return React.createElement(
    InvestmentContext.Provider,
    { value },
    children
  );
};

// Custom hook
export const useInvestments = () => {
  const context = useContext(InvestmentContext);
  if (!context) {
    throw new Error('useInvestments must be used within InvestmentProvider');
  }
  return context;
};