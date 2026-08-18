'use client';

import { useState } from 'react';
import { getBudgetsSummary, createBudget, deleteBudget } from '@/lib/services/budgetService';
import type { BudgetSummary } from '@/types/transaction';

export function useBudgets() {
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budgetCategory, setBudgetCategory] = useState('Gıda/Market');
  const [budgetLimitAmount, setBudgetLimitAmount] = useState('');
  const [budgetSubmitLoading, setBudgetSubmitLoading] = useState(false);

  const fetchBudgets = (userId: string) => {
    setBudgetLoading(true);
    getBudgetsSummary(userId)
      .then(setBudgets)
      .catch((err) => console.error('Bütçe verileri çekilemedi:', err))
      .finally(() => setBudgetLoading(false));
  };

  const handleBudgetSubmit = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    if (!budgetCategory || !budgetLimitAmount) return;

    setBudgetSubmitLoading(true);
    try {
      await createBudget({
        userId,
        category: budgetCategory,
        limitAmount: parseFloat(budgetLimitAmount),
      });
      setBudgetLimitAmount('');
      fetchBudgets(userId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Bütçe kaydedilirken bir hata oluştu.');
    } finally {
      setBudgetSubmitLoading(false);
    }
  };

  const handleBudgetDelete = async (budgetId: string, userId: string) => {
    if (!confirm('Bu bütçe limitini silmek istediğinize emin misiniz?')) return;

    try {
      await deleteBudget(budgetId);
      fetchBudgets(userId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Bütçe silinirken bir hata oluştu.');
    }
  };

  return {
    budgets,
    budgetLoading,
    budgetCategory,
    setBudgetCategory,
    budgetLimitAmount,
    setBudgetLimitAmount,
    budgetSubmitLoading,
    fetchBudgets,
    handleBudgetSubmit,
    handleBudgetDelete,
  };
}
