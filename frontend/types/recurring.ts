export interface RecurringItem {
  id: string;
  merchantName: string;
  amount: number;
  category: string;
  frequency: string;
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
}
