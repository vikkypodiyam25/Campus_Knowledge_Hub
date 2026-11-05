import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  MessageSquare,
  Video,
  ShieldAlert,
  FolderTree,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { SIDEBAR_ITEMS } from '../../data/sidebarItems';
import { useAdminAuth } from '../../hooks/useAdminAuth';

const iconMap = {
  LayoutDashboard,
  Users,
  HelpCircle,
  MessageSquare,
  Video,
  ShieldAlert,
  FolderTree,
  Bell,
  BarChart3,
  Settings,
};

export const AdminSidebar = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { admin, role, logout, badgeCounts, checkPermission } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-300 dark:bg-slate-950 border-r border-slate-800">
      {/* Brand & Logo Header */}
      <div>
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
          <NavLink to="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-white text-base leading-tight">
                  LearnConnect
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-400">
                  Admin Console
                </span>
              </div>
            )}
          </NavLink>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 px-3 py-4 overflow-y-auto max-h-[calc(100vh-170px)]">
          {SIDEBAR_ITEMS.map((item) => {
            // Check permission if specified
            if (item.permission && !checkPermission(item.permission)) {
              return null;
            }

            const IconComponent = iconMap[item.icon] || LayoutDashboard;
            const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : null;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <IconComponent className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105`} />
                {!isCollapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!isCollapsed && badgeCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Admin Profile & Logout Footer */}
      <div className="border-t border-slate-800 p-3">
        <div
          className={`flex items-center gap-3 rounded-xl p-2 bg-slate-800/40 hover:bg-slate-800/80 transition-colors ${
            isCollapsed ? 'justify-center p-1.5' : ''
          }`}
        >
          <img
            src={admin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={admin?.name || 'Admin'}
            className="h-9 w-9 shrink-0 rounded-lg object-cover ring-2 ring-indigo-500/30"
          />
          {!isCollapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-xs font-semibold text-white">
                {admin?.name || 'Vikky Podiyam'}
              </span>
              <span className="truncate text-[10px] text-indigo-400 font-medium">
                {role || 'Super Admin'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className={`text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10 ${
              isCollapsed ? 'hidden' : 'block'
            }`}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>
    </>
  );
};

export default AdminSidebar;
