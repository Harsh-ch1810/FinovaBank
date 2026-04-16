// src/components/ErrorBoundary.jsx - Catch all errors and prevent white screen
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows error UI instead of white screen
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log full error details for debugging
    console.error('🔴 ERROR BOUNDARY CAUGHT:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toLocaleTimeString(),
    });

    this.setState(prev => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // You could also log to external error tracking service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Optionally reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '40px',
              maxWidth: '600px',
              textAlign: 'center',
            }}
          >
            {/* Icon */}
            <div
              style={{
                fontSize: '64px',
                marginBottom: '20px',
              }}
            >
              ⚠️
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#dc3545',
                margin: '0 0 10px 0',
              }}
            >
              Oops! Something went wrong
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: '16px',
                color: '#666',
                margin: '0 0 20px 0',
                lineHeight: '1.6',
              }}
            >
              We encountered an unexpected error. Don't worry, our team is aware of this issue.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px',
                  textAlign: 'left',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                <p
                  style={{
                    fontSize: '12px',
                    color: '#666',
                    margin: '0 0 10px 0',
                    fontWeight: 'bold',
                  }}
                >
                  Error Details (Dev Only):
                </p>
                <pre
                  style={{
                    fontSize: '11px',
                    color: '#d32f2f',
                    margin: 0,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                </pre>

                {this.state.errorInfo && (
                  <details style={{ marginTop: '10px' }}>
                    <summary style={{ cursor: 'pointer', color: '#1976d2' }}>
                      Stack Trace
                    </summary>
                    <pre
                      style={{
                        fontSize: '10px',
                        color: '#666',
                        margin: '10px 0 0 0',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#0056b3';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#007bff';
                }}
              >
                🔄 Try Again
              </button>

              <button
                onClick={() => {
                  window.location.href = '/login';
                }}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#545b62';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#6c757d';
                }}
              >
                🏠 Go to Login
              </button>
            </div>

            {/* Error Count Info */}
            {this.state.errorCount > 3 && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#999',
                  margin: '20px 0 0 0',
                  paddingTop: '20px',
                  borderTop: '1px solid #eee',
                }}
              >
                ℹ️ This error has occurred {this.state.errorCount} times. 
                Please refresh your browser or contact support.
              </p>
            )}
          </div>
        </div>
      );
    }

    // Render normally if no error
    return this.props.children;
  }
}

export default ErrorBoundary;