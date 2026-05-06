/**
 * Application entry point
 * Renders the React app and registers the service worker for PWA support.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA offline support
serviceWorkerRegistration.register();

// Report web vitals for performance monitoring
reportWebVitals();
