import React, { useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowDownUp, ArrowLeft, ArrowRight, Bell, Bookmark, BookOpen, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Compass, Hash, Heart, Home, LogOut, Menu, MessageCircle, MessageSquare, MoreHorizontal, Moon, Plus, Search, Send, Settings, Sparkles, Sun, ThumbsUp, Users, X, Zap } from 'lucide-react';
import { useApp } from '../../state.jsx';
import { Avatar } from '../common/index.jsx';
const nav = [
  { title: 'OVERVIEW', items: [['Dashboard', '/dashboard', Home], ['My Curriculum', '/dashboard', BookOpen], ['Subjects', '/dashboard', Compass], ['Learning Resources', '/resources', Bookmark], ['Assignments', '/assignments', ClipboardList], ['My Progress', '/progress', Activity]] },
  { title: 'COMMUNITY', items: [['Explore', '/explore', Compass], ['My Doubts', '/questions', CircleHelp], ['Discussions', '/discussions', MessageCircle], ['Live Sessions', '/sessions', CalendarDays]] },
  { title: 'PERSONAL', items: [['Bookmarks', '/bookmarks', Bookmark], ['My Contributions', '/contributions', Activity], ['Profile', '/profile', Users], ['Notifications', '/notifications', Bell], ['Settings', '/settings', Settings]] }
];

function Brand() { return <Link to="/dashboard" className="brand"><span className="brand-mark"><Sparkles size={19}/></span><span>learn<span className="brand-accent">connect</span></span></Link>; }
export default function Shell({ children }) {
  const { data, api, mutate, notify, clearUserSession } = useApp(); const loc = useLocation(); const [open, setOpen] = useState(false); const [search, setSearch] = useState('');
  const title = [...nav.flatMap(s => s.items), ['Ask a Doubt','/ask',Plus], ['Create Discussion','/discussions/new',Plus], ['Create Session','/sessions/new',Plus]].find(x => x[1] === loc.pathname)?.[0] || (loc.pathname.startsWith('/questions/') ? 'Question details' : loc.pathname.startsWith('/discussions/') ? 'Discussion' : loc.pathname.startsWith('/sessions/') ? 'Session details' : 'Learn together');
  const go = useNavigate();
  const toggleTheme = async () => {
    const preferences = { ...data.preferences, dark: !data.preferences.dark };
    try { await mutate('preferences', 'updatePreferences', { payload: preferences }); }
    catch (error) { notify(error.message || 'Could not save appearance preference.'); }
  };
  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('learnconnect-user-session');
    sessionStorage.removeItem('learnconnect-user-session');
    localStorage.setItem('learnconnect_admin_user', JSON.stringify({ isAuthenticated: false, user: null, token: null }));
    clearUserSession();
    go('/login', { replace: true });
  };
  const doSearch = e => { if (e.key === 'Enter' && search.trim()) { go(`/explore?q=${encodeURIComponent(search)}`); setSearch(''); } };
  return <div className="app-shell">
    {open && <button className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open?'sidebar-open':''}`}><div className="sidebar-head"><Brand/><button className="icon-btn close-menu" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18}/></button></div><Link to="/choose-subject" className="workspace" title="Change learning path"><div className="workspace-logo">L</div><div><b>LearnConnect</b><small>{data.profile.subject || 'Choose your school'}</small></div><ChevronDown size={15}/></Link><nav className="side-nav">{nav.map(group=><div className="nav-group" key={group.title}><div className="nav-label">{group.title}</div>{group.items.map(([label,path,Icon])=><NavLink key={label} to={path} onClick={()=>setOpen(false)} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Icon size={17}/><span>{label}</span>{label==='Notifications'&&data.notifications.some(n=>!n.read)&&<i className="nav-dot"/>}</NavLink>)}</div>)}</nav><div className="sidebar-bottom"><div className="upgrade-card"><span className="upgrade-spark"><Zap size={15}/></span><b>Learning is better together</b><p>Every question is a chance to grow.</p><Link to="/explore">Explore the community <ArrowRight size={13}/></Link></div><button className="user-row" onClick={()=>go('/profile')}><Avatar initials="VP"/><span className="user-text"><b>{data.profile.name}</b><small>{data.profile.role}</small></span><MoreHorizontal size={17}/></button><button className="nav-link" onClick={logout} style={{width:'100%',marginTop:8,color:'var(--danger,#dc2626)'}}><LogOut size={17}/><span>Log out</span></button></div></aside>
    <div className="main-column"><header className="topbar"><div className="top-left"><button className="icon-btn menu-button" onClick={()=>setOpen(true)} aria-label="Open menu"><Menu size={20}/></button><span className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><b>{title}</b></span></div><div className="top-actions"><label className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={doSearch} placeholder="Search anything..."/><kbd>⌘ K</kbd></label><button className="top-icon theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${data.preferences.dark ? 'light' : 'dark'} mode`} title={`Switch to ${data.preferences.dark ? 'light' : 'dark'} mode`}>{data.preferences.dark ? <Sun size={18}/> : <Moon size={18}/>}</button><Link className="top-icon notification-top" to="/notifications" aria-label="Notifications"><Bell size={18}/>{data.notifications.some(n=>!n.read)&&<i/>}</Link><button className="top-profile" onClick={()=>go('/profile')}><Avatar initials="VP" size="sm"/><span>{data.profile.name}</span><ChevronDown size={14}/></button><button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={18}/></button></div></header><main className="page-area">{children}</main><footer className="footer"><span>© 2026 LearnConnect</span><span>Learn something. Share something. <span className="footer-heart">♥</span></span></footer></div>
  </div>;
}
