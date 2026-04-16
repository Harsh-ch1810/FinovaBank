// src/hooks/useAccountBalance.js - CUSTOM HOOK FOR REAL-TIME BALANCE
import { useState, useEffect, useCallback } from 'react';
import { accountAPI } from '../services/api';

export const useAccountBalance = (token, refreshInterval = 10000) => {
  const [balance, setBalance] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ✅ FETCH BALANCE FUNCTION
  const fetchBalance = useCallback(async () => {
    if (!token) {
      setError('No token available');
      return null;
    }

    try {
      setLoading(true);
      console.log('📍 Fetching balance from server...');

      const result = await accountAPI.getInfo();

      if (result.success) {
        console.log('✅ Balance fetched:', result.account.balance);
        setBalance(result.account.balance);
        setAccountInfo(result.account);
        setError(null);
        setLastUpdated(new Date());
        return result.account;
      } else {
        console.error('❌ Failed to fetch balance:', result.message);
        setError(result.message || 'Failed to fetch balance');
        return null;
      }
    } catch (err) {
      console.error('❌ Error fetching balance:', err);
      setError(err.message || 'Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ✅ INITIAL LOAD
  useEffect(() => {
    if (token) {
      fetchBalance();
    }
  }, [token, fetchBalance]);

  // ✅ AUTO-REFRESH INTERVAL
  useEffect(() => {
    if (!token || refreshInterval === 0) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing balance...');
      fetchBalance();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [token, refreshInterval, fetchBalance]);

  return {
    balance,
    accountInfo,
    loading,
    error,
    lastUpdated,
    fetchBalance, // Manual refresh function
    refetch: fetchBalance, // Alias
  };
};