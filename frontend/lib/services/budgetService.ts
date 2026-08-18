import { fetchWithAuth } from '@/lib/apiClient';
import type { BudgetSummary } from '@/types/transaction';

export async function getBudgetsSummary(userId: string): Promise<BudgetSummary[]> {
  const res = await fetchWithAuth(`/api/budgets/summary/${userId}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export interface CreateBudgetPayload {
  userId: string;
  category: string;
  limitAmount: number;
}

export async function createBudget(payload: CreateBudgetPayload): Promise<void> {
  const res = await fetchWithAuth('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Bütçe kaydedilemedi.');
  }
}

export async function deleteBudget(budgetId: string): Promise<void> {
  const res = await fetchWithAuth(`/api/budgets/${budgetId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Bütçe silinemedi.');
  }
}
