import React from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { formatDate, formatRelativeTime } from '../../../utils/formatDate';
import { Pin, EyeOff, ThumbsUp, MessageSquare, Tag, Edit, Calendar } from 'lucide-react';

export const DiscussionDetails = ({
  isOpen,
  onClose,
  discussion,
  onEdit,
  onTogglePin,
  onToggleHide,
}) => {
  if (!discussion) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Discussion Thread Details"
      subtitle={`Thread ID: ${discussion.id}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {discussion.isPinned && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <Pin className="w-3 h-3 fill-current" /> Pinned
              </span>
            )}
            {discussion.isHidden && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                <EyeOff className="w-3 h-3" /> Hidden
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Pin}
              onClick={() => {
                onTogglePin(discussion.id);
                onClose();
              }}
            >
              {discussion.isPinned ? 'Unpin' : 'Pin to Top'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Edit}
              onClick={() => {
                onClose();
                onEdit(discussion);
              }}
            >
              Edit Discussion
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-lg bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
              {discussion.category}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Posted {formatRelativeTime(discussion.createdAt)}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {discussion.title}
          </h3>

          <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {discussion.content}
          </div>
        </div>

        {/* Author & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
          <div className="flex items-center gap-3">
            <img
              src={discussion.author?.avatar}
              alt={discussion.author?.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
            />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {discussion.author?.name}
              </p>
              <p className="text-[11px] text-slate-400">
                {discussion.author?.role || 'Campus Student'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-rose-600">
              <ThumbsUp className="w-4 h-4" />
              {discussion.likes || 0} Likes
            </span>
            <span className="flex items-center gap-1 font-semibold text-indigo-600">
              <MessageSquare className="w-4 h-4" />
              {discussion.commentsCount || 0} Comments
            </span>
          </div>
        </div>

        {/* Tags */}
        {discussion.tags && discussion.tags.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {discussion.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DiscussionDetails;
