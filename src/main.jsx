// Performance Timeline Polyfill / Guard against VM startTime crashes
if (typeof window !== 'undefined' && window.performance) {
  if (!window.performance.timing) {
    window.performance.timing = { navigationStart: Date.now() };
  }
  const originalGetEntries = window.performance.getEntriesByType;
  if (originalGetEntries) {
    window.performance.getEntriesByType = function (type) {
      try {
        const entries = originalGetEntries.call(window.performance, type);
        if (type === 'navigation' && (!entries || entries.length === 0)) {
          return [{
            startTime: 0,
            duration: 0,
            entryType: 'navigation',
            name: window.location.href
          }];
        }
        return entries || [];
      } catch {
        return [];
      }
    };
  }
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)