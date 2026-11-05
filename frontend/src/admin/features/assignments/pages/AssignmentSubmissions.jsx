import React, { useEffect, useState } from 'react';
import { ClipboardCheck, ExternalLink, RefreshCw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const statuses = ['Submitted', 'In Review', 'Needs Revision', 'Graded'];

export default function AssignmentSubmissions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const load = async () => {
    setLoading(true);
    try { const result = await api.get('/admin/assignment-submissions'); setRows(result.data || []); }
    catch (error) { toast.error(error.message || 'Could not load assignment submissions.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const change = (id, field, value) => setRows(current => current.map(row => row.id === id ? { ...row, [field]: value } : row));
  const review = async row => {
    setSaving(row.id);
    try {
      const result = await api.put(`/admin/assignment-submissions/${encodeURIComponent(row.id)}`, { status: row.status, adminFeedback: row.adminFeedback || '', score: row.score ?? '' });
      setRows(current => current.map(item => item.id === row.id ? result.data : item));
      toast.success('Review saved.');
    } catch (error) { toast.error(error.message || 'Could not save review.'); }
    finally { setSaving(''); }
  };

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Student work</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Assignment submissions</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review student work, leave feedback, and record a score.</p></div><button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><RefreshCw className="h-4 w-4"/>Refresh</button></header>
    <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">Total submissions</p><b className="mt-1 block text-2xl text-slate-900 dark:text-white">{rows.length}</b></div><div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">Awaiting review</p><b className="mt-1 block text-2xl text-amber-600">{rows.filter(row => row.status === 'Submitted').length}</b></div><div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">Needs revision</p><b className="mt-1 block text-2xl text-rose-600">{rows.filter(row => row.status === 'Needs Revision').length}</b></div></div>
    {loading && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Loading submissions…</p>}
    {!loading && !rows.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900"><ClipboardCheck className="mx-auto h-9 w-9 text-slate-400"/><h2 className="mt-3 font-semibold text-slate-900 dark:text-white">No submissions yet</h2><p className="mt-1 text-sm text-slate-500">Student submissions will appear here when they submit an assignment.</p></div>}
    <div className="space-y-4">{rows.map(row => <article key={row.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">{row.schoolCode}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{row.status}</span></div><h2 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{row.assignmentTitle}</h2><p className="mt-1 text-xs text-slate-500">{row.moduleName} · {row.studentName} ({row.studentEmail}) · {new Date(row.submittedAt).toLocaleString()}</p></div>{row.submissionUrl && <a href={row.submissionUrl} target="_blank" rel="noreferrer" className="inline-flex h-fit items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Open attachment <ExternalLink className="h-3.5 w-3.5"/></a>}</div><div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">{row.submissionText}</div><div className="mt-4 grid gap-3 md:grid-cols-[180px_120px_1fr_auto] md:items-end"><label className="grid gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">Review status<select value={row.status} onChange={event => change(row.id, 'status', event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">{statuses.map(status => <option key={status}>{status}</option>)}</select></label><label className="grid gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">Score / 100<input type="number" min="0" max="100" step="1" value={row.score ?? ''} onChange={event => change(row.id, 'score', event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Optional"/></label><label className="grid gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">Feedback<textarea rows="2" maxLength="3000" value={row.adminFeedback || ''} onChange={event => change(row.id, 'adminFeedback', event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Give specific, constructive feedback"/></label><button type="button" onClick={() => review(row)} disabled={saving === row.id} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"><Save className="h-4 w-4"/>{saving === row.id ? 'Saving…' : 'Save review'}</button></div></article>)}</div>
  </div>;
}
