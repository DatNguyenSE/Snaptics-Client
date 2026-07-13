import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDto } from '../../../models/transaction.dto';
import { environment } from '../../../environments/environment.development';
import { UserHeader } from '../../user-layout/user-header/user-header';
import { TransactionDetailModal } from '../transaction/transaction-detail-modal/transaction-detail-modal';

interface QuickAction {
  id: string;
  labelKey: string;
  icon: string;
  iconClass: string;
  route?: string;
}

interface DashboardInsight {
  categoryKey: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, UserHeader, DatePipe, TransactionDetailModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  protected readonly language = inject(LanguageService);
  private readonly transactionService = inject(TransactionService);

  readonly totalBudget = 500000;

  isLoading = true;
  hasError = false;

  recentTransactions: TransactionDto[] = [];
  selectedTransaction: TransactionDto | null = null;

  private allTransactions: TransactionDto[] = [];

  get totalSpent(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return this.allTransactions
      .filter((t) => {
        const d = new Date(t.transactionDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.totalAmount, 0);
  }

  get remainingBudget(): number {
    return this.totalBudget - this.totalSpent;
  }

  get spentPercentage(): number {
    return Math.min(100, Math.round((this.totalSpent / this.totalBudget) * 100));
  }

  readonly quickActions: QuickAction[] = [
    {
      id: 'scan',
      labelKey: 'dashboard.quickAction.scan',
      icon: 'receipt_long',
      iconClass: 'quick-action__icon--blue',
      route: '/user/scan',
    },
    {
      id: 'capture',
      labelKey: 'dashboard.quickAction.capture',
      icon: 'photo_camera',
      iconClass: 'quick-action__icon--violet',
      route: '/user/snap-item',
    },
    {
      id: 'manual',
      labelKey: 'dashboard.quickAction.manual',
      icon: 'edit_square',
      iconClass: 'quick-action__icon--amber',
      route: '/user/manual-entry',
    },
  ];

  readonly aiInsight: DashboardInsight = {
    categoryKey: 'dashboard.category.drinks',
  };

  ngOnInit(): void {
    this.loadTransactions();
  }

  private loadTransactions(): void {
    this.isLoading = true;
    this.hasError = false;

    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.allTransactions = data;
        this.recentTransactions = data.slice(0, 4);
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  openTransactionDetail(transaction: TransactionDto) {
    this.selectedTransaction = transaction;
  }

  closeTransactionDetail() {
    this.selectedTransaction = null;
  }

  formatCurrency(value: number): string {
    return `${new Intl.NumberFormat(this.language.locale()).format(value)}\u0111`;
  }

  isAnalyzedImage(transaction: TransactionDto): boolean {
    return !!this.getImageUrl(transaction);
  }

  getImageUrl(transaction: TransactionDto): string | null {
    if (transaction.imagePreviewUrl) {
      return transaction.imagePreviewUrl;
    }

    if (transaction.imageKey) {
      return `${environment.apiUrl}s3/image?key=${encodeURIComponent(transaction.imageKey)}`;
    }

    return null;
  }

  getIcon(transaction: TransactionDto): string {
    if (transaction.source === 'manual') return 'edit_square';
    if (transaction.source === 'snap') return 'photo_camera';

    if (transaction.transactionDetails?.length > 1) {
      return 'receipt_long';
    }

    if (transaction.transactionDetails?.length === 1) {
      const name = transaction.transactionDetails[0].itemName?.toLowerCase() || '';
      if (name.includes('coffee') || name.includes('tea') || name.includes('drink')) return 'local_cafe';
      if (name.includes('noodle') || name.includes('food') || name.includes('rice')) return 'lunch_dining';
      return 'photo_camera';
    }

    if (transaction.name?.toLowerCase().includes('coffee')) return 'local_cafe';
    if (transaction.name?.toLowerCase().includes('ride') || transaction.name?.toLowerCase().includes('grab')) return 'directions_car';
    return 'receipt_long';
  }

  getMediaClass(transaction: TransactionDto): string {
    if (transaction.transactionDetails?.length > 1) return 'transaction-media--amber';
    if (transaction.transactionDetails?.length === 1) return 'transaction-media--emerald';

    if (transaction.name?.toLowerCase().includes('coffee') || transaction.name?.toLowerCase().includes('tea')) return 'transaction-media--blue';
    if (transaction.name?.toLowerCase().includes('noodle') || transaction.name?.toLowerCase().includes('food')) return 'transaction-media--amber';
    if (transaction.name?.toLowerCase().includes('ride') || transaction.name?.toLowerCase().includes('grab')) return 'transaction-media--emerald';
    return 'transaction-media--blue';
  }

  getCategoryClass(transaction: TransactionDto): string {
    if (transaction.transactionDetails?.length > 1) return 'category-pill--amber';
    if (transaction.transactionDetails?.length === 1) return 'category-pill--emerald';

    if (transaction.name?.toLowerCase().includes('coffee') || transaction.name?.toLowerCase().includes('tea')) return 'category-pill--blue';
    if (transaction.name?.toLowerCase().includes('noodle') || transaction.name?.toLowerCase().includes('food')) return 'category-pill--amber';
    if (transaction.name?.toLowerCase().includes('ride') || transaction.name?.toLowerCase().includes('grab')) return 'category-pill--emerald';
    return 'category-pill--blue';
  }

  getCategoryKey(transaction: TransactionDto): string {
    if (transaction.transactionDetails?.length > 1) {
      return 'dashboard.category.bill';
    }

    if (transaction.transactionDetails?.length === 1) {
      return (
        transaction.transactionDetails[0].categoryName ||
        transaction.transactionDetails[0].itemName ||
        'dashboard.category.other'
      );
    }

    if (transaction.name?.toLowerCase().includes('coffee') || transaction.name?.toLowerCase().includes('tea')) return 'dashboard.category.drinks';
    if (transaction.name?.toLowerCase().includes('noodle') || transaction.name?.toLowerCase().includes('food')) return 'dashboard.category.food';
    if (transaction.name?.toLowerCase().includes('ride') || transaction.name?.toLowerCase().includes('grab')) return 'dashboard.category.travel';
    return 'dashboard.category.other';
  }
}
