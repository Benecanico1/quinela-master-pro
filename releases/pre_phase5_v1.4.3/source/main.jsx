import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#020617',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '400px',
            backgroundColor: '#0f172a',
            border: '1px solid #f59e0b',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ color: '#f59e0b', margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>
              Quiniela Master Pro
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Iniciando motor estadístico y de inteligencia artificial...
            </p>
            <button
              onClick={() => {
                try { localStorage.clear(); } catch(e) {}
                window.location.reload();
              }}
              style={{
                backgroundColor: '#f59e0b',
                color: '#020617',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Reiniciar Aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)
