import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProvider } from './state.jsx';
import App from './App.jsx';
import './index.css';
import './dark-theme.css';
import './curriculum.css';

const app = <React.StrictMode><BrowserRouter><AppProvider><App /></AppProvider></BrowserRouter></React.StrictMode>;
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
createRoot(document.getElementById('root')).render(googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider> : app);
