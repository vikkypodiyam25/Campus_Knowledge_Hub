import React, { useState, useEffect, useCallback } from 'react';
import StatsCards from '../components/StatsCards';
import OverviewChart from '../components/OverviewChart';
import RecentActivity from '../components/RecentActivity';
import dashboardService from '../dashboardService';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { RefreshCw, Download, Video, Users, HelpCircle, MessageSquare, ArrowRight } from 'lucide-react';
import Button from '../../../components/common/Button';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState({ totalStudents: 0, activeStudents: 0, totalQuestions: 0, totalDiscussions: 0, totalSessions: 0, pendingReports: 0, upcomingSessions: 0 });
  const [recentData, setRecentData] = useState({ recentStudents: [], latestQuestions: [], recentDiscussions: [], upcomingSessions: [], pendingReports: [], recentActivities: [] });
  const [charts, setCharts] = useState({ growth: [], distribution: [], weeklyActivity: [] });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const quickLinks = [
    { label: 'Manage students', description: `${stats.totalStudents} registered`, path: '/admin/users', icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/50' },
    { label: 'Review doubts', description: `${stats.totalQuestions} questions`, path: '/admin/questions', icon: HelpCircle, color: 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/50' },
    { label: 'Community discussions', description: `${stats.totalDiscussions} threads`, path: '/admin/discussions', icon: MessageSquare, color: 'text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/50' },
    { label: 'Schedule a meeting', description: `${stats.upcomingSessions} upcoming`, path: '/admin/sessions', icon: Video, color: 'text-cyan-700 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-950/50' },
  ];

  const loadData = useCallback(async () => {
    try {
      const [nextStats, nextRecentData, nextCharts] = await Promise.all([dashboardService.getStats(), dashboardService.getRecentSections(), dashboardService.getChartData()]);
      setStats(nextStats); setRecentData(nextRecentData); setCharts(nextCharts);
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'Could not load admin dashboard data. Check that the backend is running, then retry.');
      toast.error('Could not load admin dashboard data.');
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('learnconnect_storage_update', handleStorage);
    return () => window.removeEventListener('learnconnect_storage_update', handleStorage);
  }, [loadData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadData().finally(() => setIsRefreshing(false));
  };

  const handleExportSummary = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `learnconnect_stats_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Exported dashboard metrics summary');
  };

  return (
    <div className="space-y-6">
      {loadError && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200"><span>{loadError}</span><Button variant="secondary" size="sm" onClick={handleManualRefresh} isLoading={isRefreshing}>Retry</Button></div>}
      {/* Top Greeting & Action Banner */}
      <div className="admin-dashboard-hero flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {admin?.name || 'Administrator'}
          </h1>
          <p className="mt-1 text-sm text-indigo-200 max-w-xl">
            Manage student activity, review community posts, and host learning sessions from one place.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            leftIcon={RefreshCw}
            className="bg-white/10 text-white hover:bg-white/20 border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 backdrop-blur-md"
          >
            Refresh Data
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleExportSummary}
            leftIcon={Download}
            className="bg-indigo-500 hover:bg-indigo-400 text-white border-0 shadow-lg shadow-indigo-600/30"
          >
            Export JSON
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Admin shortcuts">
        {quickLinks.map(({ label, description, path, icon: Icon, color }) => (
          <Link key={path} to={path} className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{label}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span></span>
            <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
          </Link>
        ))}
      </section>

      {/* KPI Stats Cards */}
      <StatsCards stats={stats} />

      {/* Interactive Charts Area */}
      <OverviewChart
        growthData={charts.growth}
        distributionData={charts.distribution}
        weeklyData={charts.weeklyActivity}
      />

      {/* Recent Activity Sections */}
      <RecentActivity recentData={recentData} />
    </div>
  );
};

export default Dashboard;
