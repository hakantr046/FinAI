'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useSession } from '@/hooks/useSession';
import { useGoals } from '@/hooks/useGoals';
import GoalsHeader from '@/components/goals/GoalsHeader';
import GoalsOverviewMetrics from '@/components/goals/GoalsOverviewMetrics';
import GoalsGrid from '@/components/goals/GoalsGrid';
import CreateGoalModal from '@/components/goals/CreateGoalModal';
import DepositModal from '@/components/goals/DepositModal';
import AiProjectionModal from '@/components/goals/AiProjectionModal';
import type { GoalItem } from '@/types/goal';

export default function GoalsPage() {
  const { user, isReady } = useSession();
  const {
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
    clearAiProjection,
  } = useGoals(user?.id);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);

  useEffect(() => {
    if (isReady) {
      fetchGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const totalTargetSum = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalCurrentSum = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallProgress = totalTargetSum > 0 ? Math.min(100, Math.round((totalCurrentSum / totalTargetSum) * 100)) : 0;

  return (
    <AppLayout>
      <GoalsHeader onCreateClick={() => setIsGoalModalOpen(true)} />

      <GoalsOverviewMetrics
        goals={goals}
        totalTargetSum={totalTargetSum}
        totalCurrentSum={totalCurrentSum}
        overallProgress={overallProgress}
      />

      <GoalsGrid
        goals={goals}
        loading={loading}
        projectingGoalId={projectingGoalId}
        onDelete={handleDeleteGoal}
        onDeposit={setSelectedGoal}
        onAiProjection={handleAiProjection}
      />

      {aiProjection && <AiProjectionModal projection={aiProjection} onClose={clearAiProjection} />}

      {isGoalModalOpen && (
        <CreateGoalModal
          onClose={() => setIsGoalModalOpen(false)}
          onSubmit={async (payload) => {
            const ok = await handleCreateGoal(payload);
            if (ok !== false) setIsGoalModalOpen(false);
            return ok;
          }}
          submitting={submitting}
        />
      )}

      {selectedGoal && (
        <DepositModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onSubmit={async (goalId, amount) => {
            const ok = await handleDeposit(goalId, amount);
            if (ok !== false) setSelectedGoal(null);
            return ok;
          }}
          depositing={depositing}
        />
      )}
    </AppLayout>
  );
}
