import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Simple Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', background: '#1a1a1a', height: '100vh' }}>
          <h1>Something went wrong.</h1>
          <p>Please check the console for details.</p>
          <pre style={{ color: '#ff6b6b', overflow: 'auto' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          {this.state.error && this.state.error.toString().includes("Firebase") && (
             <p style={{ marginTop: '20px', color: '#fbbf24' }}>
               <strong>Hint:</strong> It looks like a Firebase error. Did you add the Environment Variables in Vercel?
             </p>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

import React from 'react';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
