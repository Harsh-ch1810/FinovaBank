import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        
        {/* Left: Brand */}
        <Link to="/dashboard" className="navbar-brand">
          Finova
        </Link>

        {/* Center: Navigation */}
        <nav className="navbar-links">
          {!isAdmin ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/transfer">Send Money</Link>
              <Link to="/history">History</Link>
              <Link to="/apply-loan">Apply Loan</Link>
              <Link to="/my-loans">My Loans</Link>
            </>
          ) : (
            <>
              <Link to="/admin/dashboard">Users</Link>
              <Link to="/admin/transactions">Transactions</Link>
              <Link to="/admin/loans">Loan Requests</Link>
            </>
          )}
        </nav>

        {/* Right: User */}
        <div className="navbar-actions">
          <span className="navbar-user">{user.name}</span>
          <button className="btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
