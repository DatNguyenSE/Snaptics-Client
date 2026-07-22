export type TransactionEntrySource = 'manual' | 'snap';

export interface CreateTransactionEntryDto {
  title: string;
  amount: number;
  category: string | null;
  transactionDate: string;
  note: string | null;
  paymentMethod?: string | null;
  imagePreviewUrl?: string | null;
  isAiEstimated?: boolean;
  isExpense: boolean;
  source: TransactionEntrySource;
  budgetId?: number | null;
}

export interface SnapItemExtractionDto {
  itemName: string;
  estimatedAmount: number;
  category: string | null;
  date: string;
  note: string;
}
