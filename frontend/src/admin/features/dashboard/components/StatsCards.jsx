import React from 'react';
import {
  Users,
  UserCheck,
  HelpCircle,
  MessageSquare,
  Video,
  ShieldAlert,
} from 'lucide-react';
import { formatNumber } from '../../../utils/formatNumber';

export const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Registered Students',
      value: stats.totalStudents,
      change: 'All accounts',
      period: 'registered accounts',
      icon: Users,
      color: 'indigo',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      textColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Active Students',
      value: stats.activeStudents,
      change: 'Active accounts',
      period: 'active accounts',
      icon: UserCheck,
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Total Questions / Doubts',
      value: stats.totalQuestions,
      change: 'Current total',
      period: 'questions',
      icon: HelpCircle,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Discussions',
      value: stats.totalDiscussions,
      change: 'Current total',
      period: 'discussion threads',
      icon: MessageSquare,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Total Live Sessions',
      value: stats.totalSessions,
      change: `${stats.upcomingSessions || 0} upcoming`,
      period: 'live sessions',
      icon: Video,
      color: 'cyan',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
      textColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      title: 'Reports',
      value: stats.pendingReports,
      change: 'Not configured',
      period: 'report intake unavailable',
      icon: ShieldAlert,
      color: 'amber',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card hover:shadow-card-hover transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.bgColor} ${card.textColor} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatNumber(card.value)}
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                  {card.change}
                </span>
                <span className="text-slate-400 truncate">{card.period}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
