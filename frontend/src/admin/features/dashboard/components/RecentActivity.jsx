import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  HelpCircle,
  MessageSquare,
  Video,
  ShieldAlert,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle,
  UserX,
  AlertCircle,
  Eye,
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { formatRelativeTime, formatDate } from '../../../utils/formatDate';

export const RecentActivity = ({ recentData }) => {
  const {
    recentStudents = [],
    latestQuestions = [],
    recentDiscussions = [],
    upcomingSessions = [],
    pendingReports = [],
    recentActivities = [],
  } = recentData;

  return (
    <div className="space-y-6">
      {/* 2-Column Grid: Students & Latest Doubts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Students */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Recent Registered Students
              </h4>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
            {recentStudents.map((student) => (
              <div key={student.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {student.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {student.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={student.status} />
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {formatDate(student.joinedDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Questions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Latest Doubts & Questions
              </h4>
            </div>
            <Link
              to="/admin/questions"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
            {latestQuestions.map((q) => (
              <div key={q.id} className="py-3 flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to="/admin/questions"
                    className="text-xs font-medium text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 transition-colors"
                  >
                    {q.title}
                  </Link>
                  <StatusBadge status={q.status} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
                    {q.category} • by {q.author?.name}
                  </span>
                  <span>{formatRelativeTime(q.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3-Column Grid: Discussions, Upcoming Sessions, and Pending Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Discussions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Recent Discussions
              </h4>
            </div>
            <Link
              to="/admin/discussions"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All
            </Link>
          </div>

          <div className="space-y-3 mt-3">
            {recentDiscussions.slice(0, 3).map((disc) => (
              <div
                key={disc.id}
                className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
              >
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {disc.title}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{disc.author?.name}</span>
                  <span>{disc.commentsCount} comments</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Live Sessions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Upcoming Live Sessions
              </h4>
            </div>
            <Link
              to="/admin/sessions"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All
            </Link>
          </div>

          <div className="space-y-3 mt-3">
            {upcomingSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No sessions right now</p>
            ) : (
              upcomingSessions.slice(0, 3).map((sess) => (
                <div
                  key={sess.id}
                  className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {sess.category}
                    </span>
                    <StatusBadge status={sess.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                    {sess.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Host: {sess.host?.name} • {sess.participantsCount} enrolled
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Reports */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Pending Moderation Reports
              </h4>
            </div>
            <Link
              to="/admin/reports"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All
            </Link>
          </div>

          <div className="space-y-3 mt-3">
            {pendingReports.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No pending flags 🎉</p>
            ) : (
              pendingReports.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      {rep.priority} Priority
                    </span>
                    <StatusBadge status={rep.status} />
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                    {rep.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    Flagged by {rep.reporter?.name}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Admin Activity Feed */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent Admin Activity Log
            </h4>
            <p className="text-xs text-slate-400">
              Audited administrative actions and operations
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentActivities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800/60 p-3 bg-slate-50/50 dark:bg-slate-800/30"
            >
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {act.action}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {act.target}
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {formatRelativeTime(act.timestamp)} by {act.admin}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
