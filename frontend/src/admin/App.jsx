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
import ContentOverview from './features/dashboard/pages/ContentOverview';
import AssignmentSubmissions from './features/assignments/pages/AssignmentSubmissions';

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
      <Route path="assignments" element={<AssignmentSubmissions />} />
      <Route path="reports" element={<ContentOverview mode="content" />} />
      <Route path="categories" element={<ContentOverview mode="store" />} />
      <Route path="notifications" element={<ContentOverview mode="content" />} />
      <Route path="analytics" element={<ContentOverview mode="content" />} />
      <Route path="settings" element={<ContentOverview mode="jobs" />} />
    </Route>
    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
  </Routes>;
}
