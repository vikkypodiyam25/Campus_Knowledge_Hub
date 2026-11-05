import React, { useState, useEffect, useMemo } from 'react';
import sessionService from '../sessionService';
import SessionTable from '../components/SessionTable';
import SessionDetails from '../components/SessionDetails';
import SessionEditModal from '../components/SessionEditModal';
import SearchBar from '../../../components/common/SearchBar';
import Select from '../../../components/common/Select';
import Pagination from '../../../components/common/Pagination';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Button from '../../../components/common/Button';
import { useDebounce } from '../../../hooks/useDebounce';
import { DEFAULT_CATEGORIES, SESSION_STATUS } from '../../../utils/constants';
import { Video, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState({ key: 'scheduledDate', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const debouncedSearch = useDebounce(searchTerm, 250);

  const [selectedForView, setSelectedForView] = useState(null);
  const [selectedForEdit, setSelectedForEdit] = useState(null);
  const [selectedForCancel, setSelectedForCancel] = useState(null);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchSessions = async () => {
    try {
      const data = await sessionService.getAll();
      setSessions(data);
    } catch {
      toast.error('Failed to load live sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const handleStorage = (e) => {
      if (e.detail?.key?.includes('sessions')) {
        fetchSessions();
      }
    };
    window.addEventListener('learnconnect_storage_update', handleStorage);
    return () => window.removeEventListener('learnconnect_storage_update', handleStorage);
  }, []);

  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    if (statusFilter !== 'All') {
      result = result.filter(s => s.status === statusFilter);
    }

    if (categoryFilter !== 'All') {
      result = result.filter(s => s.category === categoryFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        s =>
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.host?.name?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortBy.key];
      let valB = b[sortBy.key];

      if (sortBy.key === 'scheduledDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [sessions, debouncedSearch, statusFilter, categoryFilter, sortBy]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredSessions.length / pageSize) || 1;

  // Actions
  const handleApprove = async (id) => {
    const updated = await sessionService.updateStatus(id, SESSION_STATUS.ONGOING);
    if (updated) {
      toast.success('Session marked as Ongoing & room unlocked');
      fetchSessions();
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedForCancel) return;
    await sessionService.updateStatus(selectedForCancel.id, SESSION_STATUS.CANCELLED);
    toast.success('Live session has been cancelled');
    setSelectedForCancel(null);
    fetchSessions();
  };

  const handleConfirmDelete = async () => {
    if (!selectedForDelete) return;
    await sessionService.delete(selectedForDelete.id);
    toast.success('Session deleted permanently');
    setSelectedForDelete(null);
    fetchSessions();
  };

  const handleSaveSession = async (data) => {
    if (selectedForEdit) {
      await sessionService.update(selectedForEdit.id, data);
      toast.success('Session updated successfully');
      setSelectedForEdit(null);
    } else {
      await sessionService.create(data);
      toast.success('Live session created and scheduled');
      setIsAddModalOpen(false);
    }
    fetchSessions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Live Session Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize peer coding rooms, approve workshops, manage participants, and oversee stream channels
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={PlusCircle}
          onClick={() => setIsAddModalOpen(true)}
        >
          Schedule Session
        </Button>
      </div>

      {/* Status Tab Filter Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', SESSION_STATUS.UPCOMING, SESSION_STATUS.ONGOING, SESSION_STATUS.COMPLETED, SESSION_STATUS.CANCELLED].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => {
              setStatusFilter(st);
              setCurrentPage(1);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === st
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {st} Sessions
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search live sessions by title, host, or keyword..."
          className="max-w-md w-full"
        />

        <div className="flex items-center gap-3">
          <div className="w-44">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[{ value: 'All', label: 'All Categories' }, ...DEFAULT_CATEGORIES]}
            />
          </div>

          <div className="w-44">
            <Select
              value={`${sortBy.key}-${sortBy.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortBy({ key, direction });
              }}
              options={[
                { value: 'scheduledDate-asc', label: 'Earliest First' },
                { value: 'scheduledDate-desc', label: 'Latest First' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <SessionTable
        sessions={paginated}
        loading={loading}
        sortConfig={sortBy}
        onSort={setSortBy}
        onView={(s) => setSelectedForView(s)}
        onEdit={(s) => setSelectedForEdit(s)}
        onApprove={handleApprove}
        onCancelSession={(s) => setSelectedForCancel(s)}
        onDelete={(s) => setSelectedForDelete(s)}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredSessions.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Details Modal */}
      <SessionDetails
        isOpen={Boolean(selectedForView)}
        onClose={() => setSelectedForView(null)}
        session={selectedForView}
        onEdit={(s) => setSelectedForEdit(s)}
        onApprove={handleApprove}
        onCancel={(s) => setSelectedForCancel(s)}
      />

      {/* Edit Modal */}
      <SessionEditModal
        isOpen={Boolean(selectedForEdit)}
        onClose={() => setSelectedForEdit(null)}
        session={selectedForEdit}
        onSave={handleSaveSession}
      />

      {/* Create Modal */}
      <SessionEditModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        session={null}
        onSave={handleSaveSession}
      />

      {/* Cancel Confirm */}
      <ConfirmDialog
        isOpen={Boolean(selectedForCancel)}
        onClose={() => setSelectedForCancel(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Scheduled Session"
        message={`Are you sure you want to cancel "${selectedForCancel?.title}"? All enrolled participants will be notified.`}
        confirmText="Cancel Session"
        variant="danger"
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(selectedForDelete)}
        onClose={() => setSelectedForDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Session Record"
        message={`This will permanently delete the session record for "${selectedForDelete?.title}".`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Sessions;
