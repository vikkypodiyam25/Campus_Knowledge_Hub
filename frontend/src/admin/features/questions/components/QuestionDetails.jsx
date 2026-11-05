import React from 'react';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import { formatRelativeTime, formatDate } from '../../../utils/formatDate';
import { CheckCircle2, ThumbsUp, MessageSquare, Check, Edit, ShieldAlert } from 'lucide-react';
import { QUESTION_STATUS } from '../../../utils/constants';

export const QuestionDetails = ({
  isOpen,
  onClose,
  question,
  onResolve,
  onEdit,
}) => {
  if (!question) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doubt & Answers Thread"
      subtitle={`Question ID: ${question.id}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <StatusBadge status={question.status} />
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            {question.status !== QUESTION_STATUS.RESOLVED && (
              <Button
                variant="success"
                size="sm"
                leftIcon={Check}
                onClick={() => {
                  onResolve(question.id);
                  onClose();
                }}
              >
                Mark as Resolved
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              leftIcon={Edit}
              onClick={() => {
                onClose();
                onEdit(question);
              }}
            >
              Edit Question
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Question Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              {question.category}
            </span>
            <span className="text-xs text-slate-400">
              Asked {formatRelativeTime(question.createdAt)}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {question.title}
          </h3>

          <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {question.content}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <img
                src={question.author?.avatar}
                alt={question.author?.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {question.author?.name} ({question.author?.email})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                <ThumbsUp className="w-3.5 h-3.5" />
                {question.upvotes || 0} Upvotes
              </span>
            </div>
          </div>
        </div>

        {/* Answers List */}
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Community Answers ({question.answers?.length || 0})
            </h4>
          </div>

          {!question.answers || question.answers.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No answers posted yet for this question.
            </div>
          ) : (
            <div className="space-y-3">
              {question.answers.map((ans, idx) => (
                <div
                  key={ans.id || idx}
                  className={`p-4 rounded-xl border text-sm transition-all ${
                    ans.isAccepted
                      ? 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20'
                      : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={ans.author?.avatar}
                        alt={ans.author?.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {ans.author?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {ans.isAccepted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Accepted Solution
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {formatRelativeTime(ans.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {ans.content}
                  </p>

                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-blue-500" />
                    <span>{ans.upvotes || 0} helpful votes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default QuestionDetails;
