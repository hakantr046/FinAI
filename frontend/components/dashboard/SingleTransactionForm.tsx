'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import AlertBanner from '@/components/shared/AlertBanner';

interface SingleTransactionFormProps {
  inputText: string;
  onInputTextChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}

export default function SingleTransactionForm({ inputText, onInputTextChange, onSubmit, loading, error }: SingleTransactionFormProps) {
  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => onInputTextChange(e.target.value)}
            placeholder="Örn: Dün Akbank hesabımdan Trendyol üzerinden 1250 TL giyim alışverişi yaptım"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--primary)] hover:opacity-90 text-white font-semibold px-7 py-3.5 rounded-lg flex items-center justify-center gap-2 transition-opacity text-sm cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Çözümle & Kaydet</span>
              <ArrowUpRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
        <span className="text-slate-400 font-semibold shrink-0">Hızlı örnekler:</span>
        <button
          type="button"
          onClick={() => onInputTextChange('Starbucks 180 TL kahve aldım')}
          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full font-medium transition-colors cursor-pointer hover:border-[var(--primary)]"
        >
          Starbucks 180 TL kahve
        </button>
        <button
          type="button"
          onClick={() => onInputTextChange('Trendyoldan 530 TL giyim alışverişi yapıldı')}
          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full font-medium transition-colors cursor-pointer hover:border-[var(--primary)]"
        >
          Trendyol 530 TL giyim
        </button>
        <button
          type="button"
          onClick={() => onInputTextChange('Migros 450 TL mutfak market alışverişi yapıldı')}
          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full font-medium transition-colors cursor-pointer hover:border-[var(--primary)]"
        >
          Migros 450 TL market
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <AlertBanner type="error" message={error} />
        </div>
      )}
    </div>
  );
}
