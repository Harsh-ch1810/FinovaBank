// src/App.jsx - FIXED (Proper Admin vs User Dashboard Routing)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Pages - Auth
import Register from './pages/Register';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import ForgotPassword from './pages/ForgotPassword';

// Pages - User
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import TransactionHistory from './pages/TransactionHistory';
import ApplyLoan from './pages/ApplyLoan';
import MyLoans from './pages/MyLoans';

// NEW FEATURES
import QuickTransfer from './pages/QuickTransfer';
import FinovaCash from './pages/FinovaCash';
import Insurance from './pages/Insurance';

// BANKING SERVICES
import Cards from './pages/Cards';
import Investments from './pages/Investments';
import SavingsGoal from './pages/SavingsGoal';
import MobileRecharge from './pages/MobileRecharge';

// Pages - Admin
import AdminDashboard from './pages/AdminDashboard';
import AdminLoans from './pages/AdminLoans';
import AdminUsers from './pages/AdminUsers';
import AdminAccounts from './pages/AdminAccounts';
import AdminTransactions from './pages/AdminTransactions';
import AdminFraudDetection from './pages/AdminFraudDetection';
import AdminSettings from './pages/AdminSettings';
import AdminReports from './pages/AdminReports';

import './App.css';

// 🔥 Layout Controller (handles navbar visibility)
function Layout() {
  const location = useLocation();

  // Routes where navbar should be hidden
  const hideNavbarRoutes = ['/login', '/admin-login', '/register', '/forgot-password'];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  // ✅ Check if current route is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {/* ✅ Show main Navbar ONLY on non-admin user routes */}
      {!shouldHideNavbar && !isAdminRoute && <Navbar />}

      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ==================== USER ROUTES ==================== */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/transfer" element={<PrivateRoute><Transfer /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
        <Route path="/apply-loan" element={<PrivateRoute><ApplyLoan /></PrivateRoute>} />
        <Route path="/my-loans" element={<PrivateRoute><MyLoans /></PrivateRoute>} />

        {/* NEW FEATURES */}
        <Route path="/quick-transfer" element={<PrivateRoute><QuickTransfer /></PrivateRoute>} />
        <Route path="/finova-cash" element={<PrivateRoute><FinovaCash /></PrivateRoute>} />
        <Route path="/insurance" element={<PrivateRoute><Insurance /></PrivateRoute>} />

        {/* BANKING SERVICES */}
        <Route path="/cards" element={<PrivateRoute><Cards /></PrivateRoute>} />
        <Route path="/investments" element={<PrivateRoute><Investments /></PrivateRoute>} />
        <Route path="/savings-goal" element={<PrivateRoute><SavingsGoal /></PrivateRoute>} />
        <Route path="/mobile-recharge" element={<PrivateRoute><MobileRecharge /></PrivateRoute>} />

        {/* ==================== ADMIN ROUTES ==================== */}
        {/* Main Admin Dashboard */}
        <Route 
          path="/admin/dashboard" 
          element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} 
        />

        {/* Admin Sub-pages */}
        <Route 
          path="/admin/loans" 
          element={<PrivateRoute requiredRole="admin"><AdminLoans /></PrivateRoute>} 
        />
        <Route 
          path="/admin/users" 
          element={<PrivateRoute requiredRole="admin"><AdminUsers /></PrivateRoute>} 
        />
        <Route 
          path="/admin/accounts" 
          element={<PrivateRoute requiredRole="admin"><AdminAccounts /></PrivateRoute>} 
        />
        <Route 
          path="/admin/transactions" 
          element={<PrivateRoute requiredRole="admin"><AdminTransactions /></PrivateRoute>} 
        />
        <Route 
          path="/admin/fraud" 
          element={<PrivateRoute requiredRole="admin"><AdminFraudDetection /></PrivateRoute>} 
        />
        <Route 
          path="/admin/settings" 
          element={<PrivateRoute requiredRole="admin"><AdminSettings /></PrivateRoute>} 
        />
        <Route 
          path="/admin/reports" 
          element={<PrivateRoute requiredRole="admin"><AdminReports /></PrivateRoute>} 
        />

        {/* ==================== DEFAULT REDIRECTS ==================== */}
        {/* Root path - redirects based on user role */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Catch-all - redirects to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

// 🔥 Main App with Error Boundary
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;