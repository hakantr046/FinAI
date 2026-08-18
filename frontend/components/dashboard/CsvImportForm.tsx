'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import AlertBanner from '@/components/shared/AlertBanner';

interface CsvImportFormProps {
  csvFile: File | null;
  onCsvFileChange: (file: File | null) => void;
  csvDateCol: string;
  onCsvDateColChange: (value: string) => void;
  csvDescCol: string;
  onCsvDescColChange: (value: string) => void;
  csvAmtCol: string;
  onCsvAmtColChange: (value: string) => void;
  csvLoading: boolean;
  csvSuccessMessage: string | null;
  csvErrorMessage: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CsvImportForm({
  csvFile,
  onCsvFileChange,
  csvDateCol,
  onCsvDateColChange,
  csvDescCol,
  onCsvDescColChange,
  csvAmtCol,
  onCsvAmtColChange,
  csvLoading,
  csvSuccessMessage,
  csvErrorMessage,
  onSubmit,
}: CsvImportFormProps) {
  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Ekstre Dosyası Seç (CSV veya Excel .xlsx)</label>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              required
              onChange={(e) => onCsvFileChange(e.target.files?.[0] || null)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Tarih Kolon Adı</label>
            <input
              type="text"
              required
              value={csvDateCol}
              onChange={(e) => onCsvDateColChange(e.target.value)}
              placeholder="Tarih"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-medium"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Açıklama Kolon Adı</label>
            <input
              type="text"
              required
              value={csvDescCol}
              onChange={(e) => onCsvDescColChange(e.target.value)}
              placeholder="Açıklama"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-medium"
            />
          </div>
        </div>
        <div className="flex gap-4 items-end">
          <div className="w-1/3">
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Tutar Kolon Adı</label>
            <input
              type="text"
              required
              value={csvAmtCol}
              onChange={(e) => onCsvAmtColChange(e.target.value)}
              placeholder="Tutar"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={csvLoading || !csvFile}
            className="bg-[var(--primary)] hover:opacity-90 text-white font-semibold px-7 py-3 rounded-lg flex items-center gap-2 transition-opacity cursor-pointer text-sm disabled:opacity-50"
          >
            {csvLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Ekstreyi Çözümle & Aktar</span>
                <ArrowUpRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
      {csvSuccessMessage && <AlertBanner type="success" message={csvSuccessMessage} />}
      {csvErrorMessage && <AlertBanner type="error" message={csvErrorMessage} />}
    </div>
  );
}
