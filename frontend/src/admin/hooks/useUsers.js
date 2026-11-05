import { useState, useEffect, useMemo } from 'react';
import userService from '../features/users/userService';
import { useDebounce } from './useDebounce';
import toast from 'react-hot-toast';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState({ key: 'joinedDate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const debouncedSearch = useDebounce(searchTerm, 250);

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const handleStorageUpdate = (e) => {
      if (e.detail?.key?.includes('users')) {
        fetchUsers();
      }
    };
    window.addEventListener('learnconnect_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('learnconnect_storage_update', handleStorageUpdate);
  }, []);

  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Status filter
    if (statusFilter && statusFilter !== 'All') {
      result = result.filter(u => u.status === statusFilter);
    }

    // Search query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        u =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.batch?.toLowerCase().includes(q) ||
          u.skills?.some(s => s.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortBy.key];
      let valB = b[sortBy.key];

      if (sortBy.key === 'joinedDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, debouncedSearch, statusFilter, sortBy]);

  // Paginated slice
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;

  // Actions
  const handleUpdateStatus = async (id, newStatus) => {
    const updated = await userService.updateStatus(id, newStatus);
    if (updated) {
      toast.success(`Student status changed to ${newStatus}`);
      fetchUsers();
    }
  };

  const handleDeleteUser = async (id) => {
    const success = await userService.delete(id);
    if (success) {
      toast.success('Student account deleted successfully');
      fetchUsers();
    }
  };

  const handleUpdateUser = async (id, data) => {
    const updated = await userService.update(id, data);
    if (updated) {
      toast.success('Student profile updated');
      fetchUsers();
    }
    return updated;
  };

  const handleCreateUser = async (data) => {
    const created = await userService.create(data);
    if (created) {
      toast.success('New student added successfully');
      fetchUsers();
    }
    return created;
  };

  return {
    users: paginatedUsers,
    allFilteredCount: filteredUsers.length,
    totalCount: users.length,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    handleUpdateStatus,
    handleDeleteUser,
    handleUpdateUser,
    handleCreateUser,
    refreshUsers: fetchUsers,
  };
};

export default useUsers;
