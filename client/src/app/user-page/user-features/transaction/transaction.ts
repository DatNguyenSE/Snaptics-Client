import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../core/services/account-service';
import { LanguageService } from '../../../core/services/language-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDto } from '../../../models/transaction.dto';
import { environment } from '../../../environments/environment.development';
import { TransactionDetailModal } from './transaction-detail-modal/transaction-detail-modal';

export interface StatusBadge {
  label: string;
  cssClass: string;
}

export interface SourceBadge {
  label: string;
  icon: string;
  cssClass: string;
}

export interface TransactionGroup {
  dateLabel: string;
  transactions: TransactionDto[];
}

export interface SummaryStats {
  total: number;
  count: number;
  receiptCount: number;
  manualCount: number;
  snapCount: number;
}

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [DatePipe, TransactionDetailModal, FormsModule],
  templateUrl: './transaction.html',
  styleUrl: './transaction.css',
})
export class Transaction implements OnInit {
  private readonly accountService = inject(AccountService);
  protected readonly language = inject(LanguageService);
  private readonly transactionService = inject(TransactionService);

  transactionHistory: TransactionDto[] = [];
  selectedTransaction: TransactionDto | null = null;
  isLoading = true;
  hasError = false;

  // ─── Filter State ───────────────────────────────────────────────────────────
  searchQuery = '';
  filterSource: 'all' | 'receipt' | 'manual' | 'snap' = 'all';
  filterMonth = ''; // YYYY-MM format

  ngOnInit(): void {
    this.loadTransactions();
  }

  private loadTransactions(): void {
    this.isLoading = true;
    this.hasError = false;

    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.transactionHistory = data;
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  retryLoad(): void {
    this.loadTransactions();
  }

  openTransactionDetail(transaction: TransactionDto) {
    this.transactionService.getTransaction(transaction.id).subscribe({
      next: (fullTransaction) => {
        this.selectedTransaction = fullTransaction;
      },
      error: () => {
        // fallback: show what we already have
        this.selectedTransaction = transaction;
      },
    });
  }

  closeTransactionDetail() {
    this.selectedTransaction = null;
  }

  // ─── Filter Helpers ──────────────────────────────────────────────────────────
  get hasActiveFilters(): boolean {
    return !!(this.searchQuery.trim() || this.filterSource !== 'all' || this.filterMonth);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterSource = 'all';
    this.filterMonth = '';
  }

  setSourceFilter(source: 'all' | 'receipt' | 'manual' | 'snap'): void {
    this.filterSource = source;
  }

  // ─── Computed Data ───────────────────────────────────────────────────────────
  get filteredTransactions(): TransactionDto[] {
    let result = [...this.transactionHistory];
    const q = this.searchQuery.trim().toLowerCase();

    if (q) {
      result = result.filter((t) => {
        const nameMatch = t.name?.toLowerCase().includes(q) ?? false;
        const detailMatch = t.transactionDetails?.some((d) =>
          d.itemName?.toLowerCase().includes(q) || d.categoryName?.toLowerCase().includes(q)
        ) ?? false;
        const noteMatch = t.note?.toLowerCase().includes(q) ?? false;
        return nameMatch || detailMatch || noteMatch;
      });
    }

    if (this.filterSource !== 'all') {
      result = result.filter((t) => t.source === this.filterSource);
    }

    if (this.filterMonth) {
      result = result.filter((t) => {
        const d = new Date(t.transactionDate);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return ym === this.filterMonth;
      });
    }

    return result;
  }

  get groupedTransactions(): TransactionGroup[] {
    const groups = new Map<string, TransactionDto[]>();

    for (const t of this.filteredTransactions) {
      const d = new Date(t.transactionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(t);
    }

    return Array.from(groups.entries()).map(([key, transactions]) => ({
      dateLabel: this.formatGroupDate(key),
      transactions,
    }));
  }

  get summaryStats(): SummaryStats {
    const list = this.transactionHistory;
    return {
      total: list.reduce((sum, t) => sum + t.totalAmount, 0),
      count: list.length,
      receiptCount: list.filter((t) => t.source === 'receipt').length,
      manualCount: list.filter((t) => t.source === 'manual').length,
      snapCount: list.filter((t) => t.source === 'snap').length,
    };
  }

  private formatGroupDate(key: string): string {
    const date = new Date(key + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (isSameDay(date, today)) {
      return this.language.t('notifications.times.today');
    }
    if (isSameDay(date, yesterday)) {
      return this.language.t('notifications.times.yesterday');
    }

    return new Intl.DateTimeFormat(this.language.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  // ─── Badge Helpers ───────────────────────────────────────────────────────────
  getStatusBadge(status: number): StatusBadge {
    switch (status) {
      case 1:
        return { label: this.language.t('transaction.statusCompleted'), cssClass: 'badge--completed' };
      case 0:
        return { label: this.language.t('transaction.statusPending'), cssClass: 'badge--pending' };
      case 2:
        return { label: this.language.t('transaction.statusFailed'), cssClass: 'badge--failed' };
      case 3:
        return { label: this.language.t('transaction.statusCancelled'), cssClass: 'badge--cancelled' };
      default:
        return { label: this.language.t('transaction.statusCompleted'), cssClass: 'badge--completed' };
    }
  }

  getSourceBadge(source: string | undefined): SourceBadge {
    switch (source) {
      case 'receipt':
        return { label: this.language.t('transaction.sourceReceipt'), icon: 'receipt_long', cssClass: 'source-badge--receipt' };
      case 'snap':
        return { label: this.language.t('transaction.sourceSnap'), icon: 'photo_camera', cssClass: 'source-badge--snap' };
      case 'manual':
      default:
        return { label: this.language.t('transaction.sourceManual'), icon: 'edit_square', cssClass: 'source-badge--manual' };
    }
  }

  // ─── Display Helpers (preserved) ─────────────────────────────────────────────
  get initials(): string {
    const fullName = this.accountService.currentUser()?.displayName?.trim() || 'Minh Nguyen';
    const parts = fullName
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return 'M';
    }

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
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

  getCategoryLabel(name: string | null | undefined): string {
    if (!name) {
      return this.language.t('dashboard.category.other');
    }

    const normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const key = `dashboard.category.${normalizedName}`;
    const translated = this.language.t(key);

    return translated === key ? name : translated;
  }
}
