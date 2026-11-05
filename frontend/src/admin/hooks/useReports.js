import { useState, useEffect, useMemo } from 'react';
import reportService from '../features/reports/reportService';
import { useDebounce } from './useDebounce';
import toast from 'react-hot-toast';

export const useReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const debouncedSearch = useDebounce(searchTerm, 250);

  const fetchReports = () => {
    try {
      const data = reportService.getAll();
      setReports(data);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const handleStorageUpdate = (e) => {
      if (e.detail?.key?.includes('reports')) {
        fetchReports();
      }
    };
    window.addEventListener('learnconnect_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('learnconnect_storage_update', handleStorageUpdate);
  }, []);

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (statusFilter !== 'All') {
      result = result.filter(r => r.status === statusFilter);
    }

    if (priorityFilter !== 'All') {
      result = result.filter(r => r.priority === priorityFilter);
    }

    if (categoryFilter !== 'All') {
      result = result.filter(r => r.category === categoryFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        r =>
          r.title?.toLowerCase().includes(q) ||
          r.reportedContent?.toLowerCase().includes(q) ||
          r.reporter?.name?.toLowerCase().includes(q) ||
          r.reportedUser?.name?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [reports, debouncedSearch, statusFilter, priorityFilter, categoryFilter]);

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredReports.slice(startIndex, startIndex + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;

  const handleUpdateStatus = (id, newStatus, notes) => {
    const updated = reportService.updateStatus(id, newStatus, notes);
    if (updated) {
      toast.success(`Report status updated to ${newStatus}`);
      fetchReports();
    }
    return updated;
  };

  const handleRemoveContent = (id, notes) => {
    const success = reportService.removeContentAndResolve(id, notes);
    if (success) {
      toast.success('Reported content removed & report marked as resolved');
      fetchReports();
    }
    return success;
  };

  return {
    reports: paginatedReports,
    allFilteredCount: filteredReports.length,
    totalCount: reports.length,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    handleUpdateStatus,
    handleRemoveContent,
    refreshReports: fetchReports,
  };
};

export default useReports;
