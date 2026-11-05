import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import { SESSION_STATUS, DEFAULT_CATEGORIES } from '../../../utils/constants';
import { validateRequired, isValidUrl } from '../../../utils/validators';

export const SessionEditModal = ({
  isOpen,
  onClose,
  session,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'React.js',
    status: SESSION_STATUS.UPCOMING,
    scheduledDate: '',
    duration: '60 mins',
    maxCapacity: 100,
    meetingLink: '',
    description: '',
    hostName: '',
    hostEmail: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (session) {
      setFormData({
        title: session.title || '',
        category: session.category || 'React.js',
        status: session.status || SESSION_STATUS.UPCOMING,
        scheduledDate: session.scheduledDate ? session.scheduledDate.slice(0, 16) : '',
        duration: session.duration || '60 mins',
        maxCapacity: session.maxCapacity || 100,
        meetingLink: session.meetingLink || '',
        description: session.description || '',
        hostName: session.host?.name || '',
        hostEmail: session.host?.email || '',
      });
      setErrors({});
    } else {
      setFormData({
        title: '',
        category: 'React.js',
        status: SESSION_STATUS.UPCOMING,
        scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
        duration: '60 mins',
        maxCapacity: 100,
        meetingLink: 'https://meet.learnconnect.edu/live-hub',
        description: '',
        hostName: 'Vikky Podiyam',
        hostEmail: 'vikkypodiyam25@navgurukul.org',
      });
      setErrors({});
    }
  }, [session, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const titleErr = validateRequired(formData.title, 'Session title');
    const descErr = validateRequired(formData.description, 'Session description');

    if (titleErr || descErr) {
      setErrors({ title: titleErr, description: descErr });
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={session ? 'Edit Live Session' : 'Create Live Cohort Session'}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit}>
            {session ? 'Save Changes' : 'Schedule Session'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Session Title"
          placeholder="e.g. Masterclass: Full Stack System Architecture"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={DEFAULT_CATEGORIES}
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={Object.values(SESSION_STATUS)}
          />

          <Input
            label="Duration"
            placeholder="e.g. 60 mins"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            value={formData.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
          />

          <Input
            label="Max Student Capacity"
            type="number"
            min={10}
            max={500}
            value={formData.maxCapacity}
            onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
          />
        </div>

        <Input
          label="Meeting URL"
          placeholder="https://meet.learnconnect.edu/session-room"
          value={formData.meetingLink}
          onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Instructor / Host Name"
            value={formData.hostName}
            onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
          />

          <Input
            label="Host Email"
            type="email"
            value={formData.hostEmail}
            onChange={(e) => setFormData({ ...formData, hostEmail: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Agenda & Session Overview <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-rose-600">{errors.description}</p>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default SessionEditModal;
