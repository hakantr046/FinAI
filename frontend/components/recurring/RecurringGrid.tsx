'use client';

import React from 'react';
import { Repeat, Zap, Trash2, Calendar } from 'lucide-react';
import { getFrequencyLabel } from '@/lib/constants';
import type { RecurringItem } from '@/types/recurring';

interface RecurringGridProps {
  items: RecurringItem[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export default function RecurringGrid({ items, loading, onDelete }: RecurringGridProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
        <Repeat className="w-[18px] h-[18px] text-[var(--primary)]" />
        Aktif Abonelikleriniz
      </h2>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Yükleniyor...</div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-700 text-center py-16 text-slate-400 dark:text-slate-500 text-sm space-y-3">
          <Zap className="w-12 h-12 mx-auto opacity-30 text-[var(--primary)]" />
          <p>Henüz kayıtlı tekrarlayan bir ödemeniz bulunmamaktadır.</p>
          <p className="text-xs text-slate-400">"Yapay Zeka ile Tara" butonuna tıklayarak geçmiş işlemlerinizden otomatik tespit yaptırabilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="glass-card border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3.5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-[14.5px] text-slate-900 dark:text-white mb-1">{item.merchantName}</h3>
                  <span className="text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11.5px] font-semibold">
                    {item.category}
                  </span>
                </div>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10.5px] uppercase tracking-wider text-slate-400 block font-bold mb-0.5">Tutar</span>
                  <span className="text-[17px] font-bold text-slate-900 dark:text-white">₺{item.amount.toLocaleString('tr-TR')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10.5px] uppercase tracking-wider text-slate-400 block font-bold mb-0.5">Periyot</span>
                  <span className="text-[12.5px] font-semibold text-[var(--primary)]">{getFrequencyLabel(item.frequency)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Sonraki ödeme: {new Date(item.nextDueDate).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
