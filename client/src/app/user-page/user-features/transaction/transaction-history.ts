export interface TransactionHistoryItem {
  id: number;
  name: string;
  categoryKey: string;
  time: string;
  amount: number;
  icon: string;
  imageUrl?: string | null;
  isAiGenerated: boolean;
  mediaClass: string;
  categoryClass: string;
}

export const TRANSACTION_HISTORY: TransactionHistoryItem[] = [
  {
    id: 1,
    name: 'Catinat Coffee',
    categoryKey: 'dashboard.category.drinks',
    time: '08:30',
    amount: 45000,
    icon: 'local_cafe',
    imageUrl:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=80&h=80&fit=crop&auto=format',
    isAiGenerated: true,
    mediaClass: 'transaction-media--blue',
    categoryClass: 'category-pill--blue',
  },
  {
    id: 2,
    name: 'Hue Beef Noodles',
    categoryKey: 'dashboard.category.food',
    time: '12:15',
    amount: 65000,
    icon: 'lunch_dining',
    imageUrl:
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=80&h=80&fit=crop&auto=format',
    isAiGenerated: false,
    mediaClass: 'transaction-media--amber',
    categoryClass: 'category-pill--amber',
  },
  {
    id: 3,
    name: 'Grab Ride to Campus',
    categoryKey: 'dashboard.category.travel',
    time: '07:45',
    amount: 32000,
    icon: 'directions_car',
    imageUrl: null,
    isAiGenerated: false,
    mediaClass: 'transaction-media--emerald',
    categoryClass: 'category-pill--emerald',
  },
  {
    id: 4,
    name: 'Gong Cha Milk Tea',
    categoryKey: 'dashboard.category.drinks',
    time: '15:20',
    amount: 43000,
    icon: 'local_cafe',
    imageUrl: 'https://gongcha.com.vn/wp-content/uploads/2018/06/Hinh-Web-OKINAWA-LATTE.png',
    isAiGenerated: true,
    mediaClass: 'transaction-media--blue',
    categoryClass: 'category-pill--blue',
  },
];
