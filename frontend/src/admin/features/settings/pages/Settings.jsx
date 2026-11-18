import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ClipboardCheck, FolderTree, LockKeyhole, Moon, Palette, ShieldCheck, Sun, Users } from 'lucide-react';
import { useAdminAuth } from '../../../hooks/useAdminAuth';

function QuickLink({ to, icon: Icon, title, detail, tone }) {
  return <Link to={to} className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800">
    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5"/></span>
    <span className="min-w-0 flex-1"><b className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</b><small className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</small></span>
    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-300"/>
  </Link>;
}

export default function Settings() {
  const { admin, role, theme, toggleTheme } = useAdminAuth();
  const isDark = theme === 'dark';
  const initial = (admin?.name || 'Administrator').trim().charAt(0).toUpperCase();

  return <div className="space-y-7">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Workspace preferences</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Manage your console appearance, account details, and workspace shortcuts.</p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"><i className="h-2 w-2 rounded-full bg-emerald-500"/>Workspace active</span>
    </header>

    <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/90 to-emerald-50/80 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-500/10"/>
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-2xl font-extrabold text-white shadow-lg shadow-indigo-900/15">{initial}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Administrator profile</p>
          <h2 className="mt-1.5 truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white">{admin?.name || 'Administrator'}</h2>
          <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{admin?.email || 'Admin email unavailable'}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/80 bg-white/75 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"><ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400"/>{role || admin?.role || 'Admin'}</span>
      </div>
      <div className="relative mt-6 flex items-start gap-2.5 border-t border-indigo-100/80 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-700 dark:text-slate-400"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-300"/><span>Account name, email, and access role are managed by your server configuration.</span></div>
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"><Palette className="h-5 w-5"/></span>
            <div><h2 className="font-semibold text-slate-900 dark:text-white">Appearance</h2><p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">Choose a comfortable theme for the admin console.</p></div>
          </div>
          <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-violet-600 shadow-sm dark:bg-slate-800 dark:text-violet-300">{isDark ? <Moon className="h-5 w-5"/> : <Sun className="h-5 w-5"/>}</span>
              <span><b className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{isDark ? 'Dark theme' : 'Light theme'}</b><small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Preference is saved on this device</small></span>
            </div>
            <button type="button" onClick={toggleTheme} aria-pressed={isDark} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">{isDark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}Switch to {isDark ? 'light' : 'dark'}</button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"><ShieldCheck className="h-5 w-5"/></span>
            <div className="flex-1"><h2 className="font-semibold text-slate-900 dark:text-white">Sign-in & security</h2><p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">Your administrator access is verified by the LearnConnect backend.</p></div>
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 sm:inline-flex"><Check className="h-3.5 w-3.5"/>Active</span>
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-emerald-50/70 p-4 dark:bg-emerald-950/25"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-emerald-600 dark:bg-slate-800 dark:text-emerald-300"><LockKeyhole className="h-4 w-4"/></span><p className="text-xs leading-5 text-emerald-900 dark:text-emerald-200">Use the account menu in the top bar to securely sign out of this device.</p></div>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/70 sm:p-6">
        <div className="mb-4"><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">Quick access</p><h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Workspace controls</h2><p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">Jump to the tools you use to manage the learning hub.</p></div>
        <div className="space-y-3">
          <QuickLink to="/admin/categories" icon={FolderTree} title="Categories & topics" detail="Organize subjects used across student learning spaces." tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"/>
          <QuickLink to="/admin/assignments" icon={ClipboardCheck} title="Assignment submissions" detail="Review student work and share instructor feedback." tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"/>
          <QuickLink to="/admin/users" icon={Users} title="User management" detail="View student accounts, status, and profile details." tone="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"/>
        </div>
      </aside>
    </div>
  </div>;
}
