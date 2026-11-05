import { STORAGE_KEYS, USER_STATUS, REPORT_STATUS, SESSION_STATUS } from '../../utils/constants';
import { getStoredItem } from '../../services/storageService';
import { ANALYTICS_DATA } from '../../data/mockData';

export const dashboardService = {
  getStats: () => {
    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const questions = getStoredItem(STORAGE_KEYS.QUESTIONS, []);
    const discussions = getStoredItem(STORAGE_KEYS.DISCUSSIONS, []);
    const sessions = getStoredItem(STORAGE_KEYS.SESSIONS, []);
    const reports = getStoredItem(STORAGE_KEYS.REPORTS, []);

    const activeUsers = users.filter(u => u.status === USER_STATUS.ACTIVE).length;
    const pendingReports = reports.filter(r => r.status === REPORT_STATUS.PENDING || r.status === REPORT_STATUS.UNDER_REVIEW).length;
    const upcomingSessions = sessions.filter(s => s.status === SESSION_STATUS.UPCOMING || s.status === SESSION_STATUS.ONGOING).length;

    // Scale numbers realistically with base demo data
    return {
      totalStudents: 1420 + users.length,
      activeStudents: 1180 + activeUsers,
      totalQuestions: 1640 + questions.length,
      totalDiscussions: 780 + discussions.length,
      totalSessions: 64 + sessions.length,
      pendingReports: pendingReports,
      upcomingSessions: upcomingSessions,
    };
  },

  getRecentSections: () => {
    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const questions = getStoredItem(STORAGE_KEYS.QUESTIONS, []);
    const discussions = getStoredItem(STORAGE_KEYS.DISCUSSIONS, []);
    const sessions = getStoredItem(STORAGE_KEYS.SESSIONS, []);
    const reports = getStoredItem(STORAGE_KEYS.REPORTS, []);
    const activities = getStoredItem(STORAGE_KEYS.ACTIVITIES, []);

    return {
      recentStudents: users.slice(0, 5),
      latestQuestions: questions.slice(0, 5),
      recentDiscussions: discussions.slice(0, 5),
      upcomingSessions: sessions.filter(s => s.status === SESSION_STATUS.UPCOMING || s.status === SESSION_STATUS.ONGOING).slice(0, 4),
      pendingReports: reports.filter(r => r.status === REPORT_STATUS.PENDING || r.status === REPORT_STATUS.UNDER_REVIEW).slice(0, 5),
      recentActivities: activities.slice(0, 6),
    };
  },

  getChartData: () => {
    return {
      growth: ANALYTICS_DATA.growth7d,
      distribution: ANALYTICS_DATA.userDistribution,
      weeklyActivity: ANALYTICS_DATA.weeklyActivity,
    };
  },
};

export default dashboardService;
