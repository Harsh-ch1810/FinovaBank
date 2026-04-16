import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { getStates, getCitiesByState } from '../data/statesAndCities';
import '../styles/auth.css';

const Register = () => {
  const navigate = useNavigate();
  const formRef = useRef();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sameAddress, setSameAddress] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '',
    dateOfBirth: '', gender: '', maritalStatus: '',
    mobileNumber: '',
    occupation: '', annualIncome: '',
    panNumber: '', aadhaarNumber: '',
    currentStreet: '', currentCity: '', currentState: '', currentPostalCode: '',
    permanentStreet: '', permanentCity: '', permanentState: '', permanentPostalCode: '',
    securityQuestion: '',
    securityAnswer: '',
  });

  const states = getStates();
  const currentCities = formData.currentState ? getCitiesByState(formData.currentState) : [];
  const permanentCities = formData.permanentState ? getCitiesByState(formData.permanentState) : [];

  // ✅ Clean reset on mount — only reset the ref, not DOM hacking
  useEffect(() => {
    if (formRef.current) {
      formRef.current.reset();
    }
  }, []);

  // ✅ Field name → formData key mapping (renamed fields prevent browser autofill)
  const fieldMap = {
    register_email: 'email',
    new_password: 'password',
    new_confirm_password: 'confirmPassword',
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;

    if (name === 'sameAddress') {
      setSameAddress(checked);
      return;
    }

    // Map renamed HTML field names back to formData keys
    const key = fieldMap[name] || name;

    setFormData(prev => {
      const newData = { ...prev, [key]: value };
      if (key === 'currentState') newData.currentCity = '';
      if (key === 'permanentState') newData.permanentCity = '';
      return newData;
    });
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return setError('First name is required'), false;
    if (!formData.lastName.trim()) return setError('Last name is required'), false;
    if (!formData.email.trim()) return setError('Email is required'), false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setError('Please enter a valid email'), false;
    if (!formData.mobileNumber.trim()) return setError('Mobile number is required'), false;
    if (!/^\d{10}$/.test(formData.mobileNumber.replace(/\D/g, ''))) return setError('Please enter a valid 10-digit mobile number'), false;
    if (!formData.password) return setError('Password is required'), false;
    if (formData.password.length < 6) return setError('Password must be at least 6 characters'), false;
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match'), false;
    if (!formData.currentStreet.trim()) return setError('Current address street is required'), false;
    if (!formData.currentCity) return setError('Current city is required'), false;
    if (!formData.currentState) return setError('Current state is required'), false;
    if (!formData.currentPostalCode.trim()) return setError('Current postal code is required'), false;
    if (!sameAddress) {
      if (!formData.permanentStreet.trim()) return setError('Permanent address street is required'), false;
      if (!formData.permanentCity) return setError('Permanent city is required'), false;
      if (!formData.permanentState) return setError('Permanent state is required'), false;
      if (!formData.permanentPostalCode.trim()) return setError('Permanent postal code is required'), false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await authAPI.register({
        ...formData,
        currentAddress: {
          street: formData.currentStreet,
          city: formData.currentCity,
          state: formData.currentState,
          postalCode: formData.currentPostalCode,
        },
        permanentAddress: sameAddress
          ? {
              street: formData.currentStreet,
              city: formData.currentCity,
              state: formData.currentState,
              postalCode: formData.currentPostalCode,
            }
          : {
              street: formData.permanentStreet,
              city: formData.permanentCity,
              state: formData.permanentState,
              postalCode: formData.permanentPostalCode,
            },
      });

      if (response.success) navigate('/login');
      else setError(response.message);

    } catch {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container register">
      <div className="auth-card wide">

        <h2>Create Account</h2>
        {error && <div className="error-card">{error}</div>}

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="register-form"
          autoComplete="off"
        >

          {/* ✅ BASIC INFO */}
          <div className="form-card">
            <h3>Basic Info</h3>

            <div className="grid-2">
              <input
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                autoComplete="off"
              />
              <input
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                autoComplete="off"
              />
            </div>

            {/* ✅ FIX: renamed to register_email + readOnly trick */}
            <input
              name="register_email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="new-password"
              readOnly
              onFocus={e => e.target.removeAttribute('readOnly')}
            />

            <input
              name="mobileNumber"
              placeholder="Mobile Number (10 digits)"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              maxLength="10"
              autoComplete="off"
            />
          </div>

          {/* ✅ PERSONAL */}
          <div className="form-card">
            <h3>Personal</h3>

            <div className="grid-3">
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
              />

              <select name="gender" value={formData.gender} onChange={handleInputChange}>
                <option value="">Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>

              <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange}>
                <option value="">Marital Status</option>
                <option>Single</option>
                <option>Married</option>
                <option>Divorced</option>
                <option>Widowed</option>
              </select>
            </div>
          </div>

          {/* ✅ PROFESSIONAL */}
          <div className="form-card">
            <h3>Professional</h3>

            <div className="grid-2">
              <select name="occupation" value={formData.occupation} onChange={handleInputChange}>
                <option value="">Occupation</option>
                <option>Service</option>
                <option>Business</option>
                <option>Professional</option>
                <option>Student</option>
                <option>Homemaker</option>
                <option>Retired</option>
                <option>Agriculture</option>
                <option>Other</option>
              </select>

              <input
                name="annualIncome"
                placeholder="Annual Income (₹)"
                value={formData.annualIncome}
                onChange={handleInputChange}
                autoComplete="off"
              />
            </div>
          </div>

          {/* ✅ VERIFICATION */}
          <div className="form-card">
            <h3>Verification</h3>

            <div className="grid-2">
              <input
                name="panNumber"
                placeholder="PAN Number (ABCDE1234F)"
                value={formData.panNumber}
                onChange={handleInputChange}
                autoComplete="off"
              />
              <input
                name="aadhaarNumber"
                placeholder="Aadhaar Number (12 digits)"
                value={formData.aadhaarNumber}
                onChange={handleInputChange}
                autoComplete="off"
              />
            </div>
          </div>

          {/* ✅ CURRENT ADDRESS */}
          <div className="form-card">
            <h3>Current Address</h3>

            <input
              name="currentStreet"
              placeholder="Street Address"
              value={formData.currentStreet}
              onChange={handleInputChange}
              autoComplete="off"
            />

            <div className="grid-3">
              <select name="currentState" value={formData.currentState} onChange={handleInputChange}>
                <option value="">Select State *</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>

              <select
                name="currentCity"
                value={formData.currentCity}
                onChange={handleInputChange}
                disabled={!formData.currentState}
              >
                <option value="">
                  {!formData.currentState ? 'Select State First' : 'Select City *'}
                </option>
                {currentCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <input
                name="currentPostalCode"
                placeholder="Postal Code"
                value={formData.currentPostalCode}
                onChange={handleInputChange}
                autoComplete="off"
              />
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                name="sameAddress"
                checked={sameAddress}
                onChange={handleInputChange}
              />
              Same as current address
            </label>
          </div>

          {/* ✅ PERMANENT ADDRESS */}
          {!sameAddress && (
            <div className="form-card">
              <h3>Permanent Address</h3>

              <input
                name="permanentStreet"
                placeholder="Street Address"
                value={formData.permanentStreet}
                onChange={handleInputChange}
                autoComplete="off"
              />

              <div className="grid-3">
                <select name="permanentState" value={formData.permanentState} onChange={handleInputChange}>
                  <option value="">Select State *</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>

                <select
                  name="permanentCity"
                  value={formData.permanentCity}
                  onChange={handleInputChange}
                  disabled={!formData.permanentState}
                >
                  <option value="">
                    {!formData.permanentState ? 'Select State First' : 'Select City *'}
                  </option>
                  {permanentCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>

                <input
                  name="permanentPostalCode"
                  placeholder="Postal Code"
                  value={formData.permanentPostalCode}
                  onChange={handleInputChange}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {/* ✅ SECURITY */}
          <div className="form-card">
            <h3>Security</h3>

            <select name="securityQuestion" value={formData.securityQuestion} onChange={handleInputChange}>
              <option value="">Select Security Question</option>
              <option>What is your pet's name?</option>
              <option>What is the name of your first school?</option>
              <option>What is your favorite color?</option>
              <option>What city were you born in?</option>
            </select>

            <input
              name="securityAnswer"
              placeholder="Answer"
              value={formData.securityAnswer}
              onChange={handleInputChange}
              autoComplete="off"
            />

            <div className="grid-2">
              {/* ✅ FIX: renamed to new_password + autoComplete="new-password" */}
              <input
                type="password"
                name="new_password"
                placeholder="Password (Min 8 characters)"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="new-password"
              />

              {/* ✅ FIX: renamed to new_confirm_password + autoComplete="new-password" */}
              <input
                type="password"
                name="new_confirm_password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button className="primary-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Register;