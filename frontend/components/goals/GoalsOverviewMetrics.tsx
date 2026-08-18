'use client';

import React from 'react';
import type { GoalItem } from '@/types/goal';

interface GoalsOverviewMetricsProps {
  goals: GoalItem[];
  totalTargetSum: number;
  totalCurrentSum: number;
  overallProgress: number;
}

export default function GoalsOverviewMetrics({ goals, totalTargetSum, totalCurrentSum, overallProgress }: GoalsOverviewMetricsProps) {
  return (
    <div className="glass-card rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border border-slate-200 dark:border-slate-700">
      <div>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Toplam Biriktirilen</span>
        <div className="text-[24px] font-bold text-emerald-600 my-1">₺{totalCurrentSum.toLocaleString('tr-TR')}</div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hedeflenen ₺{totalTargetSum.toLocaleString('tr-TR')} içinde</span>
      </div>

      <div>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Genel İlerleme</span>
        <div className="text-[24px] font-bold text-[var(--primary)] my-1">%{overallProgress}</div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div className="bg-[var(--primary)] h-full rounded-full transition-all" style={{ width: `${overallProgress}%` }}></div>
        </div>
      </div>

      <div>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aktif Hedef Sayısı</span>
        <div className="text-[24px] font-bold text-slate-900 dark:text-white my-1">{goals.filter((g) => g.status === 'IN_PROGRESS').length} Hedef</div>
        <span className="text-xs text-emerald-600 font-bold">{goals.filter((g) => g.status === 'COMPLETED').length} tamamlandı</span>
      </div>
    </div>
  );
}
