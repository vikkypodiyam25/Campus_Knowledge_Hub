import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import EmptyState from './EmptyState';
import { TableSkeleton } from './Loader';

export const DataTable = ({
  columns = [],
  data = [],
  sortConfig = { key: null, direction: 'asc' },
  onSort,
  onRowClick,
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching the specified criteria.',
  className = '',
}) => {
  if (isLoading) {
    return <TableSkeleton rows={5} cols={columns.length || 4} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const handleHeaderClick = (col) => {
    if (!col.sortable || !onSort) return;
    const key = col.accessor || col.sortKey;
    const isCurrent = sortConfig.key === key;
    const nextDirection = isCurrent && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    onSort({ key, direction: nextDirection });
  };

  return (
    <div className={`overflow-x-auto w-full ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50">
            {columns.map((col, idx) => {
              const sortKey = col.accessor || col.sortKey;
              const isSorted = sortConfig.key === sortKey;

              return (
                <th
                  key={idx}
                  onClick={() => handleHeaderClick(col)}
                  className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none ${
                    col.sortable ? 'cursor-pointer hover:text-slate-800 dark:hover:text-slate-200' : ''
                  } ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {isSorted ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
          {data.map((row, rIdx) => (
            <tr
              key={row.id || rIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors duration-100 ${
                onRowClick ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              {columns.map((col, cIdx) => {
                const cellValue = col.accessor ? row[col.accessor] : null;
                return (
                  <td key={cIdx} className={`py-3.5 px-4 text-slate-700 dark:text-slate-300 align-middle ${col.className || ''}`}>
                    {col.render ? col.render(row, rIdx) : cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
