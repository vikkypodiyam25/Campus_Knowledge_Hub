import React, { useState, useEffect, useMemo } from 'react';
import discussionService from '../discussionService';
import DiscussionTable from '../components/DiscussionTable';
import DiscussionDetails from '../components/DiscussionDetails';
import DiscussionEditModal from '../components/DiscussionEditModal';
import SearchBar from '../../../components/common/SearchBar';
import Select from '../../../components/common/Select';
import Pagination from '../../../components/common/Pagination';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { useDebounce } from '../../../hooks/useDebounce';
import { DEFAULT_CATEGORIES } from '../../../utils/constants';
import toast from 'react-hot-toast';

export const Discussions = () => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Pinned, Hidden
  const [sortBy, setSortBy] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const debouncedSearch = useDebounce(searchTerm, 250);

  const [selectedForView, setSelectedForView] = useState(null);
  const [selectedForEdit, setSelectedForEdit] = useState(null);
  const [selectedForDelete, setSelectedForDelete] = useState(null);

  const fetchDiscussions = async () => {
    try {
      const data = await discussionService.getAll();
      setDiscussions(data);
    } catch {
      toast.error('Failed to load discussions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
    const handleStorage = (e) => {
      if (e.detail?.key?.includes('discussions')) {
        fetchDiscussions();
      }
    };
    window.addEventListener('learnconnect_storage_update', handleStorage);
    return () => window.removeEventListener('learnconnect_storage_update', handleStorage);
  }, []);

  const filteredDiscussions = useMemo(() => {
    let result = [...discussions];

    if (categoryFilter !== 'All') {
      result = result.filter(d => d.category === categoryFilter);
    }

    if (statusFilter === 'Pinned') {
      result = result.filter(d => d.isPinned);
    } else if (statusFilter === 'Hidden') {
      result = result.filter(d => d.isHidden);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        d =>
          d.title?.toLowerCase().includes(q) ||
          d.content?.toLowerCase().includes(q) ||
          d.author?.name?.toLowerCase().includes(q) ||
          d.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      // Pinned items stay on top
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      let valA = a[sortBy.key];
      let valB = b[sortBy.key];

      if (sortBy.key === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (sortBy.key === 'likes') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      }

      if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [discussions, debouncedSearch, categoryFilter, statusFilter, sortBy]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDiscussions.slice(start, start + pageSize);
  }, [filteredDiscussions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredDiscussions.length / pageSize) || 1;

  // Actions
  const handleTogglePin = async (id) => {
    const updated = await discussionService.togglePin(id);
    if (updated) {
      toast.success(updated.isPinned ? 'Discussion pinned to top' : 'Discussion unpinned');
      fetchDiscussions();
    }
  };

  const handleToggleHide = async (id) => {
    const updated = await discussionService.toggleHide(id);
    if (updated) {
      toast.success(updated.isHidden ? 'Discussion hidden from feeds' : 'Discussion unhidden');
      fetchDiscussions();
    }
  };

  const handleEditSave = async (data) => {
    if (!selectedForEdit) return;
    const updated = await discussionService.update(selectedForEdit.id, data);
    if (updated) {
      toast.success('Discussion thread updated');
      fetchDiscussions();
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedForDelete) return;
    await discussionService.delete(selectedForDelete.id);
    toast.success('Discussion deleted permanently');
    setSelectedForDelete(null);
    fetchDiscussions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Discussion Forum Management
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review community discussions, pin featured roadmaps, monitor sentiments, and moderate threads
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search discussions by topic, hashtags, or author..."
          className="max-w-md w-full"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-40">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[{ value: 'All', label: 'All Categories' }, ...DEFAULT_CATEGORIES]}
            />
          </div>

          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Status' },
                { value: 'Pinned', label: 'Pinned Only' },
                { value: 'Hidden', label: 'Hidden Only' },
              ]}
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
                { value: 'createdAt-desc', label: 'Newest First' },
                { value: 'createdAt-asc', label: 'Oldest First' },
                { value: 'likes-desc', label: 'Most Likes' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <DiscussionTable
        discussions={paginated}
        loading={loading}
        sortConfig={sortBy}
        onSort={setSortBy}
        onView={(d) => setSelectedForView(d)}
        onEdit={(d) => setSelectedForEdit(d)}
        onTogglePin={handleTogglePin}
        onToggleHide={handleToggleHide}
        onDelete={(d) => setSelectedForDelete(d)}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredDiscussions.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Details Modal */}
      <DiscussionDetails
        isOpen={Boolean(selectedForView)}
        onClose={() => setSelectedForView(null)}
        discussion={selectedForView}
        onEdit={(d) => setSelectedForEdit(d)}
        onTogglePin={handleTogglePin}
        onToggleHide={handleToggleHide}
      />

      {/* Edit Modal */}
      <DiscussionEditModal
        isOpen={Boolean(selectedForEdit)}
        onClose={() => setSelectedForEdit(null)}
        discussion={selectedForEdit}
        onSave={handleEditSave}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(selectedForDelete)}
        onClose={() => setSelectedForDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Discussion Thread"
        message={`Are you sure you want to permanently delete "${selectedForDelete?.title}"? All community comments and replies will be lost.`}
        confirmText="Delete Thread"
        variant="danger"
      />
    </div>
  );
};

export default Discussions;
