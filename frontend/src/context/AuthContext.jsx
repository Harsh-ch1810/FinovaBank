import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in (on app load)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Verify token validity
  const verifyToken = async (token) => {
    try {
      // Set auth header
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get user info
      const response = await API.get('/account/info');
      const userData = {
        ...response.data.user,
        token: token,
      };
      setUser(userData);
      setError('');
    } catch (err) {
      console.error('Token verification failed:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (name, email, password) => {
    try {
      setError('');
      const response = await API.post('/auth/register', {
        name,
        email,
        password,
      });

      const { token, user: userData } = response.data;

      // Save token
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Set user
      setUser({
        ...userData,
        token,
      });

      return userData;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      setError(errorMsg);
      throw err;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError('');
      const response = await API.post('/auth/login', {
        email,
        password,
      });

      const { token, user: userData } = response.data;

      // Save token
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Set user
      setUser({
        ...userData,
        token,
      });

      return userData;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    setError('');
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};