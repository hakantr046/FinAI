'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import SingleTransactionForm from './SingleTransactionForm';
import CsvImportForm from './CsvImportForm';

interface TransactionInputPanelProps {
  activeTab: 'single' | 'csv';
  onTabChange: (tab: 'single' | 'csv') => void;
  singleFormProps: React.ComponentProps<typeof SingleTransactionForm>;
  csvFormProps: React.ComponentProps<typeof CsvImportForm>;
}

export default function TransactionInputPanel({ activeTab, onTabChange, singleFormProps, csvFormProps }: TransactionInputPanelProps) {
  return (
    <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-700">
      <div className="flex border-b border-slate-200 dark:border-slate-700 pb-3.5 justify-between items-center">
        <div className="flex gap-6">
          <button
            onClick={() => onTabChange('single')}
            className={`pb-3.5 -mb-[15px] px-0.5 text-[13.5px] font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'single'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Tekli Harcama Ekle
          </button>
          <button
            onClick={() => onTabChange('csv')}
            className={`pb-3.5 -mb-[15px] px-0.5 text-[13.5px] font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'csv'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Banka Ekstresi (CSV)
          </button>
        </div>
        <Sparkles className="w-[18px] h-[18px] text-[var(--primary)]" />
      </div>

      {activeTab === 'single' ? <SingleTransactionForm {...singleFormProps} /> : <CsvImportForm {...csvFormProps} />}
    </div>
  );
}
