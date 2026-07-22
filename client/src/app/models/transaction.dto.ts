export interface TransactionDetailDto {
  id: number;
  transactionId: number;
  categoryId: number;
  itemName: string;
  categoryName?: string | null;
  price: number;
  quantity: number;
  unit?: string | null;
  estimatedCalories: number | null;
}

export interface TransactionCreatorDto {
  userId: string;
  displayName: string;
  imageUrl?: string | null;
}

export interface TransactionDto {
  id: number;
  name: string | null;
  userId: string;
  imageKey: string | null;
  totalAmount: number;
  transactionDate: string;
  status: number;
  isAiEstimated: boolean;
  createdAt: string;
  note: string | null;
  isExpense: boolean;
  paymentMethod?: string | null;
  imagePreviewUrl?: string | null;
  source?: 'receipt' | 'manual' | 'snap';
  transactionDetails: TransactionDetailDto[];
  // Shared wallet fields
  budgetId?: number | null;
  createdByUserId?: string | null;
  createdByUser?: TransactionCreatorDto | null;
}
