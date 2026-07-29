import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../core/services/account-service';
import { LanguageService } from '../../../core/services/language-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { BudgetService, BudgetDto } from '../../../core/services/budget.service';
import { CategoryService } from '../../../core/services/category.service';
import { TransactionDto } from '../../../models/transaction.dto';
import { CategoryDto } from '../../../models/category.dto';
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
  totalExpense: number;
  totalIncome: number;
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
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);

  transactionHistory: TransactionDto[] = [];
  budgets: BudgetDto[] = [];
  categories: CategoryDto[] = [];
  selectedTransaction: TransactionDto | null = null;
  isLoading = true;
  hasError = false;

  // ─── Filter State ───────────────────────────────────────────────────────────
  searchQuery = '';
  filterSource: 'all' | 'receipt' | 'manual' | 'snap' = 'all';
  filterBudgetId = 'all'; // 'all', 'personal', or numeric string budget id
  filterDate = '';  // YYYY-MM-DD format
  filterMonth = ''; // Month number, 01-12
  filterYear = '';  // YYYY format

  readonly availableMonths = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1).padStart(2, '0'),
    label: `Tháng ${index + 1}`,
  }));

  ngOnInit(): void {
    this.loadTransactions();
    this.loadBudgets();
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories || [];
      },
      error: () => {
        this.categories = [];
      },
    });
  }

  private loadBudgets(): void {
    this.budgetService.getAllAccessibleBudgets().subscribe({
      next: (data) => {
        this.budgets = data;
      },
      error: () => {},
    });
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
    return !!(
      this.searchQuery.trim() ||
      this.filterSource !== 'all' ||
      this.filterBudgetId !== 'all' ||
      this.filterDate ||
      this.filterMonth ||
      this.filterYear
    );
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterSource = 'all';
    this.filterBudgetId = 'all';
    this.filterDate = '';
    this.filterMonth = '';
    this.filterYear = '';
  }

  getBudgetName(budgetId?: number | null): string {
    if (!budgetId) return 'Ví cá nhân';
    const found = this.budgets.find((b) => b.id === budgetId);
    return found ? found.name : 'Ví dùng chung';
  }

  clearDateFilters(): void {
    this.filterDate = '';
    this.filterMonth = '';
    this.filterYear = '';
  }

  get availableYears(): number[] {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    years.add(currentYear - 1);
    years.add(currentYear - 2);
    for (const t of this.transactionHistory) {
      if (t.transactionDate) {
        years.add(new Date(t.transactionDate).getFullYear());
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }

  setSourceFilter(source: 'all' | 'receipt' | 'manual' | 'snap'): void {
    this.filterSource = source;
  }

  getTransactionSource(t: TransactionDto): 'receipt' | 'manual' | 'snap' {
    if (t.source) return t.source;
    if (!t.imageKey && !t.imagePreviewUrl) return 'manual';
    if (t.transactionDetails && t.transactionDetails.length > 1) return 'receipt';
    return 'snap';
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
      result = result.filter((t) => this.getTransactionSource(t) === this.filterSource);
    }

    if (this.filterBudgetId !== 'all') {
      if (this.filterBudgetId === 'personal') {
        result = result.filter((t) => !t.budgetId);
      } else {
        const targetId = Number(this.filterBudgetId);
        result = result.filter((t) => t.budgetId === targetId);
      }
    }

    if (this.filterDate) {
      result = result.filter((t) => {
        const d = new Date(t.transactionDate);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return ymd === this.filterDate;
      });
    } else if (this.filterMonth) {
      // The month picker supplies YYYY-MM, but the year selector is authoritative.
      // With no selected year, a month always means that month in the current year.
      const selectedMonth = this.filterMonth.padStart(2, '0');
      const targetYear = this.filterYear || String(new Date().getFullYear());
      result = result.filter((t) => {
        const d = new Date(t.transactionDate);
        return String(d.getFullYear()) === targetYear &&
          String(d.getMonth() + 1).padStart(2, '0') === selectedMonth;
      });
    } else if (this.filterYear) {
      result = result.filter((t) => {
        const d = new Date(t.transactionDate);
        return String(d.getFullYear()) === String(this.filterYear);
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
    const list = this.filteredTransactions;
    let totalExpense = 0;
    let totalIncome = 0;
    for (const t of list) {
      if (t.isExpense !== false) {
        totalExpense += t.totalAmount;
      } else {
        totalIncome += t.totalAmount;
      }
    }
    return {
      totalExpense,
      totalIncome,
      count: list.length,
      receiptCount: list.filter((t) => this.getTransactionSource(t) === 'receipt').length,
      manualCount: list.filter((t) => this.getTransactionSource(t) === 'manual').length,
      snapCount: list.filter((t) => this.getTransactionSource(t) === 'snap').length,
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
    const fullName = this.accountService.currentUser()?.displayName?.trim() || 'Người dùng mới';
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
    const details = transaction.transactionDetails;
    if (!details?.length || details.length > 1) {
      return 'ti-receipt';
    }

    const category = this.categories.find((item) => item.id === Number(details[0].categoryId));
    return this.normalizeIconClass(category?.icon);
  }

  getCategoryColor(transaction: TransactionDto): string | null {
    const details = transaction.transactionDetails;
    if (details?.length !== 1) return null;

    return this.categories.find((category) => category.id === Number(details[0].categoryId))?.color || null;
  }

  private normalizeIconClass(icon: string | null | undefined): string {
    const iconClass = icon?.trim().split(/\s+/).find((className) => className.startsWith('ti-'));
    return iconClass || 'ti-help-circle';
  }

  getMediaClass(transaction: TransactionDto): string {
    const icon = this.getIcon(transaction);
    if (icon === 'ti-coffee' || icon === 'ti-home') return 'transaction-media--blue';
    if (icon === 'ti-soup' || icon === 'ti-shopping-cart') return 'transaction-media--amber';
    if (icon === 'ti-car' || icon === 'ti-wallet') return 'transaction-media--emerald';
    if (icon === 'ti-first-aid-kit' || icon === 'ti-device-gamepad') return 'transaction-media--rose';
    return 'transaction-media--purple';
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

  getCategoryDisplayName(transaction: TransactionDto): string {
    const details = transaction.transactionDetails;

    if (details?.length && details.length > 1) {
      return this.language.t('dashboard.category.bill');
    }

    if (details?.length === 1) {
      const detail = details[0];
      const categoryName = detail.categoryName ||
        this.categories.find((category) => category.id === Number(detail.categoryId))?.name;
      return this.getCategoryLabel(categoryName || detail.itemName);
    }

    return this.language.t(this.getCategoryKey(transaction));
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
