// src/pages/AdminLogin.jsx - ADMIN LOGIN PAGE
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/adminlogin.css'; // We'll create this

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Check if already logged in as admin
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email || !password) {
        setError('❌ Please fill in all fields');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5189/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Admin login successful');

        // Store admin token and info
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('admin', JSON.stringify(data.admin));

        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('adminEmail', email);
        } else {
          localStorage.removeItem('adminEmail');
        }

        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError(data.message || '❌ Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('❌ Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('adminEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="admin-login-container">
      <div className="admin-login-wrapper">
        {/* Logo Section */}
        <div className="admin-login-header">
          <div className="admin-logo">🏦</div>
          <h1>Finova Bank Admin</h1>
          <p>Secure Admin Access</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleAdminLogin} className="admin-login-form">
          <h2>Admin Login</h2>

          {error && <div className="error-message">{error}</div>}

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">
              <span className="label-icon">📧</span>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="admin@finova.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="form-input"
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">
              <span className="label-icon">🔐</span>
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="form-input"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password" className="forgot-password">
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? '⏳ Logging in...' : '🔓 Login as Admin'}
          </button>

          {/* Security Notice */}
          <div className="security-notice">
            <span className="notice-icon">🔒</span>
            <p>Admin access is restricted. Unauthorized access is logged and monitored.</p>
          </div>
        </form>

        {/* Additional Info */}
        <div className="admin-login-footer">
          <p className="footer-text">
            <span>🔐</span>
            Secure Admin Portal
            <span>✓</span>
          </p>
          <div className="admin-features">
            <div className="feature">
              <span className="feature-icon">📊</span>
              <p>Dashboard & Analytics</p>
            </div>
            <div className="feature">
              <span className="feature-icon">👥</span>
              <p>User Management</p>
            </div>
            <div className="feature">
              <span className="feature-icon">📋</span>
              <p>Request Approval</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🛡️</span>
              <p>Security Controls</p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="admin-login-background">
        <div className="bg-element bg-1"></div>
        <div className="bg-element bg-2"></div>
        <div className="bg-element bg-3"></div>
      </div>
    </div>
  );
}