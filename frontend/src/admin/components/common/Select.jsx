import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  className = '',
  id,
  required,
  disabled,
  placeholder,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`block w-full appearance-none rounded-lg text-sm border transition duration-150 ease-in-out pl-3.5 pr-10 py-2
            ${
              error
                ? 'border-rose-400 text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-slate-900 dark:text-rose-200'
                : 'border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
            }
            ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800' : 'bg-white'}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option, idx) => {
            const isObj = typeof option === 'object' && option !== null;
            const val = isObj ? option.value : option;
            const text = isObj ? option.label : option;
            return (
              <option key={idx} value={val}>
                {text}
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          {error ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
