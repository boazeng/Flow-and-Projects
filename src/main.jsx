import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { bootstrapFromServer } from './serverSync'

// Pull central state into localStorage before rendering, so components read the
// shared server data on first paint. Always resolves (falls back to local).
bootstrapFromServer().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
