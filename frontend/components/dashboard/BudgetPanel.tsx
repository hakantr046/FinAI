'use client';

import React from 'react';
import { Percent, Plus, Target, Trash2 } from 'lucide-react';
import { BudgetSkeleton } from '@/components/Skeleton';
import { TRANSACTION_CATEGORIES } from '@/lib/constants';
import type { BudgetSummary } from '@/types/transaction';

interface BudgetPanelProps {
  budgets: BudgetSummary[];
  budgetLoading: boolean;
  onDeleteBudget: (budgetId: string) => void;
  budgetCategory: string;
  onBudgetCategoryChange: (value: string) => void;
  budgetLimitAmount: string;
  onBudgetLimitAmountChange: (value: string) => void;
  budgetSubmitLoading: boolean;
  onBudgetSubmit: (e: React.FormEvent) => void;
}

export default function BudgetPanel({
  budgets,
  budgetLoading,
  onDeleteBudget,
  budgetCategory,
  onBudgetCategoryChange,
  budgetLimitAmount,
  onBudgetLimitAmountChange,
  budgetSubmitLoading,
  onBudgetSubmit,
}: BudgetPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 glass-card rounded-2xl p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3.5">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Percent className="w-[18px] h-[18px] text-[var(--primary)]" />
            <span>Bütçe Takip Göstergeleri</span>
          </h2>
          <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            Bu ay
          </span>
        </div>

        {budgetLoading ? (
          <div className="space-y-4">
            <BudgetSkeleton />
            <BudgetSkeleton />
            <BudgetSkeleton />
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Henüz Bütçe Limiti Tanımlanmadı</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Sağ taraftaki formdan harcama kategorileriniz için aylık bütçe limitleri ekleyerek bütçenizi kontrol altında tutabilirsiniz.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {budgets.map((budget) => {
              const percent = Math.min(budget.percentage, 100);
              const isOver = budget.percentage >= 100;
              const isWarning = budget.percentage >= 80 && budget.percentage < 100;
              const fillColor = isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-[var(--primary)]';

              return (
                <div key={budget.budgetId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 text-[13.5px]">{budget.category}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isOver
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300'
                          : isWarning
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300'
                            : 'bg-[var(--accent-soft)] text-[var(--primary)]'
                      }`}>
                        %{budget.percentage}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        ₺{budget.currentSpent.toLocaleString('tr-TR')} / ₺{budget.limitAmount.toLocaleString('tr-TR')}
                      </span>
                      <button
                        onClick={() => onDeleteBudget(budget.budgetId)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        title="Bütçe Limitini Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-4 border border-slate-200 dark:border-slate-700">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3.5 flex items-center gap-2.5">
          <Plus className="w-[18px] h-[18px] text-[var(--primary)]" />
          <span>Bütçe Limiti Ekle</span>
        </h2>

        <form onSubmit={onBudgetSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Kategori</label>
            <select
              value={budgetCategory}
              onChange={(e) => onBudgetCategoryChange(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 text-[13.5px] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              {TRANSACTION_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Aylık Limit (₺)</label>
            <input
              type="number"
              required
              step="0.01"
              value={budgetLimitAmount}
              onChange={(e) => onBudgetLimitAmountChange(e.target.value)}
              placeholder="Örn: 5000"
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg px-3 py-2.5 text-[13.5px] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={budgetSubmitLoading}
            className="w-full bg-[var(--primary)] hover:opacity-90 text-white font-semibold py-3 rounded-lg text-sm cursor-pointer flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 mt-1"
          >
            {budgetSubmitLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>Limit Kaydet</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
