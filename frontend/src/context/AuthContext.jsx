import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==================== LOAD FROM STORAGE ON MOUNT ====================
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedAccount = localStorage.getItem('account');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedAccount) setAccount(JSON.parse(savedAccount));
    }
  }, []);

  // ==================== AUTO-SAVE ACCOUNT TO LOCALSTORAGE ====================
  useEffect(() => {
    if (account) {
      localStorage.setItem('account', JSON.stringify(account));
      console.log('✅ Account saved to localStorage:', account.balance);
    }
  }, [account]);

  // ==================== SAFE SETACCOUNT - Updates state AND localStorage ====================
  const safeSetAccount = useCallback((newAccount) => {
    console.log('🔄 safeSetAccount called:', newAccount.balance);
    setAccount(newAccount);
    localStorage.setItem('account', JSON.stringify(newAccount));
  }, []);

  // ==================== REGISTER ====================
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5189/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        safeSetAccount(data.account);
        setToken(data.token);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('account', JSON.stringify(data.account));

        return { success: true };
      } else {
        setError(data.message);
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // ==================== LOGIN ====================
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5189/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        safeSetAccount(data.account);
        setToken(data.token);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('account', JSON.stringify(data.account));

        return { success: true };
      } else {
        setError(data.message);
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // ==================== LOGOUT ====================
  const logout = () => {
    setUser(null);
    setAccount(null);
    setToken(null);
    localStorage.clear();
    window.location.href = '/login';
  };

  // ==================== FETCH ACCOUNT FROM SERVER ====================
  const getAccountInfo = useCallback(async () => {
    if (!token) {
      console.warn('⚠️ No token available');
      return;
    }

    try {
      console.log('📍 Fetching account from server...');
      const response = await fetch('http://localhost:5189/api/account/info', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.account) {
        console.log('✅ Server account balance:', data.account.balance);
        safeSetAccount(data.account);
        return data.account;
      } else {
        console.warn('⚠️ Server returned invalid data:', data);
        return null;
      }
    } catch (err) {
      console.error('❌ Error fetching account:', err);
      return null;
    }
  }, [token, safeSetAccount]);

  // ==================== UPDATE BALANCE LOCALLY (FOR INVESTMENTS) ====================
  // This is the key function that investments page uses
  const updateBalance = useCallback((newBalance) => {
    console.log('💰 updateBalance called:', newBalance);
    if (account) {
      const updatedAccount = {
        ...account,
        balance: newBalance,
      };
      safeSetAccount(updatedAccount);
      console.log('✅ Balance updated locally and saved');
    }
  }, [account, safeSetAccount]);

  const value = {
    user,
    account,
    setAccount: safeSetAccount,  // ✅ Use safe version
    updateBalance,                // ✅ NEW: For investments page
    token,
    loading,
    error,
    register,
    login,
    logout,
    getAccountInfo,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};