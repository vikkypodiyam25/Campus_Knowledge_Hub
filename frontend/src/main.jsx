import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProvider } from './state.jsx';
import App from './App.jsx';
import api from './api.js';
import GoogleAuthContext from './googleAuthContext.js';
import './index.css';
import './dark-theme.css';
import './curriculum.css';

const buildClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

function RootApp() {
  const [googleConfig, setGoogleConfig] = useState({ clientId: buildClientId, loading: true });

  useEffect(() => {
    let active = true;
    api.get('/auth/config', { timeout: 5000 })
      .then(response => {
        const serverClientId = String(response?.data?.googleClientId || '').trim();
        if (active) setGoogleConfig({ clientId: serverClientId || buildClientId, loading: false });
      })
      .catch(() => {
        if (active) setGoogleConfig({ clientId: buildClientId, loading: false });
      });
    return () => { active = false; };
  }, []);

  const app = <React.StrictMode><BrowserRouter><AppProvider><App /></AppProvider></BrowserRouter></React.StrictMode>;
  return <GoogleAuthContext.Provider value={googleConfig}>
    {googleConfig.clientId ? <GoogleOAuthProvider clientId={googleConfig.clientId}>{app}</GoogleOAuthProvider> : app}
  </GoogleAuthContext.Provider>;
}

createRoot(document.getElementById('root')).render(<RootApp />);
