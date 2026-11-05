import React from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import { formatDate, formatDateTime } from '../../../utils/formatDate';
import { Eye, Edit, Trash2, CheckCircle2, XCircle, Users, ExternalLink } from 'lucide-react';
import { SESSION_STATUS } from '../../../utils/constants';

export const SessionTable = ({
  sessions = [],
  loading = false,
  sortConfig,
  onSort,
  onView,
  onEdit,
  onApprove,
  onCancelSession,
  onDelete,
}) => {
  const columns = [
    {
      header: 'Live Session & Cohort',
      accessor: 'title',
      sortable: true,
      render: (s) => (
        <div className="max-w-md">
          <span className="font-semibold text-slate-900 dark:text-white block hover:text-indigo-600 transition-colors line-clamp-1">
            {s.title}
          </span>
          <span className="text-xs text-slate-400 block truncate mt-0.5">
            {s.description}
          </span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      render: (s) => (
        <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          {s.category}
        </span>
      ),
    },
    {
      header: 'Host & Mentor',
      render: (s) => (
        <div className="flex items-center gap-2">
          <img
            src={s.host?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={s.host?.name}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate">
              {s.host?.name}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {s.host?.role || 'Host'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Scheduled Time',
      accessor: 'scheduledDate',
      sortable: true,
      render: (s) => (
        <div className="text-xs">
          <span className="font-medium text-slate-800 dark:text-slate-200 block">
            {formatDateTime(s.scheduledDate)}
          </span>
          <span className="text-slate-400 block text-[10px]">
            Duration: {s.duration}
          </span>
        </div>
      ),
    },
    {
      header: 'Attendance',
      render: (s) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <Users className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            {s.participantsCount || 0} / {s.maxCapacity || 100}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onView(s)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Session Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(s)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit Session"
          >
            <Edit className="w-4 h-4" />
          </button>

          {s.status === SESSION_STATUS.UPCOMING && (
            <button
              type="button"
              onClick={() => onApprove(s.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Launch / Mark Ongoing"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {s.status !== SESSION_STATUS.CANCELLED && s.status !== SESSION_STATUS.COMPLETED && (
            <button
              type="button"
              onClick={() => onCancelSession(s)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              title="Cancel Live Session"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(s)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Session"
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
        data={sessions}
        isLoading={loading}
        sortConfig={sortConfig}
        onSort={onSort}
        onRowClick={(s) => onView(s)}
        emptyTitle="No live sessions found"
        emptyDescription="There are no sessions matching your selected tab or search query."
      />
    </div>
  );
};

export default SessionTable;
