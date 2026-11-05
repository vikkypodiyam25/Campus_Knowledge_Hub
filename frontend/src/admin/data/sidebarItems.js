import { PERMISSIONS } from '../utils/permissions';

export const SIDEBAR_ITEMS = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: 'Users',
    badgeKey: 'usersCount',
    permission: PERMISSIONS.VIEW_USERS,
  },
  {
    label: 'Doubt Management',
    path: '/admin/questions',
    icon: 'HelpCircle',
    badgeKey: 'unansweredQuestions',
    permission: PERMISSIONS.MANAGE_QUESTIONS,
  },
  {
    label: 'Discussion Management',
    path: '/admin/discussions',
    icon: 'MessageSquare',
    permission: PERMISSIONS.MANAGE_DISCUSSIONS,
  },
  {
    label: 'Live Session Management',
    path: '/admin/sessions',
    icon: 'Video',
    badgeKey: 'upcomingSessions',
    permission: PERMISSIONS.MANAGE_SESSIONS,
  },
  {
    label: 'Reports & Moderation',
    path: '/admin/reports',
    icon: 'ShieldAlert',
    badgeKey: 'pendingReports',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    label: 'Categories & Topics',
    path: '/admin/categories',
    icon: 'FolderTree',
    permission: PERMISSIONS.MANAGE_CATEGORIES,
  },
  {
    label: 'Notifications',
    path: '/admin/notifications',
    icon: 'Bell',
    permission: PERMISSIONS.MANAGE_NOTIFICATIONS,
  },
  {
    label: 'Analytics',
    path: '/admin/analytics',
    icon: 'BarChart3',
    permission: PERMISSIONS.VIEW_ANALYTICS,
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: 'Settings',
  },
];
