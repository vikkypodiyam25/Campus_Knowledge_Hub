import React from 'react';
import DataTable from '../../../components/common/DataTable';
import { formatDate, formatRelativeTime } from '../../../utils/formatDate';
import { Eye, Edit, Trash2, Pin, EyeOff, ThumbsUp, MessageSquare } from 'lucide-react';

export const DiscussionTable = ({
  discussions = [],
  loading = false,
  sortConfig,
  onSort,
  onView,
  onEdit,
  onTogglePin,
  onToggleHide,
  onDelete,
}) => {
  const columns = [
    {
      header: 'Discussion Thread',
      accessor: 'title',
      sortable: true,
      render: (d) => (
        <div className="max-w-md">
          <div className="flex items-center gap-1.5 mb-1">
            {d.isPinned && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                <Pin className="w-2.5 h-2.5 fill-current" />
                PINNED
              </span>
            )}
            {d.isHidden && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400">
                <EyeOff className="w-2.5 h-2.5" />
                HIDDEN
              </span>
            )}
          </div>
          <span className="font-semibold text-slate-900 dark:text-white block hover:text-indigo-600 transition-colors line-clamp-1">
            {d.title}
          </span>
          <span className="text-xs text-slate-400 block truncate mt-0.5">
            {d.content}
          </span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      render: (d) => (
        <span className="inline-flex items-center rounded-lg bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
          {d.category}
        </span>
      ),
    },
    {
      header: 'Author',
      render: (d) => (
        <div className="flex items-center gap-2">
          <img
            src={d.author?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
            alt={d.author?.name}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate">
              {d.author?.name}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {d.author?.role || 'Student'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Community Pulse',
      render: (d) => (
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
            <ThumbsUp className="w-3.5 h-3.5" />
            {d.likes || 0}
          </span>
          <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-3.5 h-3.5" />
            {d.commentsCount || 0}
          </span>
        </div>
      ),
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      sortable: true,
      render: (d) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(d.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onView(d)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(d)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit Discussion"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onTogglePin(d.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              d.isPinned
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={d.isPinned ? 'Unpin Discussion' : 'Pin to Top'}
          >
            <Pin className={`w-4 h-4 ${d.isPinned ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onToggleHide(d.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              d.isHidden
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                : 'text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={d.isHidden ? 'Make Visible' : 'Hide from Feed'}
          >
            <EyeOff className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(d)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Discussion"
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
        data={discussions}
        isLoading={loading}
        sortConfig={sortConfig}
        onSort={onSort}
        onRowClick={(d) => onView(d)}
        emptyTitle="No discussions found"
        emptyDescription="No discussion threads found matching your filters."
      />
    </div>
  );
};

export default DiscussionTable;
