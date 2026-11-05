import React from 'react';
import SearchBar from '../../../components/common/SearchBar';
import Select from '../../../components/common/Select';
import { USER_STATUS } from '../../../utils/constants';

export const UserFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <SearchBar
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange('')}
        placeholder="Search students by name, email, batch, or skill..."
        className="max-w-md w-full"
      />

      <div className="flex items-center gap-3">
        <div className="w-36">
          <Select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: USER_STATUS.ACTIVE, label: 'Active' },
              { value: USER_STATUS.INACTIVE, label: 'Inactive' },
              { value: USER_STATUS.SUSPENDED, label: 'Suspended' },
            ]}
          />
        </div>

        <div className="w-44">
          <Select
            value={`${sortBy.key}-${sortBy.direction}`}
            onChange={(e) => {
              const [key, direction] = e.target.value.split('-');
              onSortChange({ key, direction });
            }}
            options={[
              { value: 'joinedDate-desc', label: 'Newest First' },
              { value: 'joinedDate-asc', label: 'Oldest First' },
              { value: 'name-asc', label: 'Name (A to Z)' },
              { value: 'name-desc', label: 'Name (Z to A)' },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default UserFilters;
