import React, { useState, useEffect } from 'react';
import StatsCards from '../components/StatsCards';
import OverviewChart from '../components/OverviewChart';
import RecentActivity from '../components/RecentActivity';
import dashboardService from '../dashboardService';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { RefreshCw, Download, Sparkles } from 'lucide-react';
import Button from '../../../components/common/Button';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const { admin, role } = useAdminAuth();
  const [stats, setStats] = useState(dashboardService.getStats());
  const [recentData, setRecentData] = useState(dashboardService.getRecentSections());
  const [charts, setCharts] = useState(dashboardService.getChartData());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = () => {
    setStats(dashboardService.getStats());
    setRecentData(dashboardService.getRecentSections());
    setCharts(dashboardService.getChartData());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('learnconnect_storage_update', handleStorage);
    return () => window.removeEventListener('learnconnect_storage_update', handleStorage);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadData();
      setIsRefreshing(false);
      toast.success('Dashboard metrics refreshed');
    }, 400);
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
      {/* Top Greeting & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur-md mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Welcome to LearnConnect HQ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {admin?.name || 'Vikky Podiyam'} 👋
          </h1>
          <p className="mt-1 text-sm text-indigo-200 max-w-xl">
            Here is your live campus intelligence overview for today. All doubt solving, mentorship workshops, and student activities are synchronized.
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
