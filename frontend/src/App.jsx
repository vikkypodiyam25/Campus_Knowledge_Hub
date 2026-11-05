import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useApp } from './state.jsx';
import Shell from './components/layout/Shell.jsx';
import Login from './pages/Login.jsx';
import AdminApp from './admin/AdminApp.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Explore from './pages/Explore.jsx';
import Questions from './pages/Questions.jsx';
import Discussions from './pages/Discussions.jsx';
import Detail from './pages/Detail.jsx';
import FormPage from './pages/FormPage.jsx';
import Sessions from './pages/Sessions.jsx';
import Bookmarks from './pages/Bookmarks.jsx';
import Contributions from './pages/Contributions.jsx';
import Profile from './pages/Profile.jsx';
import Notifications from './pages/Notifications.jsx';
import SettingsPage from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

function WorkspaceRoutes() {
  return <Routes>
    <Route path="/dashboard" element={<Dashboard/>}/>
    <Route path="/explore" element={<Explore/>}/>
    <Route path="/questions" element={<Questions/>}/>
    <Route path="/ask" element={<FormPage type="question"/>}/>
    <Route path="/questions/:id" element={<Detail kind="question"/>}/>
    <Route path="/discussions" element={<Discussions/>}/>
    <Route path="/discussions/new" element={<FormPage type="discussion"/>}/>
    <Route path="/discussions/:id" element={<Detail kind="discussion"/>}/>
    <Route path="/sessions" element={<Sessions/>}/>
    <Route path="/sessions/new" element={<FormPage type="session"/>}/>
    <Route path="/sessions/:id" element={<Sessions/>}/>
    <Route path="/bookmarks" element={<Bookmarks/>}/>
    <Route path="/contributions" element={<Contributions/>}/>
    <Route path="/profile" element={<Profile/>}/>
    <Route path="/notifications" element={<Notifications/>}/>
    <Route path="/settings" element={<SettingsPage/>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes>;
}

function UserProtectedWorkspace() {
  const location = useLocation();
  const { auth } = useApp();
  if (auth.status === 'checking') return <main className="login-page"><p>Connecting to LearnConnect…</p></main>;
  if (auth.status !== 'authenticated') return <Navigate to="/login" state={{ from: location }} replace/>;
  return <Shell><WorkspaceRoutes/></Shell>;
}

export default function App() {
  const { toast } = useApp();
  return <>
    <Routes>
      <Route path="/admin/*" element={<AdminApp/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/" element={<Navigate to="/login" replace/>}/>
      <Route path="/*" element={<UserProtectedWorkspace/>}/>
    </Routes>
    {toast && <div className="toast"><span><Check size={15}/></span>{toast}</div>}
  </>;
}
