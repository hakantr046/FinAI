'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, FileText, Bell } from 'lucide-react';
import ThemeToggleButton from '@/components/shared/ThemeToggleButton';

interface DashboardToolbarProps {
  userName: string;
  dateRange: string;
  onRangeChange: (range: string) => void;
  onExport: (format: 'excel' | 'pdf') => void;
}

export default function DashboardToolbar({ userName, dateRange, onRangeChange, onExport }: DashboardToolbarProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h2 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">
          Hoş geldiniz, {userName}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">Finansal durumunuzu, bütçe limitlerinizi ve yapay zeka analizlerinizi tek ekrandan takip edin.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={dateRange}
          onChange={(e) => onRangeChange(e.target.value)}
          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer outline-none"
        >
          <option value="thisMonth">Bu Ay</option>
          <option value="lastMonth">Geçen Ay</option>
          <option value="last30">Son 30 Gün</option>
          <option value="last90">Son 90 Gün</option>
          <option value="yearly">Bu Yıl</option>
          <option value="all">Tüm Zamanlar</option>
        </select>

        <button
          onClick={() => onExport('excel')}
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
          title="Excel / CSV Raporu İndir"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Excel</span>
        </button>

        <button
          onClick={() => onExport('pdf')}
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
          title="PDF Raporu İndir / Yazdır"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>PDF</span>
        </button>

        <button
          onClick={() => router.push('/notifications')}
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer relative"
          title="Bildirim & Anomali Merkezi"
        >
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
        </button>

        <ThemeToggleButton />
      </div>
    </div>
  );
}
