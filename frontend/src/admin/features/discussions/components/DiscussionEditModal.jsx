import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import { DEFAULT_CATEGORIES } from '../../../utils/constants';
import { validateRequired } from '../../../utils/validators';

export const DiscussionEditModal = ({
  isOpen,
  onClose,
  discussion,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'React.js',
    content: '',
    isPinned: false,
    isHidden: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (discussion) {
      setFormData({
        title: discussion.title || '',
        category: discussion.category || 'React.js',
        content: discussion.content || '',
        isPinned: Boolean(discussion.isPinned),
        isHidden: Boolean(discussion.isHidden),
      });
      setErrors({});
    }
  }, [discussion, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const titleErr = validateRequired(formData.title, 'Discussion title');
    const contentErr = validateRequired(formData.content, 'Discussion description');

    if (titleErr || contentErr) {
      setErrors({ title: titleErr, content: contentErr });
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Discussion Thread"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit}>
            Save Changes
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Discussion Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
          required
        />

        <Select
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={DEFAULT_CATEGORIES}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Thread Body Content <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={5}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
          {errors.content && (
            <p className="mt-1 text-xs text-rose-600">{errors.content}</p>
          )}
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span>Pin this thread to top</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={formData.isHidden}
              onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
            />
            <span>Hide from community feed</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default DiscussionEditModal;
