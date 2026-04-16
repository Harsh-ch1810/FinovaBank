// src/components/AdminNavbar.jsx - NARROW VERTICAL SIDEBAR
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/adminnavbar.css';

export default function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard' },
    { path: '/admin/loans', icon: '📋', label: 'Loans' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
    { path: '/admin/accounts', icon: '🏦', label: 'Accounts' },
    { path: '/admin/transactions', icon: '💳', label: 'Transactions' },
    { path: '/admin/fraud', icon: '🛡️', label: 'Fraud' },
    { path: '/admin/reports', icon: '📈', label: 'Reports' },
    { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <nav className="admin-navbar">
      {/* Logo */}
      <div className="navbar-brand">
        <div className="logo" onClick={() => navigate('/admin')} title="Go to Dashboard">
          🏦
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="navbar-menu">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`nav-link ${isActive(item.path)}`}
            onClick={() => navigate(item.path)}
            title={item.label}
            data-tooltip={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* User Section */}
      <div className="navbar-user">
        <div className="user-avatar" title={`${user?.firstName} (Admin)`}>
          {user?.firstName?.charAt(0).toUpperCase() || 'A'}
        </div>
        <button
          className="logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          🚪
        </button>
      </div>
    </nav>
  );
}