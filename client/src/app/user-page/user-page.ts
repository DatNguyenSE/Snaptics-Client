import { Component } from '@angular/core';
import { UserHeader } from './user-layout/user-header/user-header';
import { Nav } from './user-layout/nav/nav';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  iconClass: string;
}

interface Transaction {
  id: number;
  name: string;
  category: string;
  time: string;
  amount: number;
  icon: string;
  imageUrl?: string | null;
  isAiGenerated: boolean;
  mediaClass: string;
  categoryClass: string;
}

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [UserHeader, Nav],
  templateUrl: './user-page.html',
  styleUrl: './user-page.css',
})
export class UserPage {
  private readonly currencyFormatter = new Intl.NumberFormat('vi-VN');

  readonly totalBudget = 500000;
  readonly totalSpent = 185000;
  readonly remainingBudget = this.totalBudget - this.totalSpent;
  readonly spentPercentage = Math.round((this.totalSpent / this.totalBudget) * 100);

  readonly quickActions: QuickAction[] = [
    {
      id: 'scan',
      label: 'Scan hóa đơn',
      icon: 'receipt_long',
      iconClass: 'quick-action__icon--blue',
    },
    {
      id: 'capture',
      label: 'Chụp món đồ',
      icon: 'photo_camera',
      iconClass: 'quick-action__icon--violet',
    },
    {
      id: 'manual',
      label: 'Nhập thủ công',
      icon: 'edit_square',
      iconClass: 'quick-action__icon--amber',
    },
  ];

  readonly transactions: Transaction[] = [
    {
      id: 1,
      name: 'Ly cafe Catinat',
      category: 'Đồ uống',
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
      name: 'Bún bò Huế',
      category: 'Đồ ăn',
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
      name: 'Grab đến trường',
      category: 'Di chuyển',
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
      name: 'Trà sữa Gong Cha',
      category: 'Đồ uống',
      time: '15:20',
      amount: 43000,
      icon: 'local_cafe',
      imageUrl:
        'https://gongcha.com.vn/wp-content/uploads/2018/06/Hinh-Web-OKINAWA-LATTE.png',
      isAiGenerated: true,
      mediaClass: 'transaction-media--blue',
      categoryClass: 'category-pill--blue',
    },
  ];

  formatCurrency(value: number): string {
    return `${this.currencyFormatter.format(value)}đ`;
  }
}
