import React, { useState } from 'react';
import useUsers from '../../../hooks/useUsers';
import UserFilters from '../components/UserFilters';
import UserTable from '../components/UserTable';
import UserDetails from '../components/UserDetails';
import UserEditModal from '../components/UserEditModal';
import Pagination from '../../../components/common/Pagination';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Button from '../../../components/common/Button';
import { UserPlus, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const Users = () => {
  const {
    users,
    allFilteredCount,
    totalCount,
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
  } = useUsers();

  const [selectedUserForView, setSelectedUserForView] = useState(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleConfirmDelete = () => {
    if (!selectedUserForDelete) return;
    handleDeleteUser(selectedUserForDelete.id);
    setSelectedUserForDelete(null);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Name,Email,Batch,Status,JoinedDate\n' +
      users.map(u => `"${u.name}","${u.email}","${u.batch}","${u.status}","${u.joinedDate}"`).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Students list exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse, inspect, and moderate all {totalCount} enrolled campus students
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={Download}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={UserPlus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Table */}
      <UserTable
        users={users}
        loading={loading}
        sortConfig={sortBy}
        onSort={setSortBy}
        onViewUser={(user) => setSelectedUserForView(user)}
        onEditUser={(user) => setSelectedUserForEdit(user)}
        onDeleteUser={(user) => setSelectedUserForDelete(user)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={allFilteredCount}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* View User Modal */}
      <UserDetails
        isOpen={Boolean(selectedUserForView)}
        onClose={() => setSelectedUserForView(null)}
        user={selectedUserForView}
        onEdit={(user) => setSelectedUserForEdit(user)}
      />

      {/* Edit User Modal */}
      <UserEditModal
        isOpen={Boolean(selectedUserForEdit)}
        onClose={() => setSelectedUserForEdit(null)}
        user={selectedUserForEdit}
        onSave={(data) => handleUpdateUser(selectedUserForEdit.id, data)}
      />

      {/* Add User Modal */}
      <UserEditModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        user={null}
        onSave={(data) => handleCreateUser(data)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(selectedUserForDelete)}
        onClose={() => setSelectedUserForDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Student Account"
        message={`Are you sure you want to permanently delete the profile for ${selectedUserForDelete?.name} (${selectedUserForDelete?.email})? All associated session enrollments will be revoked.`}
        confirmText="Delete Account"
        variant="danger"
      />
    </div>
  );
};

export default Users;
