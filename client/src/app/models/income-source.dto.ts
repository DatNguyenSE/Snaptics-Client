export interface IncomeSourceDto {
  id: number;
  name: string;
  amount: number;
  isRecurring: boolean;
  budgetId: number;
  isActive: boolean;
  createdAt: string;
}
