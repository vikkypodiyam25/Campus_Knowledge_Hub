import React from 'react';
import { USER_STATUS } from '../../../utils/constants';
import { Check, X, Ban, ShieldAlert } from 'lucide-react';

export const UserStatusAction = ({ user, onUpdateStatus }) => {
  if (!user) return null;

  return (
    <div className="flex items-center gap-1.5">
      {user.status !== USER_STATUS.ACTIVE && (
        <button
          type="button"
          onClick={() => onUpdateStatus(user.id, USER_STATUS.ACTIVE)}
          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
          title="Activate Student"
        >
          <Check className="w-4 h-4" />
        </button>
      )}

      {user.status !== USER_STATUS.INACTIVE && (
        <button
          type="button"
          onClick={() => onUpdateStatus(user.id, USER_STATUS.INACTIVE)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Deactivate Student"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {user.status !== USER_STATUS.SUSPENDED && (
        <button
          type="button"
          onClick={() => onUpdateStatus(user.id, USER_STATUS.SUSPENDED)}
          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="Suspend Student"
        >
          <Ban className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default UserStatusAction;
