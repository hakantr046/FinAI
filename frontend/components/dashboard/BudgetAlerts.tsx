'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { BudgetSummary } from '@/types/transaction';

interface BudgetAlertsProps {
  budgets: BudgetSummary[];
}

export default function BudgetAlerts({ budgets }: BudgetAlertsProps) {
  const warningBudgets = budgets.filter((b) => b.percentage >= 80);
  if (warningBudgets.length === 0) return null;

  return (
    <div className="space-y-3">
      {warningBudgets.map((budget) => {
        const isOverLimit = budget.percentage >= 100;
        return (
          <div
            key={budget.budgetId}
            className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-300 border backdrop-blur-xl shadow-md ${
              isOverLimit
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300'
                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isOverLimit ? 'bg-rose-100 dark:bg-rose-900/60' : 'bg-amber-100 dark:bg-amber-900/60'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  {isOverLimit ? 'Bütçe Aşımı Uyarısı!' : 'Bütçe Limiti Uyarısı!'}
                </h3>
                <p className="text-xs opacity-90 mt-0.5 font-medium">
                  {budget.category} kategorisindeki aylık bütçe limitiniz {isOverLimit ? 'aşılmıştır' : '%80 seviyesine ulaşmıştır'}.
                  Harcama: ₺{budget.currentSpent.toLocaleString('tr-TR')} / Limit: ₺{budget.limitAmount.toLocaleString('tr-TR')} (%{budget.percentage})
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
