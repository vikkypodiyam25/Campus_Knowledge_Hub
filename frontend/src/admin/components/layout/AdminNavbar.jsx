import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Search,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { ROLES } from '../../utils/constants';
import Breadcrumb from './Breadcrumb';

export const AdminNavbar = ({
  onToggleMobileMenu,
  onToggleCollapse,
  isCollapsed,
}) => {
  const { admin, role, setRole, theme, toggleTheme, logout } = useAdminAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const roleRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 transition-colors">
      {/* Left side: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right side: Role selector, Search, Theme toggle, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher Badge */}
        <div className="relative" ref={roleRef}>
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300"
            title="Switch demo role to test permission boundaries"
          >
            <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">{role}</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-slate-800 animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Role (Demo)
              </div>
              {Object.values(ROLES).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setRoleDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    role === r
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{r}</span>
                  {role === r && <CheckCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-slate-800 animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2 px-1">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Notifications & Alerts
                </span>
                <Link
                  to="/admin/notifications"
                  onClick={() => setNotifDropdownOpen(false)}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                <div className="rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    High Priority Moderation Report
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    Offensive language reported on doubt #q_999
                  </p>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 block">
                    10 mins ago
                  </span>
                </div>

                <div className="rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    New Live Session Scheduled
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    React Architecture Masterclass is pending approval
                  </p>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 block">
                    1 hour ago
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={admin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={admin?.name || 'Admin'}
              className="h-8 w-8 rounded-lg object-cover ring-2 ring-indigo-500/20"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {admin?.name || 'Vikky Podiyam'}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {role || 'Super Admin'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-slate-800 animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {admin?.name || 'Vikky Podiyam'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {admin?.email || 'vikkypodiyam25@navgurukul.org'}
                </p>
              </div>

              <Link
                to="/admin/settings"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>Admin Profile</span>
              </Link>

              <Link
                to="/admin/settings"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Account Settings</span>
              </Link>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
