import React from 'react';
import { APP_CONFIG } from '../../utils/constants';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const AdminFooter = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white/70 py-4 px-6 text-xs text-slate-500 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {APP_CONFIG.name}
          </span>
          <span>•</span>
          <span>v{APP_CONFIG.version} SaaS Admin</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Operational
          </span>
        </div>

        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            SOC2 Certified Mock Security
          </span>
          <span className="text-slate-400">
            Crafted for Campus Knowledge Hub
          </span>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;
