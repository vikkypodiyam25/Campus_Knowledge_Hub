import React from 'react';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import { formatDateTime } from '../../../utils/formatDate';
import { Video, Calendar, Clock, Users, ExternalLink, Edit, CheckCircle, XCircle } from 'lucide-react';
import { SESSION_STATUS } from '../../../utils/constants';

export const SessionDetails = ({
  isOpen,
  onClose,
  session,
  onEdit,
  onApprove,
  onCancel,
}) => {
  if (!session) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Live Session Information"
      subtitle={`Session ID: ${session.id}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <StatusBadge status={session.status} />

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>

            {session.status === SESSION_STATUS.UPCOMING && (
              <Button
                variant="success"
                size="sm"
                leftIcon={CheckCircle}
                onClick={() => {
                  onApprove(session.id);
                  onClose();
                }}
              >
                Approve & Start
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              leftIcon={Edit}
              onClick={() => {
                onClose();
                onEdit(session);
              }}
            >
              Edit Session
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Main Details */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              {session.category}
            </span>
            <span className="text-xs text-slate-400">
              Max capacity: {session.maxCapacity || 100} students
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {session.title}
          </h3>

          <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {session.description}
          </div>
        </div>

        {/* Schedule & Link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDateTime(session.scheduledDate)}
              </p>
              <p className="text-slate-400 text-[11px]">
                Estimated duration: {session.duration}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  Meeting URL
                </p>
                <p className="text-indigo-600 dark:text-indigo-400 text-[11px] truncate">
                  {session.meetingLink}
                </p>
              </div>
            </div>
            <a
              href={session.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors shrink-0"
              title="Open Meeting Link"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Host Details */}
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Session Host & Instructor
          </h4>
          <div className="flex items-center gap-3">
            <img
              src={session.host?.avatar}
              alt={session.host?.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {session.host?.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {session.host?.role} • {session.host?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Registered Participants */}
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Registered Participants ({session.participants?.length || 0})
            </h4>
          </div>

          {!session.participants || session.participants.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              No registered students yet for this cohort.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {session.participants.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                  <span className="text-[11px] text-slate-400">{p.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SessionDetails;
