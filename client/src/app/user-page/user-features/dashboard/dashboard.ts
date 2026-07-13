import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDto } from '../../../models/transaction.dto';
import { environment } from '../../../environments/environment.development';
import { UserHeader } from '../../user-layout/user-header/user-header';
import { TransactionDetailModal } from '../transaction/transaction-detail-modal/transaction-detail-modal';
import { NgApexchartsModule } from 'ng-apexcharts';
import { BudgetService } from '../../../core/services/budget.service';
import { CreateBudgetModal } from './create-budget-modal/create-budget-modal';
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
  label: string;
  value: string;
  icon: string;
  colorClass: string;
  subLabel?: string;
}

export interface UserBudget {
  id: number;
  name: string;
  totalAmount: number;
  isDefault: boolean;
}

export interface CategoryItem {
  label: string;
  amount: number;
  percent: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, UserHeader, DatePipe, TransactionDetailModal, NgApexchartsModule, FormsModule, CreateBudgetModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  protected readonly language = inject(LanguageService);
  private readonly transactionService = inject(TransactionService);
  private readonly budgetService = inject(BudgetService);
  
  totalBudget = 5_000_000;
  isCreateBudgetOpen = false;

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
    return this.totalBudget - this.totalSpent;
  }

  get spentPercentage(): number {
    return Math.min(100, Math.round((this.totalSpent / this.totalBudget) * 100));
  }

  get totalTransactions(): number {
    return this.currentMonthTransactions.length;
  }

  get topCategory(): string {
    const items = this.categoryItems;
    if (!items.length) return '—';
    const top = items[0].label;
    return top.length > 18 ? top.slice(0, 18) + '…' : top;
  }

  get kpiCards(): KpiCard[] {
    return [
      { label: 'Tổng chi tiêu', value: this.formatCurrency(this.totalSpent), icon: 'payments', colorClass: 'kpi-card--violet', subLabel: 'Tháng này' },
      { label: 'Giao dịch', value: String(this.totalTransactions), icon: 'receipt_long', colorClass: 'kpi-card--blue', subLabel: 'Tháng này' },
      { label: 'Top danh mục', value: this.topCategory, icon: 'category', colorClass: 'kpi-card--amber', subLabel: 'Chi nhiều nhất' },
      { label: 'Ngân sách', value: `${this.spentPercentage}%`, icon: 'donut_large', colorClass: this.spentPercentage >= 90 ? 'kpi-card--red' : 'kpi-card--emerald', subLabel: 'Đã sử dụng' },
    ];
  }

  // ─── Category breakdown (thay thế pie chart) ─────────────────────────────
  readonly categoryColors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  get categoryItems(): CategoryItem[] {
    const totals: Record<string, number> = {};
    for (const t of this.currentMonthTransactions) {
      if (t.transactionDetails?.length) {
        for (const d of t.transactionDetails) {
          const cat = d.categoryName || d.itemName || 'Khác';
          totals[cat] = (totals[cat] || 0) + d.price * d.quantity;
        }
      } else {
        const cat = t.name || 'Khác';
        totals[cat] = (totals[cat] || 0) + t.totalAmount;
      }
    }
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const total = sorted.reduce((s, [, v]) => s + v, 0);
    return sorted.map(([label, amount], i) => ({
      label: label.length > 20 ? label.slice(0, 20) + '…' : label,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: this.categoryColors[i % this.categoryColors.length],
    }));
  }

  // ─── AI Message ──────────────────────────────────────────────────────────
  get aiMessage(): string {
    if (this.isLoading) return 'Đang tải dữ liệu tài chính của bạn...';
    if (this.currentMonthTransactions.length === 0) return 'Hãy bắt đầu thêm giao dịch để mình hỗ trợ theo dõi chi tiêu nhé! 🚀';
    if (this.spentPercentage >= 90) return `⚠️ Bạn đã sử dụng ${this.spentPercentage}% ngân sách tháng này. Hãy cẩn thận!`;
    if (this.spentPercentage >= 70) return `Bạn đã dùng ${this.spentPercentage}%. Top: ${this.topCategory}. Theo dõi sát hơn nhé!`;
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
    const now = new Date();
    const weekLabels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5'];
    const weeklyTotals: number[] = [0, 0, 0, 0, 0];
    for (const t of this.currentMonthTransactions) {
      const day = new Date(t.transactionDate).getDate();
      const weekIdx = Math.min(Math.floor((day - 1) / 7), 4);
      weeklyTotals[weekIdx] += t.totalAmount;
    }
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weekCount = Math.ceil(daysInMonth / 7);
    this.lineSeries = [{ name: 'Chi tiêu', data: weeklyTotals.slice(0, weekCount).map((val, i) => ({ x: weekLabels[i], y: val })) } as any];
  }

  // ─── Quick Actions ────────────────────────────────────────────────────────
  readonly quickActions: QuickAction[] = [
    { id: 'scan', labelKey: 'dashboard.quickAction.scan', icon: 'receipt_long', iconClass: 'quick-action__icon--blue', route: '/user/scan' },
    { id: 'capture', labelKey: 'dashboard.quickAction.capture', icon: 'photo_camera', iconClass: 'quick-action__icon--violet', route: '/user/snap-item' },
    { id: 'manual', labelKey: 'dashboard.quickAction.manual', icon: 'edit_square', iconClass: 'quick-action__icon--amber', route: '/user/manual-entry' },
    { id: 'create-budget', labelKey: 'dashboard.quickAction.createBudget', icon: 'account_balance_wallet', iconClass: 'quick-action__icon--emerald' },
  ];

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadTransactions();
    this.loadActiveBudget();
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
    if (action.id === 'create-budget') {
      this.isCreateBudgetOpen = true;
    }
  }

  closeCreateBudgetModal(): void {
    this.isCreateBudgetOpen = false;
    setTimeout(() => {
      const btn = document.getElementById('quick-action-btn-create-budget');
      if (btn) btn.focus();
    }, 50);
  }

  onBudgetCreated(): void {
    this.loadActiveBudget();
    this.loadTransactions();
  }

  private loadActiveBudget(): void {
    this.budgetService.getBudgets().subscribe({
      next: (budgets) => {
        if (budgets && budgets.length > 0) {
          const sorted = [...budgets].sort(
            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          this.totalBudget = sorted[0].amount;
        } else {
          this.totalBudget = 5_000_000;
        }
      },
      error: () => {
        this.totalBudget = 5_000_000;
      }
    });
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
