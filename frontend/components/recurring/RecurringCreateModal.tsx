'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import { TRANSACTION_CATEGORIES, RECURRING_FREQUENCIES } from '@/lib/constants';

interface RecurringCreateModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  merchantName: string;
  onMerchantNameChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  frequency: string;
  onFrequencyChange: (value: string) => void;
  nextDueDate: string;
  onNextDueDateChange: (value: string) => void;
  submitting: boolean;
}

export default function RecurringCreateModal({
  onClose,
  onSubmit,
  merchantName,
  onMerchantNameChange,
  amount,
  onAmountChange,
  category,
  onCategoryChange,
  frequency,
  onFrequencyChange,
  nextDueDate,
  onNextDueDateChange,
  submitting,
}: RecurringCreateModalProps) {
  return (
    <Modal onClose={onClose} title="Yeni Abonelik / Düzenli Ödeme Ekle" icon={Plus}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Hizmet / Firma Adı</label>
          <input
            type="text"
            required
            placeholder="Örn: Netflix, Turkcell Fatura, Ev Kirası"
            value={merchantName}
            onChange={(e) => onMerchantNameChange(e.target.value)}
            className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Tutar (₺)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="250"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Periyot</label>
            <select
              value={frequency}
              onChange={(e) => onFrequencyChange(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
            >
              {RECURRING_FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Kategori</label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
            >
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Sonraki Ödeme Tarihi</label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => onNextDueDateChange(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 btn-gradient text-white font-medium py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
          >
            {submitting ? 'Kaydediliyor...' : 'Aboneliği Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
