'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import ThemeToggleButton from '@/components/shared/ThemeToggleButton';

interface GoalsHeaderProps {
  onCreateClick: () => void;
}

export default function GoalsHeader({ onCreateClick }: GoalsHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-1">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:text-[var(--primary)] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-white">
            Finansal Hedefler
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
            Birikim hedeflerinizi tanımlayın ve adım adım takip edin.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <ThemeToggleButton variant="sm" />

        <button
          onClick={onCreateClick}
          className="btn-gradient px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Hedef Oluştur</span>
        </button>
      </div>
    </div>
  );
}
