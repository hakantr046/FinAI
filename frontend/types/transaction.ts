export interface ParsedTransaction {
  isSuccessful: boolean;
  intent: string;
  amount: number;
  category: string;
  merchantOrTitle: string;
  transactionDate: string;
  confidenceScore: number;
}

export interface TransactionRecord {
  transactionId: string;
  parsedData: ParsedTransaction;
}

export interface BudgetSummary {
  budgetId: string;
  category: string;
  limitAmount: number;
  currentSpent: number;
  percentage: number;
}
