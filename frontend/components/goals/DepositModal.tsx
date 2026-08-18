'use client';

import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import type { GoalItem } from '@/types/goal';

interface DepositModalProps {
  goal: GoalItem;
  onClose: () => void;
  onSubmit: (goalId: string, amount: number) => Promise<boolean | void>;
  depositing: boolean;
}

export default function DepositModal({ goal, onClose, onSubmit, depositing }: DepositModalProps) {
  const [depositAmount, setDepositAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount) return;
    const ok = await onSubmit(goal.id, parseFloat(depositAmount));
    if (ok !== false) {
      setDepositAmount('');
    }
  };

  return (
    <Modal onClose={onClose} title={`"${goal.title}" Hedefine Birikim Ekle`} icon={DollarSign} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Eklenen Tasarruf Miktarı (₺)</label>
          <input
            type="number"
            step="0.01"
            required
            placeholder="5000"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full input-light rounded-xl px-3.5 py-2.5 text-base font-bold text-emerald-600"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={depositing}
            className="flex-1 btn-gradient text-white font-medium py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
          >
            {depositing ? 'Ekleniyor...' : 'Birikimi Ekle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
