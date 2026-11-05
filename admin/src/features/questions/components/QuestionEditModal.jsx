import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import { QUESTION_STATUS, DEFAULT_CATEGORIES } from '../../../utils/constants';
import { validateRequired } from '../../../utils/validators';

export const QuestionEditModal = ({
  isOpen,
  onClose,
  question,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'React.js',
    status: QUESTION_STATUS.ANSWERED,
    content: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (question) {
      setFormData({
        title: question.title || '',
        category: question.category || 'React.js',
        status: question.status || QUESTION_STATUS.ANSWERED,
        content: question.content || '',
      });
      setErrors({});
    }
  }, [question, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const titleErr = validateRequired(formData.title, 'Question title');
    const contentErr = validateRequired(formData.content, 'Question description');

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
      title="Edit Question / Doubt"
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
          label="Question Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={DEFAULT_CATEGORIES}
          />

          <Select
            label="Resolution Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={Object.values(QUESTION_STATUS)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Detailed Content & Code Snippets <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={5}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-mono"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
          {errors.content && (
            <p className="mt-1 text-xs text-rose-600">{errors.content}</p>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default QuestionEditModal;
