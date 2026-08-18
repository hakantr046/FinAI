export interface SystemStats {
  totalUsers: number;
  totalTransactions: number;
  totalVolume: number;
  averageConfidenceScore: number;
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  transactionsCount: number;
  activeBudgetsCount: number;
}
