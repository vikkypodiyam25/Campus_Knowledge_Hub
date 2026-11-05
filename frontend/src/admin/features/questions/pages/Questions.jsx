import React, { useState, useEffect, useMemo } from 'react';
import questionService from '../questionService';
import QuestionTable from '../components/QuestionTable';
import QuestionDetails from '../components/QuestionDetails';
import QuestionEditModal from '../components/QuestionEditModal';
import SearchBar from '../../../components/common/SearchBar';
import Select from '../../../components/common/Select';
import Pagination from '../../../components/common/Pagination';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { useDebounce } from '../../../hooks/useDebounce';
import { DEFAULT_CATEGORIES, QUESTION_STATUS } from '../../../utils/constants';
import toast from 'react-hot-toast';

export const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const debouncedSearch = useDebounce(searchTerm, 250);

  // Modal states
  const [selectedForView, setSelectedForView] = useState(null);
  const [selectedForEdit, setSelectedForEdit] = useState(null);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [selectedForRemoval, setSelectedForRemoval] = useState(null);

  const fetchQuestions = () => {
    try {
      const data = questionService.getAll();
      setQuestions(data);
    } catch {
      toast.error('Failed to load doubts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    const handleStorage = (e) => {
      if (e.detail?.key?.includes('questions')) {
        fetchQuestions();
      }
    };
    window.addEventListener('learnconnect_storage_update', handleStorage);
    return () => window.removeEventListener('learnconnect_storage_update', handleStorage);
  }, []);

  const filteredQuestions = useMemo(() => {
    let result = [...questions];

    if (categoryFilter !== 'All') {
      result = result.filter(q => q.category === categoryFilter);
    }

    if (statusFilter !== 'All') {
      result = result.filter(q => q.status === statusFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        item =>
          item.title?.toLowerCase().includes(q) ||
          item.content?.toLowerCase().includes(q) ||
          item.author?.name?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortBy.key];
      let valB = b[sortBy.key];

      if (sortBy.key === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (sortBy.key === 'upvotes') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      }

      if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [questions, debouncedSearch, categoryFilter, statusFilter, sortBy]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;

  // Actions
  const handleResolve = (id) => {
    const updated = questionService.resolve(id);
    if (updated) {
      toast.success('Question marked as resolved');
      fetchQuestions();
    }
  };

  const handleEditSave = (data) => {
    if (!selectedForEdit) return;
    const updated = questionService.update(selectedForEdit.id, data);
    if (updated) {
      toast.success('Question updated successfully');
      fetchQuestions();
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedForDelete) return;
    questionService.delete(selectedForDelete.id);
    toast.success('Question deleted');
    setSelectedForDelete(null);
    fetchQuestions();
  };

  const handleConfirmRemoval = () => {
    if (!selectedForRemoval) return;
    questionService.removeInappropriate(selectedForRemoval.id);
    toast.success('Question flagged and removed from community feeds');
    setSelectedForRemoval(null);
    fetchQuestions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Doubt & Question Management
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor peer question threads, answer quality, category distribution, and moderation compliance
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search doubts by title, keywords, or student name..."
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

          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: QUESTION_STATUS.ANSWERED, label: 'Answered' },
                { value: QUESTION_STATUS.UNANSWERED, label: 'Unanswered' },
                { value: QUESTION_STATUS.RESOLVED, label: 'Resolved' },
                { value: QUESTION_STATUS.REMOVED, label: 'Removed' },
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
                { value: 'createdAt-desc', label: 'Latest First' },
                { value: 'createdAt-asc', label: 'Oldest First' },
                { value: 'upvotes-desc', label: 'Most Upvoted' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <QuestionTable
        questions={paginated}
        loading={loading}
        sortConfig={sortBy}
        onSort={setSortBy}
        onView={(q) => setSelectedForView(q)}
        onEdit={(q) => setSelectedForEdit(q)}
        onResolve={handleResolve}
        onRemoveInappropriate={(q) => setSelectedForRemoval(q)}
        onDelete={(q) => setSelectedForDelete(q)}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredQuestions.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Details Modal */}
      <QuestionDetails
        isOpen={Boolean(selectedForView)}
        onClose={() => setSelectedForView(null)}
        question={selectedForView}
        onResolve={handleResolve}
        onEdit={(q) => setSelectedForEdit(q)}
      />

      {/* Edit Modal */}
      <QuestionEditModal
        isOpen={Boolean(selectedForEdit)}
        onClose={() => setSelectedForEdit(null)}
        question={selectedForEdit}
        onSave={handleEditSave}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(selectedForDelete)}
        onClose={() => setSelectedForDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Question Permanently"
        message={`Are you sure you want to delete the question "${selectedForDelete?.title}"? All peer answers and upvotes will be removed.`}
        confirmText="Delete Question"
        variant="danger"
      />

      {/* Inappropriate Removal Confirm */}
      <ConfirmDialog
        isOpen={Boolean(selectedForRemoval)}
        onClose={() => setSelectedForRemoval(null)}
        onConfirm={handleConfirmRemoval}
        title="Quarantine Inappropriate Question"
        message={`This will hide "${selectedForRemoval?.title}" from all students and flag the author's account for moderation review.`}
        confirmText="Remove from Feeds"
        variant="danger"
      />
    </div>
  );
};

export default Questions;
