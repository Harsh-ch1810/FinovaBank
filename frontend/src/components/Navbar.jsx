// src/components/Navbar.jsx - Updated with Admin Links
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "../styles/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // ✅ Hide navbar on login page
  if (location.pathname === "/login" || location.pathname === "/admin-login") {
    return null;
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* LOGO */}
        <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} className="navbar-logo">
          <span className="logo-icon">🏦</span>
          Finova
        </Link>

        {/* MENU */}
        <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {user && (
            <>
              <li>
                <Link 
                  to={isAdmin ? "/admin/dashboard" : "/dashboard"} 
                  className="nav-link"
                >
                  Dashboard
                </Link>
              </li>

              {!isAdmin && (
                <>
                  <li><Link to="/transfer" className="nav-link">Transfer</Link></li>
                  <li><Link to="/transactions" className="nav-link">Transactions</Link></li>
                  <li><Link to="/apply-loan" className="nav-link">Apply Loan</Link></li>
                  <li><Link to="/my-loans" className="nav-link">My Loans</Link></li>
                </>
              )}

              {isAdmin && (
                <>
                  <li><Link to="/admin/loans" className="nav-link">Loans</Link></li>
                  <li><Link to="/admin/transactions" className="nav-link">Transactions</Link></li>
                  <li><Link to="/admin/users" className="nav-link">Users</Link></li>
                </>
              )}
            </>
          )}
        </ul>

        {/* RIGHT SIDE */}
        {user && (
          <div className="nav-right">
            <div className="user-chip">
              👤 {user.firstName}
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>

            {/* MOBILE MENU */}
            <div
              className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}