export interface CategorySummaryItemDto {
  name: string;
  totalAmount: number;
  percentage: number;
}

export interface CategorySummaryResponseDto {
  topCategory: CategorySummaryItemDto | null;
  breakdown: CategorySummaryItemDto[];
}

export interface BarChartDto {
  label: string;
  income: number;
  expense: number;
}

export interface SpendingPeriodDto {
  currentAmount: number;
  previousAmount: number;
  percentageChange: number;
  isBetter: boolean;
}

export interface SpendingComparisonResponseDto {
  week: SpendingPeriodDto;
  month: SpendingPeriodDto;
  year: SpendingPeriodDto;
}

export interface DashboardSummaryDto {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  netSavings?: number;
  filterType?: string;
}

export interface ActiveHourDto {
  hour: number;
  label: string;
  transactionCount: number;
  totalAmount: number;
}

