import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNames = {
  dashboard: 'Dashboard',
  users: 'User Management',
  questions: 'Doubt Management',
  doubts: 'Doubt Management',
  discussions: 'Discussion Management',
  sessions: 'Live Session Management',
  reports: 'Reports & Moderation',
  moderation: 'Moderation Queue',
  categories: 'Categories & Topics',
  notifications: 'Notifications & Announcements',
  analytics: 'Analytics',
  settings: 'Settings',
};

export const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.replace(/^\/admin/, '').split('/').filter(Boolean);

  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return (
      <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
        <Home className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
        <span>LearnConnect</span>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold">Dashboard</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
      <Link
        to="/admin/dashboard"
        className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span>Home</span>
      </Link>

      {pathnames.map((segment, index) => {
        const routeTo = `/admin/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
            {isLast ? (
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{name}</span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
