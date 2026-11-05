import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { canAccessRoute } from '../utils/permissions';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, role } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check role-based route access
  const adminPath = location.pathname.replace(/^\/admin(?=\/|$)/, '') || '/';
  const isAllowed = canAccessRoute(role, adminPath);

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Access Restricted
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Your active role (<span className="font-semibold text-indigo-600 dark:text-indigo-400">{role}</span>) does not have sufficient permissions to view this section.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Tip: You can switch roles using the demo badge at the top right of the navigation bar.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Link to="/admin/dashboard">
            <Button variant="secondary" size="md" leftIcon={ArrowLeft}>
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminProtectedRoute;
