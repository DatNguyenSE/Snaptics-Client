import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language-service';
import {
  TRANSACTION_HISTORY,
  TransactionHistoryItem,
} from '../transaction/transaction-history';
import { UserHeader } from '../../user-layout/user-header/user-header';

interface QuickAction {
  id: string;
  labelKey: string;
  icon: string;
  iconClass: string;
}

interface DashboardInsight {
  categoryKey: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, UserHeader],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly language = inject(LanguageService);

  readonly totalBudget = 500000;
  readonly totalSpent = 185000;
  readonly remainingBudget = this.totalBudget - this.totalSpent;
  readonly spentPercentage = Math.round((this.totalSpent / this.totalBudget) * 100);

  readonly quickActions: QuickAction[] = [
    {
      id: 'scan',
      labelKey: 'dashboard.quickAction.scan',
      icon: 'receipt_long',
      iconClass: 'quick-action__icon--blue',
    },
    {
      id: 'capture',
      labelKey: 'dashboard.quickAction.capture',
      icon: 'photo_camera',
      iconClass: 'quick-action__icon--violet',
    },
    {
      id: 'manual',
      labelKey: 'dashboard.quickAction.manual',
      icon: 'edit_square',
      iconClass: 'quick-action__icon--amber',
    },
  ];

  readonly aiInsight: DashboardInsight = {
    categoryKey: 'dashboard.category.drinks',
  };

  readonly recentTransactions: TransactionHistoryItem[] = TRANSACTION_HISTORY;

  formatCurrency(value: number): string {
    return `${new Intl.NumberFormat(this.language.locale()).format(value)}\u0111`;
  }
}
