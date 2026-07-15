export interface ReadBillItemDto {
  itemName: string;
  category: string;
  categoryId?: number;
  price: number;
  quantity: number;
  totalPrice: number;
  unit?: string;
}

export interface ReadBillResponseDto {
  merchantName: string | null;
  totalAmount: number;
  transactionDate: string | null;
  billImageKey?: string;
  items: ReadBillItemDto[];
}

export interface CreateTransactionFromBillItemDto {
  itemName: string;
  category: string | null;
  price: number;
  quantity: number;
  unit?: string | null;
}

export interface CreateTransactionFromBillDto {
  merchantName: string | null;
  imageKey?: string | null;
  totalAmount: number;
  transactionDate: string | null;
  items: CreateTransactionFromBillItemDto[];
  isExpense?: boolean;
  note?: string | null;
}
