import React from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import UserStatusAction from './UserStatusAction';
import { formatDate } from '../../../utils/formatDate';
import { Eye, Edit, Trash2 } from 'lucide-react';

export const UserTable = ({
  users = [],
  loading = false,
  sortConfig,
  onSort,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onUpdateStatus,
}) => {
  const columns = [
    {
      header: 'Student',
      accessor: 'name',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
          />
          <div className="min-w-0">
            <span className="font-semibold text-slate-900 dark:text-white block truncate">
              {user.name}
            </span>
            <span className="text-xs text-slate-400 block truncate">
              {user.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Batch',
      accessor: 'batch',
      sortable: true,
      render: (user) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {user.batch || 'Batch 2024'}
        </span>
      ),
    },
    {
      header: 'Activity',
      render: (user) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            {user.stats?.questions || 0} Q
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {user.stats?.answers || 0} A
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      header: 'Joined Date',
      accessor: 'joinedDate',
      sortable: true,
      render: (user) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(user.joinedDate)}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (user) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onViewUser(user)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Profile Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onEditUser(user)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit Student Info"
          >
            <Edit className="w-4 h-4" />
          </button>

          <UserStatusAction user={user} onUpdateStatus={onUpdateStatus} />

          <button
            type="button"
            onClick={() => onDeleteUser(user)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Student"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        sortConfig={sortConfig}
        onSort={onSort}
        onRowClick={(user) => onViewUser(user)}
        emptyTitle="No students found"
        emptyDescription="No registered students match your current filter or search criteria."
      />
    </div>
  );
};

export default UserTable;
