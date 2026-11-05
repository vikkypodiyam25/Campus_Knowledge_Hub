import React from 'react';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import { formatDate, formatRelativeTime } from '../../../utils/formatDate';
import { Eye, Edit, Trash2, CheckCircle, ShieldAlert, ThumbsUp, MessageSquare } from 'lucide-react';
import { QUESTION_STATUS } from '../../../utils/constants';

export const QuestionTable = ({
  questions = [],
  loading = false,
  sortConfig,
  onSort,
  onView,
  onEdit,
  onResolve,
  onRemoveInappropriate,
  onDelete,
}) => {
  const columns = [
    {
      header: 'Doubt / Question',
      accessor: 'title',
      sortable: true,
      render: (q) => (
        <div className="max-w-md">
          <span className="font-semibold text-slate-900 dark:text-white block hover:text-indigo-600 transition-colors line-clamp-2">
            {q.title}
          </span>
          <span className="text-xs text-slate-400 block mt-0.5 line-clamp-1">
            {q.content}
          </span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      render: (q) => (
        <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          {q.category}
        </span>
      ),
    },
    {
      header: 'Author',
      render: (q) => (
        <div className="flex items-center gap-2">
          <img
            src={q.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={q.author?.name}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate">
              {q.author?.name}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Engagement',
      sortable: true,
      sortKey: 'upvotes',
      render: (q) => (
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
            <ThumbsUp className="w-3.5 h-3.5" />
            {q.upvotes || 0}
          </span>
          <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-3.5 h-3.5" />
            {q.answersCount || q.answers?.length || 0}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (q) => <StatusBadge status={q.status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (q) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onView(q)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Details & Answers"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(q)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit Question"
          >
            <Edit className="w-4 h-4" />
          </button>

          {q.status !== QUESTION_STATUS.RESOLVED && (
            <button
              type="button"
              onClick={() => onResolve(q.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Mark as Resolved"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {q.status !== QUESTION_STATUS.REMOVED && (
            <button
              type="button"
              onClick={() => onRemoveInappropriate(q)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              title="Remove as Inappropriate"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(q)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Question"
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
        data={questions}
        isLoading={loading}
        sortConfig={sortConfig}
        onSort={onSort}
        onRowClick={(q) => onView(q)}
        emptyTitle="No questions found"
        emptyDescription="No questions match the current search or category filter."
      />
    </div>
  );
};

export default QuestionTable;
