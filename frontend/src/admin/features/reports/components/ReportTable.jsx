import React from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import { formatDate, formatRelativeTime } from '../../../utils/formatDate';
import { Eye, ShieldCheck, ShieldX, Trash2, AlertTriangle } from 'lucide-react';
import { REPORT_STATUS } from '../../../utils/constants';

export const ReportTable = ({
  reports = [],
  loading = false,
  sortConfig,
  onSort,
  onView,
  onResolve,
  onReject,
  onRemoveContent,
}) => {
  const columns = [
    {
      header: 'Reported Incident',
      accessor: 'title',
      sortable: true,
      render: (r) => (
        <div className="max-w-md">
          <span className="font-semibold text-slate-900 dark:text-white block hover:text-indigo-600 transition-colors line-clamp-1">
            {r.title}
          </span>
          <span className="text-xs text-rose-600/90 dark:text-rose-400 block truncate mt-0.5 font-mono">
            "{r.reportedContent}"
          </span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      render: (r) => (
        <span className="inline-flex items-center rounded-lg bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
          {r.category}
        </span>
      ),
    },
    {
      header: 'Reported User',
      render: (r) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
            {r.reportedUser?.name}
          </span>
          <span className="text-[10px] text-slate-400 block truncate">
            {r.reportedUser?.email}
          </span>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      render: (r) => <StatusBadge status={r.priority} />,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Reported On',
      accessor: 'createdAt',
      sortable: true,
      render: (r) => (
        <span className="text-xs text-slate-400">
          {formatRelativeTime(r.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onView(r)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Review Report Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {r.status !== REPORT_STATUS.RESOLVED && (
            <button
              type="button"
              onClick={() => onRemoveContent(r)}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Remove Content & Resolve"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {r.status !== REPORT_STATUS.RESOLVED && (
            <button
              type="button"
              onClick={() => onResolve(r.id)}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Mark as Resolved"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {r.status !== REPORT_STATUS.REJECTED && r.status !== REPORT_STATUS.RESOLVED && (
            <button
              type="button"
              onClick={() => onReject(r.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Dismiss / Reject Report"
            >
              <ShieldX className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <DataTable
        columns={columns}
        data={reports}
        isLoading={loading}
        sortConfig={sortConfig}
        onSort={onSort}
        onRowClick={(r) => onView(r)}
        emptyTitle="No moderation reports"
        emptyDescription="All peer reports and flagged content have been resolved!"
      />
    </div>
  );
};

export default ReportTable;
