import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({
  size = 'md',
  message = 'Loading...',
  fullScreen = false,
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 text-slate-500 dark:text-slate-400 ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-indigo-600 dark:text-indigo-400`} />
      {message && <p className="text-sm font-medium animate-pulse">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full animate-pulse p-4 space-y-4">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-md flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Loader;
