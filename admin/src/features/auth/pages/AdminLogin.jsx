import React from 'react';
import LoginForm from '../components/LoginForm';
import { GraduationCap, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AdminLogin = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/30 mb-4">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          LearnConnect Admin
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Campus Knowledge Hub Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200/80 dark:ring-slate-800 rounded-3xl">
          <LoginForm />
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            256-Bit SSL Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Vercel Production Ready
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
