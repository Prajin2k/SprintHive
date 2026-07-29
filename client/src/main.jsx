import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import App from './App.jsx';
import { store } from './store/store.js';
import { setupInterceptors } from './store/axiosSetup.js';
import './index.css';

// Wire up axios interceptors BEFORE the app renders.
// Passes the store reference so interceptors can read/dispatch auth state.
setupInterceptors(store);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e1e2a',
              color: '#f1f0f8',
              border: '1px solid #3a3a52',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#1e1e2a' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1e1e2a' },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
