import { fetchWithAuth } from '@/lib/apiClient';
import { extractErrorMessage } from './httpErrors';
import type { RecurringItem } from '@/types/recurring';

export interface RecurringSummary {
  items: RecurringItem[];
  monthlyTotal: number;
}

export async function getRecurringItems(userId: string): Promise<RecurringSummary> {
  const res = await fetchWithAuth(`/api/recurring-transactions/${userId}`);
  const data = await res.json();
  if (!Array.isArray(data?.items)) {
    return { items: [], monthlyTotal: 0 };
  }
  return { items: data.items, monthlyTotal: data.monthlyTotal || 0 };
}

export async function detectSubscriptions(userId: string): Promise<{ message: string }> {
  const res = await fetchWithAuth('/api/recurring-transactions/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Abonelikler tespit edilemedi.');
  }
  return data;
}

export interface CreateRecurringItemPayload {
  userId: string;
  merchantName: string;
  amount: number;
  category: string;
  frequency: string;
  nextDueDate: string;
  isActive: boolean;
}

export async function createRecurringItem(payload: CreateRecurringItemPayload): Promise<void> {
  const res = await fetchWithAuth('/api/recurring-transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Abonelik kaydedilemedi.'));
  }
}

export async function deleteRecurringItem(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/recurring-transactions/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Kayıt silinemedi.');
  }
}
