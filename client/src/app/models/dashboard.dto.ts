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
