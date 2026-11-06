import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Check, X } from 'lucide-react';
import { useApp } from './state.jsx';
import Shell from './components/layout/Shell.jsx';
import './reply-notification.css';

const Login = lazy(() => import('./pages/Login.jsx'));
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Explore = lazy(() => import('./pages/Explore.jsx'));
const Questions = lazy(() => import('./pages/Questions.jsx'));
const Discussions = lazy(() => import('./pages/Discussions.jsx'));
const Detail = lazy(() => import('./pages/Detail.jsx'));
const FormPage = lazy(() => import('./pages/FormPage.jsx'));
const Sessions = lazy(() => import('./pages/Sessions.jsx'));
const Bookmarks = lazy(() => import('./pages/Bookmarks.jsx'));
const Contributions = lazy(() => import('./pages/Contributions.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const SettingsPage = lazy(() => import('./pages/Settings.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const ChooseSubject = lazy(() => import('./pages/ChooseSubject.jsx'));
const SchoolItem = lazy(() => import('./pages/SchoolItem.jsx'));
const LearningOverview = lazy(() => import('./pages/LearningOverview.jsx'));

function WorkspaceRoutes() {
  return <Routes>
    <Route path="/dashboard" element={<Dashboard/>}/>
    <Route path="/explore" element={<Explore/>}/>
    <Route path="/questions" element={<Questions/>}/>
    <Route path="/ask" element={<FormPage type="question"/>}/>
    <Route path="/questions/:id" element={<Detail kind="question"/>}/>
    <Route path="/discussions" element={<Discussions/>}/>
    <Route path="/discussions/new" element={<FormPage type="discussion"/>}/>
    <Route path="/share-learning" element={<FormPage type="learning"/>}/>
    <Route path="/discussions/:id" element={<Detail kind="discussion"/>}/>
    <Route path="/sessions" element={<Sessions/>}/>
    <Route path="/sessions/new" element={<FormPage type="session"/>}/>
    <Route path="/sessions/:id" element={<Sessions/>}/>
    <Route path="/bookmarks" element={<Bookmarks/>}/>
    <Route path="/contributions" element={<Contributions/>}/>
    <Route path="/profile" element={<Profile/>}/>
    <Route path="/notifications" element={<Notifications/>}/>
    <Route path="/settings" element={<SettingsPage/>}/>
    <Route path="/choose-subject" element={<ChooseSubject/>}/>
    <Route path="/subjects/:subjectId" element={<SchoolItem kind="subject"/>}/>
    <Route path="/modules/:moduleId" element={<SchoolItem kind="module"/>}/>
    <Route path="/resources" element={<LearningOverview type="resources"/>}/>
    <Route path="/assignments" element={<LearningOverview type="assignments"/>}/>
    <Route path="/progress" element={<LearningOverview type="progress"/>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes>;
}

function UserProtectedWorkspace() {
  const location = useLocation();
  const { auth, data } = useApp();
  if (auth.status === 'checking') return <main className="login-page"><p>Connecting to LearnConnect…</p></main>;
  if (auth.status !== 'authenticated') return <Navigate to="/login" state={{ from: location }} replace/>;
  if (!data.profile?.subject && !['/dashboard', '/choose-subject'].includes(location.pathname)) return <Navigate to="/dashboard" replace/>;
  return <Shell><WorkspaceRoutes/></Shell>;
}

function ReplyNotificationPopup() {
  const { replyPopup, dismissReplyPopup } = useApp();
  const navigate = useNavigate();
  if (!replyPopup) return null;
  return <button className="reply-notification-popup" onClick={() => { dismissReplyPopup(); navigate(replyPopup.link || '/notifications'); }}>
    <span className="reply-notification-icon"><Bell size={18}/></span>
    <span className="reply-notification-copy"><b>{replyPopup.title}</b><small>{replyPopup.detail}</small></span>
    <span className="reply-notification-close" role="button" aria-label="Dismiss notification" onClick={event => { event.stopPropagation(); dismissReplyPopup(); }}><X size={16}/></span>
  </button>;
}

export default function App() {
  const { toast } = useApp();
  return <>
    <Suspense fallback={<main className="login-page"><p>Loading LearnConnect…</p></main>}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element={<Navigate to="/login" replace/>}/>
        <Route path="/*" element={<UserProtectedWorkspace/>}/>
      </Routes>
    </Suspense>
    {toast && <div className="toast"><span><Check size={15}/></span>{toast}</div>}
    <ReplyNotificationPopup />
  </>;
}
