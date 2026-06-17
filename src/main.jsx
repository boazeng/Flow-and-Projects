import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Fix corrupted localStorage array values before app mounts
;['flow-expected-items', 'cashflow-categories'].forEach((key) => {
  try {
    const val = localStorage.getItem(key)
    if (val !== null && !Array.isArray(JSON.parse(val))) localStorage.removeItem(key)
  } catch {
    localStorage.removeItem(key)
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
