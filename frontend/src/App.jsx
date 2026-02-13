import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Pages - Auth
import Login from './pages/Login';
import Register from './pages/Register';

// Pages - User
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import TransactionHistory from './pages/TransactionHistory';
import ApplyLoan from './pages/ApplyLoan';
import MyLoans from './pages/MyLoans';

// Pages - Admin
import AdminDashboard from './pages/AdminDashboard';
import AdminTransactions from './pages/AdminTransactions';
import AdminLoans from './pages/AdminLoans';

// Styles
// import './styles/redesign.css';
import './styles/base.css';
import './styles/navbar.css';
import './styles/dashboard.css';
import './styles/auth.css';
import './styles/transfer.css';
import './styles/loan.css';
import './styles/admin.css';


function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="loading">
        Loading...
      </div>
    );
  }

  return (
    <Router>
      {user && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

        {/* User Routes (Protected) */}
        <Route
          path="/dashboard"
          element={<PrivateRoute component={Dashboard} requiredRole="customer" />}
        />
        <Route
          path="/transfer"
          element={<PrivateRoute component={Transfer} requiredRole="customer" />}
        />
        <Route
          path="/history"
          element={<PrivateRoute component={TransactionHistory} requiredRole="customer" />}
        />
        <Route
          path="/apply-loan"
          element={<PrivateRoute component={ApplyLoan} requiredRole="customer" />}
        />
        <Route
          path="/my-loans"
          element={<PrivateRoute component={MyLoans} requiredRole="customer" />}
        />

        {/* Admin Routes (Protected) */}
        <Route
          path="/admin/dashboard"
          element={<PrivateRoute component={AdminDashboard} requiredRole="admin" />}
        />
        <Route
          path="/admin/transactions"
          element={<PrivateRoute component={AdminTransactions} requiredRole="admin" />}
        />
        <Route
          path="/admin/loans"
          element={<PrivateRoute component={AdminLoans} requiredRole="admin" />}
        />

        {/* Default Routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;