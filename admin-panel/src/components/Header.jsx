import React from 'react';
import { Bell, RefreshCw } from 'lucide-react';

export default function Header({ title, subtitle, onRefresh, isRefreshing }) {
  return (
    <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-8 py-5 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
            <span>Refresh</span>
          </button>
        )}

        <div className="h-4 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">Live System</span>
        </div>
      </div>
    </header>
  );
}
