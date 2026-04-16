// src/components/AdminPageWrapper.jsx - Wrapper for admin pages
import React from 'react';
import '../styles/dashboard.css';

/**
 * Wrapper component to show admin pages with dashboard-like styling
 * Use this to wrap admin page content
 */
export default function AdminPageWrapper({ children, title, subtitle }) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        {/* Header Section */}
        {(title || subtitle) && (
          <div className="welcome-section" style={{ marginBottom: '24px' }}>
            <div>
              {title && <h1>{title}</h1>}
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}