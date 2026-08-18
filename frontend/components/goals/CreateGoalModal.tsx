'use client';

import React, { useState } from 'react';
import { Target } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import { GOAL_CATEGORIES } from '@/lib/constants';

interface CreateGoalModalProps {
  onClose: () => void;
  onSubmit: (payload: { title: string; targetAmount: number; currentAmount: number; deadline: string; category: string }) => Promise<boolean | void>;
  submitting: boolean;
}

export default function CreateGoalModal({ onClose, onSubmit, submitting }: CreateGoalModalProps) {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Birikim');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    const ok = await onSubmit({
      title,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount || '0'),
      deadline: deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      category,
    });

    if (ok !== false) {
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('0');
    }
  };

  return (
    <Modal onClose={onClose} title="Yeni Finansal Hedef Tanımla" icon={Target} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Hedef Adı</label>
          <input
            type="text"
            required
            placeholder="Örn: Ev Peşinatı, Araba, Yaz Tatili"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Hedef Tutar (₺)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="100000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Mevcut Birikim (₺)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm font-semibold text-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
            >
              {GOAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Hedef Tarihi</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-200 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 btn-gradient text-white font-medium py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Kaydediliyor...' : 'Hedefi Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
