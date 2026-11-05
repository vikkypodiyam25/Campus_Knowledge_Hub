import React from 'react';
import { Check, Ban } from 'lucide-react';

export const UserStatusAction = ({ user, onUpdateStatus }) => {
  if (!user) return null;

  return (
    <div className="flex items-center gap-1.5">
      {user.status !== 'Active' && (
        <button
          type="button"
          onClick={() => onUpdateStatus(user.id, 'Active')}
          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
          title="Activate Student"
        >
          <Check className="w-4 h-4" />
        </button>
      )}

      {user.status !== 'Suspended' && (
        <button
          type="button"
          onClick={() => onUpdateStatus(user.id, 'Suspended')}
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
