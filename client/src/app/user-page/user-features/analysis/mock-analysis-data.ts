import { TransactionDto } from '../../../models/transaction.dto';
import { BudgetDto } from '../../../core/services/budget.service';

export interface RecurringExpenseDto {
  name: string;
  amount: number;
  period: string;
  nextPaymentDate: string;
  icon: string;
  colorClass: string;
}

export interface MerchantDto {
  name: string;
  logoInitials: string;
  transactionsCount: number;
  totalAmount: number;
  percentageChange: number;
  isUp: boolean;
  colorClass: string;
}

export function getDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(9 + (daysAgo % 5), 15 + (daysAgo % 30), 0, 0);
  return d.toISOString();
}

export const MOCK_RECURRING_EXPENSES: RecurringExpenseDto[] = [
  {
    name: 'Netflix Subscription',
    amount: 260000,
    period: 'H\u00e0ng th\u00e1ng',
    nextPaymentDate: getDateOffset(-5), // 5 days in the future
    icon: 'movie',
    colorClass: 'rec-red'
  },
  {
    name: 'Spotify Premium',
    amount: 59000,
    period: 'H\u00e0ng th\u00e1ng',
    nextPaymentDate: getDateOffset(-12),
    icon: 'music_note',
    colorClass: 'rec-green'
  },
  {
    name: 'Internet Viettel',
    amount: 300000,
    period: 'H\u00e0ng th\u00e1ng',
    nextPaymentDate: getDateOffset(-8),
    icon: 'wifi',
    colorClass: 'rec-blue'
  },
  {
    name: 'Gym California',
    amount: 450000,
    period: 'H\u00e0ng th\u00e1ng',
    nextPaymentDate: getDateOffset(-18),
    icon: 'fitness_center',
    colorClass: 'rec-orange'
  },
  {
    name: 'Google One Cloud',
    amount: 49000,
    period: 'H\u00e0ng th\u00e1ng',
    nextPaymentDate: getDateOffset(-3),
    icon: 'cloud',
    colorClass: 'rec-sky'
  }
];

export const MOCK_MERCHANTS: MerchantDto[] = [
  {
    name: 'Shopee',
    logoInitials: 'SP',
    transactionsCount: 12,
    totalAmount: 2100000,
    percentageChange: 8.5,
    isUp: true,
    colorClass: 'merch-orange'
  },
  {
    name: 'Grab',
    logoInitials: 'GR',
    transactionsCount: 18,
    totalAmount: 2650000,
    percentageChange: 4.2,
    isUp: false,
    colorClass: 'merch-green'
  },
  {
    name: 'Highlands Coffee',
    logoInitials: 'HL',
    transactionsCount: 15,
    totalAmount: 840000,
    percentageChange: 12.0,
    isUp: true,
    colorClass: 'merch-red'
  },
  {
    name: 'WinMart',
    logoInitials: 'WM',
    transactionsCount: 6,
    totalAmount: 1250000,
    percentageChange: 2.1,
    isUp: true,
    colorClass: 'merch-blue'
  },
  {
    name: 'Circle K',
    logoInitials: 'CK',
    transactionsCount: 10,
    totalAmount: 450000,
    percentageChange: 15.4,
    isUp: false,
    colorClass: 'merch-dark'
  }
];

export const MOCK_BUDGETS: BudgetDto[] = [
  {
    id: 1001,
    name: '\u0102n u\u1ed1ng',
    amount: 6000000,
    currentAmount: 5280000,
    isDefault: true,
    startDate: getDateOffset(30),
    endDate: getDateOffset(-30),
    categoryId: 1,
    type: 0
  },
  {
    id: 1002,
    name: 'Di chuy\u1ec3n',
    amount: 3500000,
    currentAmount: 2650000,
    isDefault: false,
    startDate: getDateOffset(30),
    endDate: getDateOffset(-30),
    categoryId: 3,
    type: 0
  },
  {
    id: 1003,
    name: 'Mua s\u1eafm',
    amount: 2000000,
    currentAmount: 2100000,
    isDefault: false,
    startDate: getDateOffset(30),
    endDate: getDateOffset(-30),
    categoryId: 4,
    type: 0
  },
  {
    id: 1004,
    name: 'Gi\u1ea3i tr\u00ed',
    amount: 2500000,
    currentAmount: 1420000,
    isDefault: false,
    startDate: getDateOffset(30),
    endDate: getDateOffset(-30),
    categoryId: 5,
    type: 0
  }
];

export const MOCK_TRANSACTIONS: TransactionDto[] = [
  // --- THU NH\u1eacP (INCOME) ---
  {
    id: 1,
    name: 'L\u01b0\u01a1ng th\u00e1ng hi\u1ec7n t\u1ea1i',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 28500000,
    transactionDate: getDateOffset(5),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(5),
    note: 'L\u01b0\u01a1ng chuy\u1ec3n kho\u1ea3n Techcombank',
    isExpense: false,
    paymentMethod: 'Techcombank',
    source: 'manual',
    transactionDetails: [
      { id: 11, transactionId: 1, categoryId: 10, itemName: 'L\u01b0\u01a1ng th\u00e1ng', price: 28500000, quantity: 1, categoryName: 'Thu nh\u1eadp', estimatedCalories: null, unit: null }
    ]
  },
  {
    id: 2,
    name: 'Freelance Project UI/UX',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 2500000,
    transactionDate: getDateOffset(0), // H\u00f4m nay
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(0),
    note: 'Thanh to\u00e1n \u0111\u1ee3t 1 thi\u1ebft k\u1ebf website',
    isExpense: false,
    paymentMethod: 'V\u00ed MoMo',
    source: 'manual',
    transactionDetails: [
      { id: 21, transactionId: 2, categoryId: 10, itemName: 'Freelance Design', price: 2500000, quantity: 1, categoryName: 'Thu nh\u1eadp', estimatedCalories: null, unit: null }
    ]
  },
  {
    id: 3,
    name: 'L\u01b0\u01a1ng th\u00e1ng tr\u01b0\u1edbc',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 25500000,
    transactionDate: getDateOffset(35),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(35),
    note: 'L\u01b0\u01a1ng chuy\u1ec3n kho\u1ea3n Techcombank th\u00e1ng tr\u01b0\u1edbc',
    isExpense: false,
    paymentMethod: 'Techcombank',
    source: 'manual',
    transactionDetails: [
      { id: 31, transactionId: 3, categoryId: 10, itemName: 'L\u01b0\u01a1ng th\u00e1ng tr\u01b0\u1edbc', price: 25500000, quantity: 1, categoryName: 'Thu nh\u1eadp', estimatedCalories: null, unit: null }
    ]
  },
  {
    id: 4,
    name: 'Freelance Project Mobile App',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 3000000,
    transactionDate: getDateOffset(32),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(32),
    note: 'D\u1ef1 \u00e1n di \u0111\u1ed9ng ho\u00e0n th\u00e0nh',
    isExpense: false,
    paymentMethod: 'V\u00ed MoMo',
    source: 'manual',
    transactionDetails: [
      { id: 41, transactionId: 4, categoryId: 10, itemName: 'Freelance App', price: 3000000, quantity: 1, categoryName: 'Thu nh\u1eadp', estimatedCalories: null, unit: null }
    ]
  },

  // --- \u0102N U\u1ed0NG (FOOD & DRINKS) ---
  {
    id: 101,
    name: 'C\u00e0 ph\u00ea Highlands Coffee',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 65000,
    transactionDate: getDateOffset(0), // H\u00f4m nay
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(0),
    note: 'Mua tr\u00e0 \u0111\u00e0o v\u00e0 b\u00e1nh ng\u1ecdt',
    isExpense: true,
    paymentMethod: 'V\u00ed MoMo',
    source: 'manual',
    transactionDetails: [
      { id: 1011, transactionId: 101, categoryId: 1, itemName: 'Tr\u00e0 \u0111\u00e0o & B\u00e1nh', price: 65000, quantity: 1, categoryName: '\u0102n u\u1ed1ng', estimatedCalories: null, unit: null }
    ]
  },
  {
    id: 102,
    name: 'GrabFood \u0103n tr\u01b0a',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 180000,
    transactionDate: getDateOffset(1),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(1),
    note: 'C\u00f3m t\u1ea5m s\u01b0\u1eddn b\u00ec ch\u1ea3 cho 3 ng\u01b0\u1eddi',
    isExpense: true,
    paymentMethod: 'V\u00ed MoMo',
    source: 'manual',
    transactionDetails: [
      { id: 1021, transactionId: 102, categoryId: 1, itemName: 'C\u00f3m t\u1ea5m', price: 180000, quantity: 1, categoryName: '\u0102n u\u1ed1ng', estimatedCalories: null, unit: null }
    ]
  },
  {
    id: 103,
    name: 'Li\u00ean hoan C\u00f3m ni\u00eau S\u00e0i G\u00f2n',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 5280000,
    transactionDate: getDateOffset(2),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(2),
    note: '\u0102n t\u1ed1i c\u00f9ng \u0111\u1ed3ng nghi\u1ec7p',
    isExpense: true,
    paymentMethod: 'Th\u1ea3 Visa',
    source: 'receipt',
    transactionDetails: [
      { id: 1031, transactionId: 103, categoryId: 1, itemName: 'C\u00f3m ni\u00eau gia \u0111\u00ecnh', price: 5280000, quantity: 1, categoryName: '\u0102n u\u1ed1ng', estimatedCalories: null, unit: null }
    ]
  },
  {
    id: 110,
    name: '\u0102n gia \u0111\u00ecnh th\u00e1ng tr\u01b0\u1edbc',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 4800000,
    transactionDate: getDateOffset(34),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(34),
    note: 'Mua th\u1ef1c ph\u1ea9m th\u00e1ng tr\u01b0\u1edbc',
    isExpense: true,
    paymentMethod: 'Th\u1ea3 Visa',
    source: 'receipt',
    transactionDetails: [
      { id: 1101, transactionId: 110, categoryId: 1, itemName: 'Th\u1ef1c ph\u1ea9m', price: 4800000, quantity: 1, categoryName: '\u0102n u\u1ed1ng', estimatedCalories: null, unit: null }
    ]
  },

  // --- NH\u00c0 \u1ede & H\u00d3A \u0110\u01a1N (HOUSING & BILLS) ---
  {
    id: 201,
    name: 'Ti\u1ec1n nh\u00e0 th\u00e1ng n\u00e0y',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 4500000,
    transactionDate: getDateOffset(5),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(5),
    note: 'Thanh to\u00e1n cho ch\u1ee7 nh\u00e0',
    isExpense: true,
    paymentMethod: 'Techcombank',
    source: 'manual',
    transactionDetails: [
      { id: 2011, transactionId: 201, categoryId: 2, itemName: 'Ti\u1ec1n nh\u00e0', price: 4500000, quantity: 1, categoryName: 'Nh\u00e0 \u1edf', estimatedCalories: null, unit: null }
    ]
  },
  {
    id: 202,
    name: 'Ti\u1ec1n nh\u00e0 th\u00e1ng tr\u01b0\u1edbc',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 4500000,
    transactionDate: getDateOffset(35),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(35),
    note: 'Thanh to\u00e1n th\u00e1ng tr\u01b0\u1edbc',
    isExpense: true,
    paymentMethod: 'Techcombank',
    source: 'manual',
    transactionDetails: [
      { id: 2021, transactionId: 202, categoryId: 2, itemName: 'Ti\u1ec1n nh\u00e0', price: 4500000, quantity: 1, categoryName: 'Nh\u00e0 \u1edf', estimatedCalories: null, unit: null }
    ]
  },

  // --- DI CHUY\u1ec2N (TRAVEL) ---
  {
    id: 301,
    name: 'V\u00e9 m\u00e1y bay Vietjet kh\u1ee9 h\u1ed3i',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 2650000,
    transactionDate: getDateOffset(10),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(10),
    note: 'C\u00f4ng t\u00e1c \u0110\u00e0 N\u1eb5ng',
    isExpense: true,
    paymentMethod: 'Techcombank',
    source: 'manual',
    transactionDetails: [
      { id: 3011, transactionId: 301, categoryId: 3, itemName: 'V\u00e9 m\u00e1y bay', price: 2650000, quantity: 1, categoryName: 'Di chuy\u1ec3n', estimatedCalories: null, unit: null }
    ]
  },
  {
    id: 302,
    name: 'GrabCar th\u00e1ng tr\u01b0\u1edbc',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 2200000,
    transactionDate: getDateOffset(38),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(38),
    note: 'Chi ph\u00ed di chuy\u1ec3n th\u00e1ng tr\u01b0\u1edbc',
    isExpense: true,
    paymentMethod: 'V\u00ed MoMo',
    source: 'manual',
    transactionDetails: [
      { id: 3021, transactionId: 302, categoryId: 3, itemName: 'Grab', price: 2200000, quantity: 1, categoryName: 'Di chuy\u1ec3n', estimatedCalories: null, unit: null }
    ]
  },

  // --- MUA S\u1eaeM (SHOPPING) ---
  {
    id: 401,
    name: 'Mua \u0111\u1ed3 \u0111i\u1ec7n t\u1eed Shopee',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 2100000,
    transactionDate: getDateOffset(8),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(8),
    note: 'B\u00e0n ph\u00edm c\u01a1 v\u00e0 chu\u1ed9t kh\u00f4ng d\u00e2y',
    isExpense: true,
    paymentMethod: 'Ví MoMo',
    source: 'manual',
    transactionDetails: [
      { id: 4011, transactionId: 401, categoryId: 4, itemName: 'B\u00e0n ph\u00edm & Chu\u1ed9t', price: 2100000, quantity: 1, categoryName: 'Mua s\u1eafm', estimatedCalories: null, unit: null }
    ]
  },
  {
    id: 402,
    name: 'Qu\u1ea7n \u00e1o Uniqlo th\u00e1ng tr\u01b0\u1edbc',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 1800000,
    transactionDate: getDateOffset(33),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(33),
    note: 'Mua s\u1eafm trang ph\u1ee5c',
    isExpense: true,
    paymentMethod: 'Th\u1ea3 Visa',
    source: 'receipt',
    transactionDetails: [
      { id: 4021, transactionId: 402, categoryId: 4, itemName: 'Qu\u1ea7n \u00e1o', price: 1800000, quantity: 1, categoryName: 'Mua s\u1eafm', estimatedCalories: null, unit: null }
    ]
  },

  // --- GI\u1ea2I TR\u00cd (ENTERTAINMENT) ---
  {
    id: 501,
    name: 'Ph\u00f2ng Gym v\u00e0 H\u1ecdc ph\u00ed Yoga',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 1420000,
    transactionDate: getDateOffset(15),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(15),
    note: 'Gia h\u1ea1n th\u1ebb h\u1ed9i vi\u00ean',
    isExpense: true,
    paymentMethod: 'Techcombank',
    source: 'manual',
    transactionDetails: [
      { id: 5011, transactionId: 501, categoryId: 5, itemName: 'Gym & Yoga', price: 1420000, quantity: 1, categoryName: 'Gi\u1ea3i tr\u00ed', estimatedCalories: null, unit: null }
    ]
  },
  {
    id: 502,
    name: 'Vui ch\u01a1i th\u00e1ng tr\u01b0\u1edbc',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 1250000,
    transactionDate: getDateOffset(36),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(36),
    note: 'V\u00e9 xem phim v\u00e0 concert',
    isExpense: true,
    paymentMethod: 'Ví MoMo',
    source: 'manual',
    transactionDetails: [
      { id: 5021, transactionId: 502, categoryId: 5, itemName: 'Xem phim d\u1ecbch v\u1ee5', price: 1250000, quantity: 1, categoryName: 'Gi\u1ea3i tr\u00ed', estimatedCalories: null, unit: null }
    ]
  },

  // --- H\u00d3A \u0110\u01a1N & TI\u1ec2N \u00cdCH (BILLS & UTILITIES) ---
  {
    id: 601,
    name: 'H\u00f3a \u0111\u01a1n Internet v\u00e0 \u0110i\u1ec7n tho\u1ea1i',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 1300000,
    transactionDate: getDateOffset(4),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(4),
    note: 'C\u00e1p quang Viettel + n\u1ea1p ti\u1ec1n \u0111t',
    isExpense: true,
    paymentMethod: 'Techcombank',
    source: 'manual',
    transactionDetails: [
      { id: 6011, transactionId: 601, categoryId: 6, itemName: 'Internet & Mobile', price: 1300000, quantity: 1, categoryName: 'H\u00f3a \u0111\u01a1n', estimatedCalories: null, unit: null }
    ]
  },
  {
    id: 602,
    name: 'Internet th\u00e1ng tr\u01b0\u1edbc',
    userId: 'mock-user',
    imageKey: null,
    totalAmount: 1200000,
    transactionDate: getDateOffset(33),
    status: 1,
    isAiEstimated: false,
    createdAt: getDateOffset(33),
    note: 'H\u00f3a \u0111\u01a1n \u0111i\u1ec7n n\u01b0\u1edbc th\u00e1ng tr\u01b0\u1edbc',
    isExpense: true,
    paymentMethod: 'Techcombank',
    source: 'manual',
    transactionDetails: [
      { id: 6021, transactionId: 602, categoryId: 6, itemName: 'H\u00f3a \u0111\u01a1n tr\u01b0\u1edbc', price: 1200000, quantity: 1, categoryName: 'H\u00f3a \u0111\u01a1n', estimatedCalories: null, unit: null }
    ]
  }
];
