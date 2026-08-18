export interface GoalItem {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  status: string;
  createdAt: string;
}

export interface GoalAiProjection {
  estimatedCompletionDate: string;
  recommendedMonthlySaving: number;
  adviceText: string;
}
