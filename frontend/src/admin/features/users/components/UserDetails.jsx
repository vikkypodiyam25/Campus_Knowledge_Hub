import React from 'react';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import { formatDate } from '../../../utils/formatDate';
import {
  Mail,
  Calendar,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Video,
  Award,
  Edit,
} from 'lucide-react';

export const UserDetails = ({
  isOpen,
  onClose,
  user,
  onEdit,
}) => {
  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Profile & Performance"
      subtitle={`User ID: ${user.id}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <StatusBadge status={user.status} />
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Edit}
              onClick={() => {
                onClose();
                onEdit(user);
              }}
            >
              Edit Student
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Profile Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-md shrink-0"
          />
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {user.name}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {user.batch || 'Batch 2024'} • {user.role || 'Student'}
                </p>
              </div>
              <StatusBadge status={user.status} />
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {user.bio || 'No personal bio added.'}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Joined {formatDate(user.joinedDate)}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm text-center">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 w-fit mx-auto mb-1.5">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white block">
              {user.stats?.questions ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">Questions Asked</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm text-center">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 w-fit mx-auto mb-1.5">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white block">
              {user.stats?.answers ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">Answers Given</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm text-center">
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 w-fit mx-auto mb-1.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white block">
              {user.stats?.discussions ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">Discussions</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm text-center">
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 w-fit mx-auto mb-1.5">
              <Video className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white block">
              {user.stats?.sessionsJoined ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">Sessions Joined</span>
          </div>
        </div>

        {/* Skills & Learning Interests */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Skills & Learning Interests
          </h4>
          <div className="flex flex-wrap gap-2">
            {user.skills && user.skills.length > 0 ? (
              user.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No skills listed</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UserDetails;
