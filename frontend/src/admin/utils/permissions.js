import { ROLES } from './constants';

export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  TOGGLE_USER_STATUS: 'toggle_user_status',

  // Questions (Doubts)
  MANAGE_QUESTIONS: 'manage_questions',
  EDIT_QUESTIONS: 'edit_questions',
  DELETE_QUESTIONS: 'delete_questions',
  RESOLVE_QUESTIONS: 'resolve_questions',

  // Discussions
  MANAGE_DISCUSSIONS: 'manage_discussions',
  EDIT_DISCUSSIONS: 'edit_discussions',
  DELETE_DISCUSSIONS: 'delete_discussions',
  PIN_DISCUSSIONS: 'pin_discussions',

  // Live Sessions
  MANAGE_SESSIONS: 'manage_sessions',
  APPROVE_SESSIONS: 'approve_sessions',
  CANCEL_SESSIONS: 'cancel_sessions',
  DELETE_SESSIONS: 'delete_sessions',

  // Reports & Moderation
  VIEW_REPORTS: 'view_reports',
  RESOLVE_REPORTS: 'resolve_reports',
  REMOVE_REPORTED_CONTENT: 'remove_reported_content',

  // Categories
  MANAGE_CATEGORIES: 'manage_categories',

  // Notifications & Announcements
  MANAGE_NOTIFICATIONS: 'manage_notifications',

  // Analytics
  VIEW_ANALYTICS: 'view_analytics',

  // Platform & Settings
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_ADMINS: 'manage_admins',
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.TOGGLE_USER_STATUS,
    PERMISSIONS.MANAGE_QUESTIONS,
    PERMISSIONS.EDIT_QUESTIONS,
    PERMISSIONS.RESOLVE_QUESTIONS,
    PERMISSIONS.DELETE_QUESTIONS,
    PERMISSIONS.MANAGE_DISCUSSIONS,
    PERMISSIONS.EDIT_DISCUSSIONS,
    PERMISSIONS.DELETE_DISCUSSIONS,
    PERMISSIONS.PIN_DISCUSSIONS,
    PERMISSIONS.MANAGE_SESSIONS,
    PERMISSIONS.APPROVE_SESSIONS,
    PERMISSIONS.CANCEL_SESSIONS,
    PERMISSIONS.DELETE_SESSIONS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_REPORTS,
  ],

  [ROLES.MODERATOR]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.RESOLVE_REPORTS,
    PERMISSIONS.REMOVE_REPORTED_CONTENT,
    PERMISSIONS.MANAGE_QUESTIONS,
    PERMISSIONS.RESOLVE_QUESTIONS,
    PERMISSIONS.MANAGE_DISCUSSIONS,
  ],
};

/**
 * Checks whether a given role has a specific permission.
 * Note: Frontend permissions are only a UI demonstration for interface controls.
 * True security enforcement must be performed on the backend API layer.
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

/**
 * Checks whether a role can access a specific route or section
 */
export const canAccessRoute = (userRole, route) => {
  if (!userRole) return false;
  if (userRole === ROLES.SUPER_ADMIN) return true;

  switch (route) {
    case '/users':
      return hasPermission(userRole, PERMISSIONS.VIEW_USERS);
    case '/questions':
    case '/doubts':
      return hasPermission(userRole, PERMISSIONS.MANAGE_QUESTIONS);
    case '/discussions':
      return hasPermission(userRole, PERMISSIONS.MANAGE_DISCUSSIONS);
    case '/sessions':
      return hasPermission(userRole, PERMISSIONS.MANAGE_SESSIONS);
    case '/reports':
    case '/moderation':
      return hasPermission(userRole, PERMISSIONS.VIEW_REPORTS);
    case '/categories':
      return hasPermission(userRole, PERMISSIONS.MANAGE_CATEGORIES);
    case '/notifications':
      return hasPermission(userRole, PERMISSIONS.MANAGE_NOTIFICATIONS);
    case '/analytics':
      return hasPermission(userRole, PERMISSIONS.VIEW_ANALYTICS);
    case '/settings':
      return true; // All authenticated admins can view settings/profile
    case '/dashboard':
      return true;
    default:
      return true;
  }
};
