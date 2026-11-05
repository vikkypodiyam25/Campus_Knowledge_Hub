import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import { USER_STATUS } from '../../../utils/constants';
import { validateEmail, validateRequired } from '../../../utils/validators';

export const UserEditModal = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    batch: '',
    status: USER_STATUS.ACTIVE,
    bio: '',
    skills: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        batch: user.batch || 'Batch 2024-A',
        status: user.status || USER_STATUS.ACTIVE,
        bio: user.bio || '',
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''),
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const nameErr = validateRequired(formData.name, 'Full name');
    const emailErr = validateEmail(formData.email);

    if (nameErr || emailErr) {
      setErrors({ name: nameErr, email: emailErr });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const skillsArray = formData.skills
      ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    onSave({
      ...formData,
      skills: skillsArray,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Edit Student Information' : 'Add New Student'}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit} isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. Aarav Sharma"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="student@campus.edu"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Campus Batch"
            placeholder="e.g. Batch 2024-A"
            value={formData.batch}
            onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
          />

          <Select
            label="Account Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: USER_STATUS.ACTIVE, label: 'Active' },
              { value: USER_STATUS.INACTIVE, label: 'Inactive' },
              { value: USER_STATUS.SUSPENDED, label: 'Suspended' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Skills & Tags (Comma Separated)
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="React.js, Node.js, Python"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Student Bio / Notes
          </label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Brief profile bio or mentorship notes..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
};

export default UserEditModal;
