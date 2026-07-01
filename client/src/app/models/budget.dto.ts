export interface BudgetDto {
  id: number;
  userId: string;
  amount: number;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  createdAt?: string;
}
