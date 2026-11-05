import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action may not be reversible.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'primary' | 'success'
  isLoading = false,
}) => {
  const icons = {
    danger: <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 shrink-0"><AlertTriangle className="w-6 h-6" /></div>,
    primary: <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 shrink-0"><Info className="w-6 h-6" /></div>,
    success: <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shrink-0"><CheckCircle2 className="w-6 h-6" /></div>,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={!isLoading}>
      <div className="flex items-start gap-4 pt-2">
        {icons[variant] || icons.danger}
        <div className="flex-1">
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h4>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'primary' ? 'primary' : variant === 'success' ? 'success' : 'danger'}
          size="md"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
