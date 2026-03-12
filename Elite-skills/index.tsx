import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './state/AuthContext';
import { RealtimeProvider } from './state/RealtimeContext';
import { ContactProvider } from './state/ContactContext';
import App from './App';
import './ats-styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <ContactProvider>
            <App />
          </ContactProvider>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
