import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const formRef = useRef();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔥 HARD RESET ON LOAD (kills autofill)
  useEffect(() => {
    setFormData({ email: '', password: '' });

    // Reset actual DOM inputs
    if (formRef.current) {
      formRef.current.reset();
    }

    // Force clear any autofill values
    document.querySelectorAll('input').forEach((input) => {
      input.value = '';
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please enter email and password');
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Login failed');
    }

    setLoading(false);
  };

  const fillTestUser = () => {
    setFormData({
      email: 'test@example.com',
      password: 'Test@1234',
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '1px',
              color: '#FF385C',
            }}
          >
            Finova
          </div>
        </div>

        {/* HEADER */}
        <div className="auth-header" style={{ textAlign: 'center' }}>
          <h2>Welcome back 👋</h2>
          <p>Login to your Finova account</p>
        </div>

        {/* ERROR */}
        {error && <div className="error-card">{error}</div>}

        {/* FORM */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="auth-form"
          autoComplete="new-password"
        >
          {/* Hidden inputs to block autofill */}
          <input
            type="text"
            name="fake-email"
            autoComplete="off"
            style={{ display: 'none' }}
          />
          <input
            type="password"
            name="fake-password"
            autoComplete="new-password"
            style={{ display: 'none' }}
          />

          {/* EMAIL */}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="finova_secure_email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter your email"
              autoComplete="off"
            />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="finova_secure_password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Enter your password"
              autoComplete="new-password"
            />
          </div>

          {/* BUTTON */}
          <button className="primary-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* LINKS */}
        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        {/* TEST BUTTON */}
        <button className="secondary-btn" onClick={fillTestUser}>
          Use Test Account
        </button>

        {/* FOOTER */}
        <p className="auth-footer">
          Don’t have an account? <Link to="/register">Sign up</Link>
        </p>

      </div>
    </div>
  );
}