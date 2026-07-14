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
