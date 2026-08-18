'use client';

import React from 'react';
import { Edit2 } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import { TRANSACTION_CATEGORIES } from '@/lib/constants';

interface EditTransactionModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editAmount: string;
  onEditAmountChange: (value: string) => void;
  editIntent: string;
  onEditIntentChange: (value: string) => void;
  editCategory: string;
  onEditCategoryChange: (value: string) => void;
  editMerchant: string;
  onEditMerchantChange: (value: string) => void;
  editDate: string;
  onEditDateChange: (value: string) => void;
  editLoading: boolean;
}

export default function EditTransactionModal({
  onClose,
  onSubmit,
  editAmount,
  onEditAmountChange,
  editIntent,
  onEditIntentChange,
  editCategory,
  onEditCategoryChange,
  editMerchant,
  onEditMerchantChange,
  editDate,
  onEditDateChange,
  editLoading,
}: EditTransactionModalProps) {
  return (
    <Modal onClose={onClose} title="İşlemi Güncelle" icon={Edit2} maxWidth="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block font-medium">Tutar (₺)</label>
            <input
              type="number"
              step="0.01"
              required
              value={editAmount}
              onChange={(e) => onEditAmountChange(e.target.value)}
              className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block font-medium">İşlem Türü</label>
            <select
              value={editIntent}
              onChange={(e) => onEditIntentChange(e.target.value)}
              className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="EXPENSE">Gider (Harcama)</option>
              <option value="INCOME">Gelir</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1.5 block font-medium">Kategori</label>
          <select
            value={editCategory}
            onChange={(e) => onEditCategoryChange(e.target.value)}
            className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
          >
            {TRANSACTION_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1.5 block font-medium">İşyeri / Başlık</label>
          <input
            type="text"
            required
            value={editMerchant}
            onChange={(e) => onEditMerchantChange(e.target.value)}
            className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1.5 block font-medium">İşlem Tarihi</label>
          <input
            type="date"
            required
            value={editDate}
            onChange={(e) => onEditDateChange(e.target.value)}
            className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl text-sm transition-colors cursor-pointer font-medium"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={editLoading}
            className="flex-1 btn-gradient text-white font-medium py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
          >
            {editLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
