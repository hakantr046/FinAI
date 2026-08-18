'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  iconClassName?: string;
  hint?: string;
}

export default function MetricCard({ label, value, icon: Icon, iconClassName, hint }: MetricCardProps) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconClassName ?? 'bg-[var(--accent-soft)] text-[var(--primary)]'}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">{value}</div>
      {hint && <div className="mt-1.5 text-[11px] text-slate-400">{hint}</div>}
    </div>
  );
}
