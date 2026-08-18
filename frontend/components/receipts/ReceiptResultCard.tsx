'use client';

import React from 'react';
import { Sparkles, FileText, Store, CreditCard, Tag, Calendar, CheckCircle2 } from 'lucide-react';
import { TRANSACTION_CATEGORIES } from '@/lib/constants';
import type { ParsedReceiptItem, ReceiptResult } from '@/types/receipt';

interface ReceiptResultCardProps {
  parsedResult: ReceiptResult | null;
  itemsList: ParsedReceiptItem[];
  editMerchant: string;
  onEditMerchantChange: (value: string) => void;
  editAmount: string;
  onEditAmountChange: (value: string) => void;
  editCategory: string;
  onEditCategoryChange: (value: string) => void;
  editDate: string;
  onEditDateChange: (value: string) => void;
  confirming: boolean;
  onConfirm: () => void;
}

export default function ReceiptResultCard({
  parsedResult,
  itemsList,
  editMerchant,
  onEditMerchantChange,
  editAmount,
  onEditAmountChange,
  editCategory,
  onEditCategoryChange,
  editDate,
  onEditDateChange,
  confirming,
  onConfirm,
}: ReceiptResultCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-5 border border-slate-200 dark:border-slate-700">
      <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-700 pb-3.5">
        <Sparkles className="w-[18px] h-[18px] text-[var(--primary)]" />
        AI Analiz Sonucu & Onay
      </h2>

      {!parsedResult ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm space-y-2">
          <FileText className="w-12 h-12 mx-auto opacity-30" />
          <p>Sol taraftan bir fiş görseli yükleyip analiz ettirdiğinizde detaylar burada görünecektir.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-[var(--accent-soft)] border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11.5px] text-slate-500 dark:text-slate-400 font-semibold block">AI Doğruluk Skoru</span>
              <span className="text-[19px] font-bold text-slate-800 dark:text-white">
                %{(parsedResult.confidenceScore * 100).toFixed(0)}
              </span>
            </div>
            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-bold">
              Otomatik Ayrıştırıldı
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                <Store className="w-3.5 h-3.5" /> İşyeri / Mağaza
              </label>
              <input
                type="text"
                value={editMerchant}
                onChange={(e) => onEditMerchantChange(e.target.value)}
                className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Toplam Tutar (₺)
              </label>
              <input
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => onEditAmountChange(e.target.value)}
                className="w-full input-light rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Kategori
              </label>
              <select
                value={editCategory}
                onChange={(e) => onEditCategoryChange(e.target.value)}
                className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
              >
                {TRANSACTION_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Fiş Tarihi
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => onEditDateChange(e.target.value)}
                className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          {itemsList.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Tespit Edilen Ürün Kalemleri</span>
              <div className="max-h-36 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {itemsList.map((item, idx) => (
                  <div key={idx} className="flex justify-between p-2.5 text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                    <span className="text-slate-500 font-mono font-semibold">₺{item.price?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onConfirm}
            disabled={confirming}
            className="w-full btn-gradient py-3 rounded-lg font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {confirming ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Harcama İşlemi Olarak Kaydet</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
