import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, FolderOpen, HelpCircle, MessageSquare, RefreshCw, Video } from 'lucide-react';
import api from '../../../services/api';
import Button from '../../../components/common/Button';
import toast from 'react-hot-toast';

const sections = [
  { key: 'questions', title: 'Student doubts', description: 'Questions submitted by students from the learning dashboard.', icon: HelpCircle, href: '/admin/questions', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300' },
  { key: 'discussions', title: 'Community discussions', description: 'Posts and conversations shared by the community.', icon: MessageSquare, href: '/admin/discussions', color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300' },
  { key: 'sessions', title: 'Learning meetings', description: 'Student sessions and meetings created by admins.', icon: Video, href: '/admin/sessions', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300' },
];

export default function ContentOverview({ mode = 'content' }) {
  const [records, setRecords] = useState({ questions: [], discussions: [], sessions: [] });
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setRecords({ questions: data.questions || [], discussions: data.discussions || [], sessions: data.sessions || [] });
    } catch (error) {
      toast.error(error.message || 'Could not load platform content.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">LearnConnect workspace</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{mode === 'jobs' ? 'Jobs & opportunities' : mode === 'store' ? 'Store & resources' : 'Platform content'}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Review real content submitted by students and manage sessions hosted by the admin team.</p></div>
      <Button variant="secondary" leftIcon={RefreshCw} onClick={() => { setLoading(true); load(); }}>Refresh</Button>
    </div>
    {mode !== 'content' && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">{mode === 'jobs' ? 'This project does not currently have a job posting feature or job records to display.' : 'This project does not currently have a store or resource catalog to display.'} Below are the live student posts and meeting controls already available.</div>}
    <div className="grid gap-4 md:grid-cols-3">
      {sections.map(section => { const Icon = section.icon; const items = records[section.key]; return <article key={section.key} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><span className={`grid h-11 w-11 place-items-center rounded-xl ${section.color}`}><Icon className="h-5 w-5" /></span><span className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? '—' : items.length}</span></div><h2 className="mt-4 font-semibold text-slate-900 dark:text-white">{section.title}</h2><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500 dark:text-slate-400">{section.description}</p><div className="mt-4 space-y-2">{items.slice(0, 3).map(item => <div key={item.id} className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60"><p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">{item.title}</p><p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{item.author?.name || item.host?.name || item.category || 'Community'}</p></div>)}{!loading && items.length === 0 && <p className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">No records yet.</p>}</div><Link to={section.href} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Open management <ArrowRight className="h-3.5 w-3.5" /></Link></article>; })}
    </div>
    {(mode === 'jobs' || mode === 'store') && <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">{mode === 'jobs' ? <BriefcaseBusiness className="h-5 w-5" /> : <FolderOpen className="h-5 w-5" />}</span><div><h2 className="font-semibold text-slate-900 dark:text-white">{mode === 'jobs' ? 'Job opportunities' : 'Saved resources'}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{mode === 'jobs' ? 'This project does not currently include a job posting feature or job records. The cards above show real student content and meetings you can manage today.' : 'This project does not currently include a store or resource catalog. The cards above show real student content and meetings you can manage today.'}</p></div></div></div>}
  </div>;
}
