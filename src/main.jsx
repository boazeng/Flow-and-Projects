import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// On version bump, force-remove any corrupted array keys so the app doesn't crash
const APP_VERSION = '2'
if (localStorage.getItem('app-version') !== APP_VERSION) {
  localStorage.removeItem('flow-expected-items')
  localStorage.removeItem('cashflow-categories')
  localStorage.setItem('app-version', APP_VERSION)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
