import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Sun, Moon, ChevronDown, User, Settings, LogOut, Search } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import Breadcrumb from './Breadcrumb';

export const AdminNavbar = ({ onToggleMobileMenu, onToggleCollapse, isCollapsed }) => {
  const { admin, role, theme, toggleTheme, logout } = useAdminAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 transition-colors">
    <div className="flex items-center gap-4">
      <button type="button" onClick={onToggleMobileMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden" title="Open Menu"><Menu className="h-5 w-5" /></button>
      <div className="hidden sm:block"><Breadcrumb /></div>
    </div>
    <div className="flex items-center gap-2 sm:gap-3">
      <button type="button" className="rounded-lg p-2 text-slate-400" title="Search is not configured" disabled><Search className="h-4 w-4" /></button>
      <button type="button" onClick={toggleTheme} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}</button>
      <div className="relative">
        <button type="button" onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          <img src={admin?.avatar || '/favicon.svg'} alt={admin?.name || 'Admin'} className="h-8 w-8 rounded-lg object-cover ring-2 ring-indigo-500/20" />
          <div className="hidden sm:flex flex-col text-left"><span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{admin?.name || 'Administrator'}</span><span className="text-[10px] font-medium text-slate-400">{role || 'Admin'}</span></div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
        </button>
        {profileOpen && <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-slate-800 z-50">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1"><p className="text-xs font-semibold text-slate-900 dark:text-white">{admin?.name || 'Administrator'}</p><p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{admin?.email}</p></div>
          <Link to="/admin/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"><User className="h-4 w-4 text-slate-400" />Admin profile</Link>
          <Link to="/admin/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"><Settings className="h-4 w-4 text-slate-400" />Account settings</Link>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><LogOut className="h-4 w-4" />Sign out</button>
        </div>}
      </div>
    </div>
  </header>;
};

export default AdminNavbar;
