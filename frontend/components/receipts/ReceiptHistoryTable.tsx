'use client';

import React from 'react';
import type { ReceiptHistoryItem } from '@/types/receipt';

interface ReceiptHistoryTableProps {
  history: ReceiptHistoryItem[];
  loading: boolean;
}

export default function ReceiptHistoryTable({ history, loading }: ReceiptHistoryTableProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">Taranan Fiş Geçmişi</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <th className="p-4 border-b border-slate-200 dark:border-slate-700">İşyeri</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700">Kategori</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700">Tutar</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700">Tarih</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700">Durum</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-xs">Yükleniyor...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-xs">Henüz taranmış bir fiş bulunmuyor.</td></tr>
            ) : (
              history.map((rec) => (
                <tr key={rec.id} className="table-row-hover">
                  <td className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-100">{rec.merchantName}</td>
                  <td className="p-4 border-t border-slate-100 dark:border-slate-800"><span className="text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11.5px] font-semibold">{rec.category}</span></td>
                  <td className="p-4 border-t border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100">₺{rec.totalAmount?.toLocaleString('tr-TR')}</td>
                  <td className="p-4 border-t border-slate-100 dark:border-slate-800 text-[12.5px] text-slate-400">{new Date(rec.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      rec.status === 'SAVED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                    }`}>
                      {rec.status === 'SAVED' ? 'İşlendi' : 'Beklemede'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
