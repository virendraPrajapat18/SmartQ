/**
 * ============================================================================
 * REACT ENTRY POINT (main.jsx)
 * ============================================================================
 * Bootstraps the React application and attaches it to the root DOM node.
 * Applies React.StrictMode to identify potential problems during development.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
