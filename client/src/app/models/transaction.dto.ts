export interface TransactionDetailDto {
  id: number;
  transactionId: number;
  categoryId: number;
  itemName: string;
  price: number;
  quantity: number;
  unit?: string | null;
  estimatedCalories: number | null;
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
  transactionDetails: TransactionDetailDto[];
}
