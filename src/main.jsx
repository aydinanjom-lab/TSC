import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import ErrorBoundary from './ErrorBoundary.jsx'

window.addEventListener('error', e => console.error('GlobalError:', e?.error || e))
window.addEventListener('unhandledrejection', e => console.error('UnhandledRejection:', e?.reason))

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
