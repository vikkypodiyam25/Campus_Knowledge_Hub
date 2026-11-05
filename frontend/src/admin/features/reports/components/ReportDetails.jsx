import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import { formatDate, formatRelativeTime } from '../../../utils/formatDate';
import { ShieldAlert, AlertTriangle, ShieldCheck, ShieldX, Trash2, User, MessageSquare } from 'lucide-react';
import { REPORT_STATUS } from '../../../utils/constants';

export const ReportDetails = ({
  isOpen,
  onClose,
  report,
  onResolve,
  onReject,
  onRemoveContent,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');

  if (!report) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Moderation Incident Review"
      subtitle={`Report ID: ${report.id}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <StatusBadge status={report.priority} />
            <StatusBadge status={report.status} />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>

            {report.status !== REPORT_STATUS.REJECTED && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={ShieldX}
                onClick={() => {
                  onReject(report.id, resolutionNotes);
                  onClose();
                }}
              >
                Dismiss Report
              </Button>
            )}

            {report.status !== REPORT_STATUS.RESOLVED && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={Trash2}
                onClick={() => {
                  onRemoveContent(report, resolutionNotes);
                  onClose();
                }}
              >
                Remove Content & Resolve
              </Button>
            )}

            {report.status !== REPORT_STATUS.RESOLVED && (
              <Button
                variant="success"
                size="sm"
                leftIcon={ShieldCheck}
                onClick={() => {
                  onResolve(report.id, resolutionNotes);
                  onClose();
                }}
              >
                Resolve
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Flag Summary */}
        <div>
          <span className="inline-flex items-center rounded-lg bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1.5">
            {report.category}
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {report.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Reported {formatRelativeTime(report.createdAt)} on item type: <span className="font-semibold text-slate-700 dark:text-slate-300">{report.itemType} (#{report.itemId})</span>
          </p>
        </div>

        {/* Verbatim Content Box */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
            Flagged Content Snippet
          </label>
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-sm text-slate-800 dark:text-slate-200 font-mono leading-relaxed">
            "{report.reportedContent}"
          </div>
        </div>

        {/* Reason Given */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Reporter's Complaint / Reason:
          </span>
          <p className="text-slate-600 dark:text-slate-400">
            {report.reason}
          </p>
        </div>

        {/* Reporter and Target User Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Report Submitted By
            </span>
            <div className="flex items-center gap-2.5">
              <img
                src={report.reporter?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={report.reporter?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {report.reporter?.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {report.reporter?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-2">
              Reported User Under Investigation
            </span>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                {report.reportedUser?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {report.reportedUser?.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {report.reportedUser?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Notes Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Admin Resolution Notes
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Add administrative notes regarding action taken..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ReportDetails;
