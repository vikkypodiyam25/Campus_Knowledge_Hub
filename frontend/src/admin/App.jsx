import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import AdminProtectedRoute from './routes/AdminProtectedRoute';
import AdminLogin from './features/auth/pages/AdminLogin';
import Dashboard from './features/dashboard/pages/Dashboard';
import Users from './features/users/pages/Users';
import Questions from './features/questions/pages/Questions';
import Discussions from './features/discussions/pages/Discussions';
import Sessions from './features/sessions/pages/Sessions';

function AdminPlaceholder({ title }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">LearnConnect admin</p><h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{title}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This section is ready for its management tools.</p></section>;
}

export default function App() {
  return <Routes>
    <Route path="login" element={<AdminLogin />} />
    <Route path="" element={<Navigate to="dashboard" replace />} />
    <Route element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="users" element={<Users />} />
      <Route path="questions" element={<Questions />} />
      <Route path="discussions" element={<Discussions />} />
      <Route path="sessions" element={<Sessions />} />
      <Route path="reports" element={<AdminPlaceholder title="Reports & Moderation" />} />
      <Route path="categories" element={<AdminPlaceholder title="Categories & Topics" />} />
      <Route path="notifications" element={<AdminPlaceholder title="Notifications" />} />
      <Route path="analytics" element={<AdminPlaceholder title="Analytics" />} />
      <Route path="settings" element={<AdminPlaceholder title="Settings" />} />
    </Route>
    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
  </Routes>;
}
