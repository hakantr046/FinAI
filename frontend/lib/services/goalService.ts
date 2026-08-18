import { fetchWithAuth } from '@/lib/apiClient';
import { extractErrorMessage } from './httpErrors';
import type { GoalItem, GoalAiProjection } from '@/types/goal';

export async function getGoals(userId: string): Promise<GoalItem[]> {
  const res = await fetchWithAuth(`/api/goals/${userId}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export interface CreateGoalPayload {
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

export async function createGoal(payload: CreateGoalPayload): Promise<void> {
  const res = await fetchWithAuth('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Hedef kaydedilemedi.');
  }
}

export async function depositToGoal(goalId: string, amount: number): Promise<void> {
  const res = await fetchWithAuth(`/api/goals/${goalId}/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    throw new Error('Para eklenemedi.');
  }
}

export async function deleteGoal(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/goals/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Hedef silinemedi.');
  }
}

export async function getAiProjection(goalId: string): Promise<GoalAiProjection> {
  const res = await fetchWithAuth(`/api/goals/${goalId}/ai-projection`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'AI Projeksiyonu alınamadı.'));
  }
  return res.json();
}
