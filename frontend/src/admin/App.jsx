import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import AdminProtectedRoute from './routes/AdminProtectedRoute';

const AdminLogin = lazy(() => import('./features/auth/pages/AdminLogin'));
const Dashboard = lazy(() => import('./features/dashboard/pages/Dashboard'));
const Users = lazy(() => import('./features/users/pages/Users'));
const Questions = lazy(() => import('./features/questions/pages/Questions'));
const Discussions = lazy(() => import('./features/discussions/pages/Discussions'));
const Sessions = lazy(() => import('./features/sessions/pages/Sessions'));
const ContentOverview = lazy(() => import('./features/dashboard/pages/ContentOverview'));
const AssignmentSubmissions = lazy(() => import('./features/assignments/pages/AssignmentSubmissions'));

export default function App() {
  return <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm text-slate-500">Loading admin panel…</div>}>
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="" element={<Navigate to="dashboard" replace />} />
      <Route element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="questions" element={<Questions />} />
        <Route path="discussions" element={<Discussions />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="assignments" element={<AssignmentSubmissions />} />
        <Route path="reports" element={<ContentOverview mode="content" />} />
        <Route path="categories" element={<ContentOverview mode="store" />} />
        <Route path="notifications" element={<ContentOverview mode="content" />} />
        <Route path="analytics" element={<ContentOverview mode="content" />} />
        <Route path="settings" element={<ContentOverview mode="jobs" />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  </Suspense>;
}
