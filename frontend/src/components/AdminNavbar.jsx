// src/components/AdminNavbar.jsx - FIXED VERSION (Removed red sidebar, improved navbar)
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/adminnavbar.css';

export default function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoansMenu, setShowLoansMenu] = useState(false);
  const dropdownRef = useRef(null);
  const loansRef = useRef(null);

  const isActive = (path) => location.pathname === path;
  const isLoansActive = () => location.pathname.startsWith('/admin/loans');

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (loansRef.current && !loansRef.current.contains(e.target)) {
        setShowLoansMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loanSubItems = [
    { label: 'All Loans',     path: '/admin/loans',              icon: '📋', desc: 'View all loans' },
    { label: 'Applications',  path: '/admin/loans/applications', icon: '📝', desc: 'Pending requests' },
    { label: 'Approvals',     path: '/admin/loans/approvals',    icon: '✅', desc: 'Approve or reject' },
    { label: 'Active Loans',  path: '/admin/loans/active',       icon: '🔄', desc: 'Ongoing loans' },
    { label: 'Repayments',    path: '/admin/loans/repayments',   icon: '💰', desc: 'Payment tracking' },
    { label: 'Reports',       path: '/admin/loans/reports',      icon: '📈', desc: 'Loan analytics' },
  ];

  return (
    <nav className="admin-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand" onClick={() => navigate('/admin/dashboard')}>
          <span className="brand-icon">🏦</span>
          <span className="brand-text">Finova Admin</span>
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          {/* Dashboard */}
          <button
            className={`nav-btn ${isActive('/admin/dashboard') ? 'active' : ''}`}
            onClick={() => navigate('/admin/dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </button>

          {/* Loans Dropdown */}
          <div className="loans-dropdown-wrapper" ref={loansRef}>
            <button
              className={`nav-btn loans-trigger ${isLoansActive() ? 'active' : ''}`}
              onClick={() => setShowLoansMenu(!showLoansMenu)}
            >
              <span className="nav-icon">📋</span>
              <span className="nav-label">Loans</span>
              <span className={`loans-caret ${showLoansMenu ? 'open' : ''}`}>▾</span>
            </button>

            {showLoansMenu && (
              <div className="loans-mega-menu">
                <div className="loans-menu-header">
                  <span className="loans-menu-title">Loan Management</span>
                  <span className="loans-menu-sub">Select a section</span>
                </div>
                <div className="loans-menu-grid">
                  {loanSubItems.map((item) => (
                    <button
                      key={item.path}
                      className={`loans-menu-item ${isActive(item.path) ? 'active' : ''}`}
                      onClick={() => {
                        navigate(item.path);
                        setShowLoansMenu(false);
                      }}
                    >
                      <span className="loans-item-icon">{item.icon}</span>
                      <span className="loans-item-text">
                        <span className="loans-item-label">{item.label}</span>
                        <span className="loans-item-desc">{item.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transactions - Standalone Button */}
          <button
            className={`nav-btn ${isActive('/admin/transactions') ? 'active' : ''}`}
            onClick={() => navigate('/admin/transactions')}
            title="View all transactions"
          >
            <span className="nav-icon">💳</span>
            <span className="nav-label">Transactions</span>
          </button>

          {/* Users - Standalone Button */}
          <button
            className={`nav-btn ${isActive('/admin/users') ? 'active' : ''}`}
            onClick={() => navigate('/admin/users')}
            title="Manage users"
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Users</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="navbar-user">
          <div className="user-dropdown" ref={dropdownRef}>
            <button
              className="user-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span className="user-avatar">👤</span>
              <span className="user-name">{user?.name || user?.firstName || 'Admin'}</span>
              <span className={`dropdown-icon ${showDropdown ? 'open' : ''}`}>▼</span>
            </button>

            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <p className="user-role">Administrator</p>
                </div>
                <button className="dropdown-item" onClick={() => { navigate('/admin/settings'); setShowDropdown(false); }}>
                  ⚙️ Settings
                </button>
                <button className="dropdown-item" onClick={() => { navigate('/admin/reports'); setShowDropdown(false); }}>
                  📈 Reports
                </button>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}