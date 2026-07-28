export interface IncomeSourceDto {
  id: number;
  name: string;
  amount: number;
  isRecurring: boolean;
  budgetId: number;
  isActive: boolean;
  createdAt: string;
}

export interface BudgetIncomeSourceDto {
  id?: number;
  budgetId: number;
  incomeSourceId: number;
  allocatedAmount?: number;
  incomeSourceName?: string;
}

