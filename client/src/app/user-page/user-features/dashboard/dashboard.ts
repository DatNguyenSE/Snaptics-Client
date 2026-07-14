import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDto } from '../../../models/transaction.dto';
import { environment } from '../../../environments/environment.development';
import { UserHeader } from '../../user-layout/user-header/user-header';
import { TransactionDetailModal } from '../transaction/transaction-detail-modal/transaction-detail-modal';
import { NgApexchartsModule } from 'ng-apexcharts';
import { BudgetService, BudgetDto } from '../../../core/services/budget.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { CategorySummaryModal } from './category-summary-modal/category-summary-modal';
import { TrendSummaryModal } from './trend-summary-modal/trend-summary-modal';
import { AiAssistant } from '../ai-assistant/ai-assistant';
import type {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexResponsive,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexTooltip,
  ApexFill,
} from 'ng-apexcharts';

// ─── Interfaces ────────────────────────────────────────────────────────────
interface QuickAction {
  id: string;
  labelKey: string;
  icon: string;
  iconClass: string;
  route?: string;
}

interface KpiCard {
  id?: string;
  label: string;
  value: string;
  icon: string;
  colorClass: string;
  subLabel?: string;
  clickable?: boolean;
}

export interface UserBudget {
  id: number;
  name: string;
  totalAmount: number;
  isDefault: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, UserHeader, DatePipe, TransactionDetailModal, NgApexchartsModule, FormsModule, CategorySummaryModal, TrendSummaryModal, AiAssistant],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  protected readonly language = inject(LanguageService);
  private readonly transactionService = inject(TransactionService);
  private readonly budgetService = inject(BudgetService);
  private readonly dashboardService = inject(DashboardService);
  
  totalBudget = 5_000_000;
  isCategorySummaryModalOpen = false;
  isTrendSummaryModalOpen = false;
  topCategoryName = '—';

  allBudgets: BudgetDto[] = [];
  activeBudget: BudgetDto | null = null;
  private scrollTimeout: any;

  @ViewChild('walletCarousel') walletCarousel!: ElementRef<HTMLDivElement>;

  // ─── Loading state ───────────────────────────────────────────────────────
  isLoading = true;
  hasError = false;

  recentTransactions: TransactionDto[] = [];
  selectedTransaction: TransactionDto | null = null;
  private allTransactions: TransactionDto[] = [];

  // ─── KPI ─────────────────────────────────────────────────────────────────
  get currentMonthTransactions(): TransactionDto[] {
    const now = new Date();
    return this.allTransactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }

  get totalSpent(): number {
    return this.currentMonthTransactions.reduce((s, t) => s + t.totalAmount, 0);
  }

  get remainingBudget(): number {
    if (this.activeBudget) {
      return this.activeBudget.currentAmount !== undefined
        ? this.activeBudget.currentAmount
        : Math.max(0, this.activeBudget.amount - this.getBudgetSpent(this.activeBudget));
    }
    return Math.max(0, this.totalBudget - this.totalSpent);
  }

  get spentPercentage(): number {
    const total = this.activeBudget ? this.activeBudget.amount : this.totalBudget;
    const remaining = this.remainingBudget;
    const spent = Math.max(0, total - remaining);
    return Math.min(100, Math.round((spent / total) * 100));
  }

  get totalTransactions(): number {
    return this.currentMonthTransactions.length;
  }

  get kpiCards(): KpiCard[] {
    return [
      { id: 'total-spent', label: 'Tổng chi tiêu', value: this.formatCurrency(this.totalSpent), icon: 'payments', colorClass: 'kpi-card--violet', subLabel: 'Tháng này' },
      { id: 'transactions', label: 'Giao dịch', value: String(this.totalTransactions), icon: 'receipt_long', colorClass: 'kpi-card--blue', subLabel: 'Tháng này' },
      { id: 'top-category', label: 'Top danh mục', value: this.topCategoryName, icon: 'category', colorClass: 'kpi-card--amber', subLabel: 'Chi nhiều nhất', clickable: true },
      { id: 'budget', label: 'Ngân sách', value: `${this.spentPercentage}%`, icon: 'donut_large', colorClass: this.spentPercentage >= 90 ? 'kpi-card--red' : 'kpi-card--emerald', subLabel: 'Đã sử dụng' },
    ];
  }

  openCategorySummaryModal(): void {
    this.isCategorySummaryModalOpen = true;
  }

  closeCategorySummaryModal(): void {
    this.isCategorySummaryModalOpen = false;
  }

  openTrendSummaryModal(): void {
    this.isTrendSummaryModalOpen = true;
  }

  closeTrendSummaryModal(): void {
    this.isTrendSummaryModalOpen = false;
  }

  // ─── AI Message ──────────────────────────────────────────────────────────
  get aiMessage(): string {
    if (this.isLoading) return 'Đang tải dữ liệu tài chính của bạn...';
    if (this.currentMonthTransactions.length === 0) return 'Hãy bắt đầu thêm giao dịch để mình hỗ trợ theo dõi chi tiêu nhé! 🚀';
    if (this.spentPercentage >= 90) return `⚠️ Bạn đã sử dụng ${this.spentPercentage}% ngân sách tháng này. Hãy cẩn thận!`;
    if (this.spentPercentage >= 70) return `Bạn đã dùng ${this.spentPercentage}%. Top: ${this.topCategoryName}. Theo dõi sát hơn nhé!`;
    return `Bạn đang kiểm soát tài chính rất tốt! 💪 Đã chi ${this.spentPercentage}% với ${this.totalTransactions} giao dịch.`;
  }

  // ─── Bar Chart ────────────────────────────────────────────────────────────
  lineSeries: ApexAxisChartSeries = [];
  readonly lineChartOptions = {
    chart: { type: 'bar' as const, height: 220, fontFamily: 'inherit', toolbar: { show: false }, animations: { enabled: false } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
    xaxis: { type: 'category' as const, labels: { style: { fontSize: '11px', colors: '#94a3b8' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: {
      labels: {
        formatter: (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`,
        style: { fontSize: '10px', colors: '#94a3b8' },
      },
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4, yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => this.formatCurrency(v) } },
    fill: { type: 'gradient' as const, gradient: { shade: 'light' as const, type: 'vertical' as const, shadeIntensity: 0.3, gradientToColors: ['#818cf8'], stops: [0, 100] } },
    colors: ['#6366f1'],
  };

  private buildLineData(): void {
    const weekLabels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
    const weeklyTotals: number[] = [0, 0, 0, 0];
    for (const t of this.currentMonthTransactions) {
      const day = new Date(t.transactionDate).getDate();
      const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
      weeklyTotals[weekIdx] += t.totalAmount;
    }
    this.lineSeries = [{ name: 'Chi tiêu', data: weeklyTotals.map((val, i) => ({ x: weekLabels[i], y: val })) } as any];
  }

  // ─── Quick Actions ────────────────────────────────────────────────────────
  readonly quickActions: QuickAction[] = [
    { id: 'scan', labelKey: 'dashboard.quickAction.scan', icon: 'receipt_long', iconClass: 'quick-action__icon--blue', route: '/user/scan' },
    { id: 'capture', labelKey: 'dashboard.quickAction.capture', icon: 'photo_camera', iconClass: 'quick-action__icon--violet', route: '/user/snap-item' },
    { id: 'manual', labelKey: 'dashboard.quickAction.manual', icon: 'edit_square', iconClass: 'quick-action__icon--amber', route: '/user/manual-entry' },
    { id: 'create-budget', labelKey: 'dashboard.quickAction.createBudget', icon: 'account_balance_wallet', iconClass: 'quick-action__icon--emerald', route: '/user/budget' },
  ];

  ngOnInit(): void {
    this.loadTransactions();
    this.loadActiveBudget();
    this.loadTopCategory();
  }

  private loadTopCategory(): void {
    this.dashboardService.getCategorySummary('month').subscribe({
      next: (data) => {
        if (data && data.topCategory) {
          const name = data.topCategory.name;
          this.topCategoryName = name.length > 18 ? name.slice(0, 18) + '…' : name;
        } else {
          this.topCategoryName = '—';
        }
      }
    });
  }

  private loadTransactions(): void {
    this.isLoading = true;
    this.hasError = false;
    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.allTransactions = data;
        this.recentTransactions = data.slice(0, 4);
        this.buildLineData();
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }



  // ─── Transactions ─────────────────────────────────────────────────────────
  openTransactionDetail(t: TransactionDto) { this.selectedTransaction = t; }
  closeTransactionDetail() { this.selectedTransaction = null; }

  // ─── Quick Action Handlers ────────────────────────────────────────────────
  onQuickActionClick(action: QuickAction): void {
    // Other quick actions logic can be added here if needed
  }

  private loadActiveBudget(): void {
    this.budgetService.getBudgets().subscribe({
      next: (budgets) => {
        this.allBudgets = budgets || [];
        if (this.allBudgets.length > 0) {
          // Sort: isDefault wallets first, then by startDate descending
          this.allBudgets.sort((a, b) => {
            const aDefault = a.isDefault ? 1 : 0;
            const bDefault = b.isDefault ? 1 : 0;
            if (aDefault !== bDefault) {
              return bDefault - aDefault;
            }
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          });

          const savedBudgetId = localStorage.getItem('active_budget_id');
          let found = this.allBudgets.find(b => b.id === Number(savedBudgetId));
          if (!found) {
            found = this.allBudgets.find(b => b.isDefault) || this.allBudgets[0];
          }
          this.activeBudget = found;
          this.totalBudget = found.amount;

          // Scroll to the active budget position initially
          const idx = this.allBudgets.findIndex(b => b.id === found.id);
          if (idx > 0) {
            setTimeout(() => {
              this.scrollToWallet(idx);
            }, 300);
          }
        } else {
          this.activeBudget = null;
          this.totalBudget = 5_000_000;
        }
      },
      error: () => {
        this.totalBudget = 5_000_000;
        this.activeBudget = null;
        this.allBudgets = [];
      }
    });
  }

  onWalletScroll(event: Event): void {
    const container = event.target as HTMLDivElement;
    if (!container) return;

    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      const width = container.clientWidth;
      if (width === 0) return;
      const index = Math.round(container.scrollLeft / width);
      
      if (this.allBudgets[index] && this.activeBudget?.id !== this.allBudgets[index].id) {
        const budget = this.allBudgets[index];
        this.activeBudget = budget;
        this.totalBudget = budget.amount;
        localStorage.setItem('active_budget_id', String(budget.id));
      }
    }, 150);
  }

  scrollToWallet(index: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const container = this.walletCarousel?.nativeElement || document.querySelector('.wallet-carousel-container');
    if (!container) return;

    const children = container.querySelectorAll('.stat-card--wallet-item');
    if (children && children[index]) {
      children[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    } else {
      const width = container.clientWidth;
      container.scrollTo({
        left: index * width,
        behavior: 'smooth'
      });
    }
  }

  getBudgetSpentPercent(budget: BudgetDto): number {
    const spent = budget.currentAmount !== undefined 
      ? (budget.amount - budget.currentAmount) 
      : this.getBudgetSpent(budget);
    return Math.min(100, Math.round((spent / budget.amount) * 100));
  }

  getBudgetSpent(budget: BudgetDto): number {
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return this.allTransactions.reduce((sum, t) => {
      const tDate = new Date(t.transactionDate);
      if (tDate >= start && tDate <= end) {
        if (!budget.categoryId) {
          return sum + t.totalAmount;
        } else {
          const catSum = (t.transactionDetails || [])
            .filter(d => d.categoryId === budget.categoryId)
            .reduce((s, d) => s + (d.price * d.quantity), 0);
          return sum + catSum;
        }
      }
      return sum;
    }, 0);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  formatCurrency(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0đ';
    }
    return `${new Intl.NumberFormat(this.language.locale()).format(value)}đ`;
  }

  isAnalyzedImage(t: TransactionDto): boolean { return !!this.getImageUrl(t); }

  getImageUrl(t: TransactionDto): string | null {
    if (t.imagePreviewUrl) return t.imagePreviewUrl;
    if (t.imageKey) return `${environment.apiUrl}s3/image?key=${encodeURIComponent(t.imageKey)}`;
    return null;
  }

  getIcon(t: TransactionDto): string {
    if (t.source === 'manual') return 'edit_square';
    if (t.source === 'snap') return 'photo_camera';
    if (t.transactionDetails?.length > 1) return 'receipt_long';
    if (t.transactionDetails?.length === 1) {
      const name = t.transactionDetails[0].itemName?.toLowerCase() || '';
      if (name.includes('coffee') || name.includes('tea') || name.includes('drink')) return 'local_cafe';
      if (name.includes('noodle') || name.includes('food') || name.includes('rice')) return 'lunch_dining';
      return 'photo_camera';
    }
    if (t.name?.toLowerCase().includes('coffee')) return 'local_cafe';
    if (t.name?.toLowerCase().includes('ride') || t.name?.toLowerCase().includes('grab')) return 'directions_car';
    return 'receipt_long';
  }

  getMediaClass(t: TransactionDto): string {
    if (t.transactionDetails?.length > 1) return 'transaction-media--amber';
    if (t.transactionDetails?.length === 1) return 'transaction-media--emerald';
    if (t.name?.toLowerCase().includes('coffee') || t.name?.toLowerCase().includes('tea')) return 'transaction-media--blue';
    if (t.name?.toLowerCase().includes('noodle') || t.name?.toLowerCase().includes('food')) return 'transaction-media--amber';
    if (t.name?.toLowerCase().includes('ride') || t.name?.toLowerCase().includes('grab')) return 'transaction-media--emerald';
    return 'transaction-media--blue';
  }

  getCategoryClass(t: TransactionDto): string {
    if (t.transactionDetails?.length > 1) return 'category-pill--amber';
    if (t.transactionDetails?.length === 1) return 'category-pill--emerald';
    if (t.name?.toLowerCase().includes('coffee') || t.name?.toLowerCase().includes('tea')) return 'category-pill--blue';
    if (t.name?.toLowerCase().includes('noodle') || t.name?.toLowerCase().includes('food')) return 'category-pill--amber';
    if (t.name?.toLowerCase().includes('ride') || t.name?.toLowerCase().includes('grab')) return 'category-pill--emerald';
    return 'category-pill--blue';
  }

  getCategoryKey(t: TransactionDto): string {
    if (t.transactionDetails?.length > 1) return 'dashboard.category.bill';
    if (t.transactionDetails?.length === 1) return t.transactionDetails[0].categoryName || t.transactionDetails[0].itemName || 'dashboard.category.other';
    if (t.name?.toLowerCase().includes('coffee') || t.name?.toLowerCase().includes('tea')) return 'dashboard.category.drinks';
    if (t.name?.toLowerCase().includes('noodle') || t.name?.toLowerCase().includes('food')) return 'dashboard.category.food';
    if (t.name?.toLowerCase().includes('ride') || t.name?.toLowerCase().includes('grab')) return 'dashboard.category.travel';
    return 'dashboard.category.other';
  }
}
