import api from '../../services/api.js';

export const dashboardService = {
  async getStats() { return (await api.get('/admin/dashboard')).data.stats; },
  async getRecentSections() {
    const { data } = await api.get('/admin/dashboard');
    return { recentStudents: data.users.slice(0, 5), latestQuestions: data.questions.slice(0, 5), recentDiscussions: data.discussions.slice(0, 5), upcomingSessions: data.sessions.filter(s => ['Upcoming', 'Ongoing'].includes(s.status)).slice(0, 4), pendingReports: data.reports.filter(r => ['Pending', 'Under Review'].includes(r.status)).slice(0, 5), recentActivities: data.activities.slice(0, 6) };
  },
  async getChartData() { const { data } = await api.get('/admin/dashboard'); return { growth: data.analytics.growth, distribution: data.analytics.distribution, weeklyActivity: data.analytics.weeklyActivity }; },
};

export default dashboardService;
