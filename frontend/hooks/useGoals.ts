'use client';

import { useState } from 'react';
import {
  getGoals,
  createGoal,
  depositToGoal,
  deleteGoal,
  getAiProjection,
  type CreateGoalPayload,
} from '@/lib/services/goalService';
import type { GoalItem, GoalAiProjection } from '@/types/goal';

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [aiProjection, setAiProjection] = useState<GoalAiProjection | null>(null);
  const [projectingGoalId, setProjectingGoalId] = useState<string | null>(null);

  const fetchGoals = () => {
    if (!userId) return;
    setLoading(true);
    getGoals(userId)
      .then(setGoals)
      .catch((err) => console.error('Hedefler çekilemedi:', err))
      .finally(() => setLoading(false));
  };

  const handleCreateGoal = async (payload: Omit<CreateGoalPayload, 'userId'>) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await createGoal({ ...payload, userId });
      fetchGoals();
      return true;
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Hedef oluşturulurken bir hata oluştu.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async (goalId: string, amount: number) => {
    setDepositing(true);
    try {
      await depositToGoal(goalId, amount);
      fetchGoals();
      return true;
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Deposit hatası.');
      return false;
    } finally {
      setDepositing(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Bu finansal hedefi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteGoal(id);
      fetchGoals();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleAiProjection = async (goal: GoalItem) => {
    setProjectingGoalId(goal.id);
    setAiProjection(null);
    try {
      const data = await getAiProjection(goal.id);
      setAiProjection(data);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setProjectingGoalId(null);
    }
  };

  return {
    goals,
    loading,
    submitting,
    depositing,
    aiProjection,
    projectingGoalId,
    fetchGoals,
    handleCreateGoal,
    handleDeposit,
    handleDeleteGoal,
    handleAiProjection,
    clearAiProjection: () => setAiProjection(null),
  };
}
