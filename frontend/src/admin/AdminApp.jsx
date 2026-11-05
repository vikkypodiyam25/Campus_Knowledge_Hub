import React from 'react';
import AdminAuthProvider from './context/AdminAuthContext.jsx';
import AdminRoutes from './App.jsx';
import './index.css';

export default function AdminApp() {
  return <AdminAuthProvider><AdminRoutes/></AdminAuthProvider>;
}
