export const APP_CONFIG = {
  name: 'LearnConnect',
  version: '2.4.0',
  adminRole: 'Super Admin',
  supportEmail: 'support@learnconnect.edu',
};

export const STORAGE_KEYS = {
  AUTH_ADMIN: 'learnconnect_admin_user',
  THEME: 'learnconnect_admin_theme',
  USERS: 'learnconnect_users_data',
  QUESTIONS: 'learnconnect_questions_data',
  DISCUSSIONS: 'learnconnect_discussions_data',
  SESSIONS: 'learnconnect_sessions_data',
  REPORTS: 'learnconnect_reports_data',
  CATEGORIES: 'learnconnect_categories_data',
  NOTIFICATIONS: 'learnconnect_notifications_data',
  ACTIVITIES: 'learnconnect_activities_data',
  SETTINGS: 'learnconnect_platform_settings',
};

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
};

export const USER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
};

export const QUESTION_STATUS = {
  ANSWERED: 'Answered',
  UNANSWERED: 'Unanswered',
  RESOLVED: 'Resolved',
  REMOVED: 'Removed',
};

export const SESSION_STATUS = {
  UPCOMING: 'Upcoming',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const REPORT_STATUS = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
};

export const REPORT_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const REPORT_CATEGORIES = [
  'Inappropriate questions',
  'Offensive answers',
  'Spam discussions',
  'Inappropriate comments',
  'Fake or misleading content',
];

export const DEFAULT_CATEGORIES = [
  'HTML',
  'CSS',
  'JavaScript',
  'React.js',
  'Node.js',
  'Express.js',
  'MongoDB',
  'Python',
  'Data Structures & Algorithms',
];

export const TARGET_AUDIENCES = [
  { value: 'all', label: 'All Students' },
  { value: 'active', label: 'Active Students Only' },
  { value: 'selected', label: 'Selected Users' },
];

export const NOTIFICATION_TYPES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'maintenance', label: 'System Maintenance' },
  { value: 'event', label: 'Live Event / Workshop' },
  { value: 'policy', label: 'Policy Update' },
  { value: 'alert', label: 'High Priority Alert' },
];
