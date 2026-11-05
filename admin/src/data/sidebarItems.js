import { PERMISSIONS } from '../utils/permissions';

export const SIDEBAR_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    label: 'User Management',
    path: '/users',
    icon: 'Users',
    badgeKey: 'usersCount',
    permission: PERMISSIONS.VIEW_USERS,
  },
  {
    label: 'Doubt Management',
    path: '/questions',
    icon: 'HelpCircle',
    badgeKey: 'unansweredQuestions',
    permission: PERMISSIONS.MANAGE_QUESTIONS,
  },
  {
    label: 'Discussion Management',
    path: '/discussions',
    icon: 'MessageSquare',
    permission: PERMISSIONS.MANAGE_DISCUSSIONS,
  },
  {
    label: 'Live Session Management',
    path: '/sessions',
    icon: 'Video',
    badgeKey: 'upcomingSessions',
    permission: PERMISSIONS.MANAGE_SESSIONS,
  },
  {
    label: 'Reports & Moderation',
    path: '/reports',
    icon: 'ShieldAlert',
    badgeKey: 'pendingReports',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    label: 'Categories & Topics',
    path: '/categories',
    icon: 'FolderTree',
    permission: PERMISSIONS.MANAGE_CATEGORIES,
  },
  {
    label: 'Notifications',
    path: '/notifications',
    icon: 'Bell',
    permission: PERMISSIONS.MANAGE_NOTIFICATIONS,
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: 'BarChart3',
    permission: PERMISSIONS.VIEW_ANALYTICS,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: 'Settings',
  },
];
