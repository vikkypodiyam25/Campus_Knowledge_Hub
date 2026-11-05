import React, { useState, useEffect, useCallback } from 'react';
import StatsCards from '../components/StatsCards';
import OverviewChart from '../components/OverviewChart';
import RecentActivity from '../components/RecentActivity';
import dashboardService from '../dashboardService';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { RefreshCw, Download, Video, Users, HelpCircle, MessageSquare, ArrowRight, Plus, X } from 'lucide-react';
import Button from '../../../components/common/Button';
import api from '../../../services/api.js';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState({ totalStudents: 0, activeStudents: 0, totalQuestions: 0, totalDiscussions: 0, totalSessions: 0, pendingReports: 0, upcomingSessions: 0 });
  const [recentData, setRecentData] = useState({ recentStudents: [], latestQuestions: [], recentDiscussions: [], upcomingSessions: [], pendingReports: [], recentActivities: [] });
  const [charts, setCharts] = useState({ growth: [], distribution: [], weeklyActivity: [] });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [postType, setPostType] = useState(null);
  const [post, setPost] = useState({ title: '', content: '', category: 'Learning', tags: '' });
  const [savingPost, setSavingPost] = useState(false);
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

  const publishPost = async (event) => {
    event.preventDefault();
    setSavingPost(true);
    try {
      await api.post(`/admin/${postType === 'doubt' ? 'questions' : 'discussions'}`, { ...post, category: postType === 'learning' ? 'Learning' : post.category, tags: post.tags.split(',').map(tag => tag.trim()).filter(Boolean) });
      toast.success(postType === 'doubt' ? 'Doubt shared with students' : 'Learning shared with students');
      setPostType(null);
      setPost({ title: '', content: '', category: 'Learning', tags: '' });
      await loadData();
    } catch (error) { toast.error(error.message || 'Could not publish post'); }
    finally { setSavingPost(false); }
  };

  return (
    <div className="space-y-6">
      {loadError && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200"><span>{loadError}</span><Button variant="secondary" size="sm" onClick={handleManualRefresh} isLoading={isRefreshing}>Retry</Button></div>}
      <section className="flex flex-wrap items-center gap-3" aria-label="Share with students">
        <span className="mr-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Share with students</span>
        <Button variant="secondary" size="sm" leftIcon={HelpCircle} onClick={() => setPostType('doubt')}>Post a doubt</Button>
        <Button variant="secondary" size="sm" leftIcon={Plus} onClick={() => setPostType('learning')}>Share learning</Button>
      </section>
      {postType && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !savingPost) setPostType(null); }}>
        <form onSubmit={publishPost} className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900" aria-labelledby="admin-post-title">
          <div className="flex items-start justify-between"><div><h2 id="admin-post-title" className="text-lg font-bold text-slate-900 dark:text-white">{postType === 'doubt' ? 'Post a doubt' : 'Share learning'}</h2><p className="mt-1 text-sm text-slate-500">This post will appear in the student community.</p></div><button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setPostType(null)} aria-label="Close"><X size={18}/></button></div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Title<input required maxLength={120} value={post.title} onChange={event => setPost(current => ({ ...current, title: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"/></label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{postType === 'doubt' ? 'Question details' : 'What did you learn?'}<textarea required maxLength={5000} rows={5} value={post.content} onChange={event => setPost(current => ({ ...current, content: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"/></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Category<select disabled={postType === 'learning'} value={postType === 'learning' ? 'Learning' : post.category} onChange={event => setPost(current => ({ ...current, category: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"><option>Learning</option><option>Community</option><option>React</option><option>JavaScript</option><option>Node.js</option></select></label><label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Tags<input value={post.tags} onChange={event => setPost(current => ({ ...current, tags: event.target.value }))} placeholder="react, tips" className="mt-1 block w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"/></label></div>
          <div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={() => setPostType(null)}>Cancel</Button><Button variant="primary" type="submit" isLoading={savingPost} leftIcon={Plus}>Publish</Button></div>
        </form>
      </div>}
      {/* Top Greeting & Action Banner */}
      <div className="admin-dashboard-hero flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div>
          <p className="admin-dashboard-kicker">CAMPUS KNOWLEDGE HUB <span>·</span> ADMIN OVERVIEW</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {admin?.name || 'Administrator'}
          </h1>
          <p className="mt-1 text-sm text-indigo-200 max-w-xl">
            Manage student activity, review community posts, and host learning sessions from one place.
          </p>
          <div className="admin-hero-signals"><span><Users size={14}/><b>{stats.totalStudents}</b> students</span><span><Video size={14}/><b>{stats.upcomingSessions}</b> upcoming sessions</span></div>
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
