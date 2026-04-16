import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/forgotpassword.css';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authAPI.getSecurityQuestion({ email });
      if (result.success) {
        setSecurityQuestion(result.securityQuestion);
        setUserId(result.userId);
        setStep(2);
      } else setError(result.message);
    } catch {
      setError('Failed to retrieve security question');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authAPI.resetPasswordWithAnswer({
        userId,
        securityAnswer,
        newPassword: 'temp',
      });

      if (result.success) setStep(3);
      else setError(result.message);
    } catch {
      setError('Incorrect answer');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const result = await authAPI.resetPasswordWithAnswer({
        userId,
        securityAnswer,
        newPassword,
      });

      if (result.success) {
        setSuccess('Password updated successfully!');
        setTimeout(() => navigate('/login'), 1500);
      } else setError(result.message);
    } catch {
      setError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-container">

      <div className="fp-card">

        {/* HEADER */}
        <div className="fp-header">
          <h2>Reset your password</h2>
          <p>Secure your account in 3 simple steps</p>
        </div>

        {/* STEP INDICATOR */}
        <div className="fp-steps">
          <span className={step >= 1 ? 'active' : ''}>1</span>
          <span className={step >= 2 ? 'active' : ''}>2</span>
          <span className={step >= 3 ? 'active' : ''}>3</span>
        </div>

        {error && <div className="error-card">{error}</div>}
        {success && <div className="success-card">{success}</div>}

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="fp-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button className="primary-btn">
              {loading ? 'Checking...' : 'Continue'}
            </button>

            <p className="fp-link">
              <Link to="/login">Back to login</Link>
            </p>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="fp-form">
            <div className="question-box">
              {securityQuestion}
            </div>

            <input
              type="text"
              placeholder="Your answer"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
            />

            <button className="primary-btn">
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button type="button" className="secondary-btn" onClick={() => setStep(1)}>
              Back
            </button>
          </form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="fp-form">

            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button className="primary-btn">
              {loading ? 'Updating...' : 'Reset Password'}
            </button>

            <button type="button" className="secondary-btn" onClick={() => setStep(2)}>
              Back
            </button>
          </form>
        )}

      </div>
    </div>
  );
}