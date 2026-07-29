
import { Component, OnInit, OnDestroy, NgZone, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDto } from '../../../models/transaction.dto';
import { environment } from '../../../environments/environment.development';
import { UserHeader } from '../../user-layout/user-header/user-header';

import { NgApexchartsModule } from 'ng-apexcharts';
import { BudgetService, BudgetDto } from '../../../core/services/budget.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { CategorySummaryModal } from './category-summary-modal/category-summary-modal';
import { TrendSummaryModal } from './trend-summary-modal/trend-summary-modal';
import { AiService } from '../../../core/services/ai.service';
import { ActiveHourDto, SpendingComparisonResponseDto, SpendingPeriodDto } from '../../../models/dashboard.dto';
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

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
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
  imports: [RouterLink, UserHeader, NgApexchartsModule, FormsModule, CategorySummaryModal, TrendSummaryModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  protected readonly language = inject(LanguageService);
  private readonly transactionService = inject(TransactionService);
  private readonly budgetService = inject(BudgetService);
  private readonly dashboardService = inject(DashboardService);
  private readonly aiService = inject(AiService);
  private readonly zone = inject(NgZone);
  
  totalBudget = 0;
  isCategorySummaryModalOpen = false;
  isTrendSummaryModalOpen = false;
  isActiveHoursModalOpen = false;
  topCategoryName = '—';
  activeHours: ActiveHourDto[] = [];
  selectedActiveHour: ActiveHourDto | null = null;

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

  // ─── AI Search State ─────────────────────────────────────────────────────
  aiQuery = '';
  isAiLoading = false;
  aiSuggestions: string[] = [];
  currentAiResponse: { title: string, subtitle: string } | null = null;
  isListening = false;
  voiceError = '';
  private speechRecognition?: SpeechRecognitionLike;
  
  resetAiResponse(): void {
    this.currentAiResponse = null;
  }

  // ─── KPI ─────────────────────────────────────────────────────────────────
  get currentMonthTransactions(): TransactionDto[] {
    const now = new Date();
    return this.allTransactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }

  get totalSpent(): number {
    return this.currentMonthTransactions.filter(t => t.isExpense).reduce((s, t) => s + t.totalAmount, 0);
  }

  get remainingBudget(): number {
    if (this.activeBudget) {
      const spent = this.activeBudget.currentAmount !== undefined
        ? this.activeBudget.amount - this.activeBudget.currentAmount
        : this.getBudgetSpent(this.activeBudget);
      return Math.max(0, this.activeBudget.amount - spent);
    }
    return Math.max(0, this.totalBudget - this.totalSpent);
  }

  get spentPercentage(): number {
    const total = this.activeBudget ? this.activeBudget.amount : this.totalBudget;
    if (!Number.isFinite(total) || total <= 0) return 0;
    const remaining = this.remainingBudget;
    const spent = Math.max(0, total - remaining);
    return Math.min(100, Math.round((spent / total) * 100));
  }

  get spentPercentageLabel(): string {
    const total = this.activeBudget ? this.activeBudget.amount : this.totalBudget;
    return Number.isFinite(total) && total > 0 ? `${this.spentPercentage}%` : '-';
  }

  get totalTransactions(): number {
    return this.currentMonthTransactions.length;
  }

  private get activeWalletExpenses(): TransactionDto[] {
    if (!this.activeBudget) return [];

    const start = new Date(this.activeBudget.startDate);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    return this.allTransactions.filter(t => {
      const date = new Date(t.transactionDate);
      return t.isExpense
        && !t.isDeleted
        && t.budgetId === this.activeBudget?.id
        && date >= start
        && date <= now;
    });
  }

  private get activeWalletElapsedDays(): number {
    if (!this.activeBudget) return 0;

    const start = new Date(this.activeBudget.startDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1);
  }

  get activeWalletAverageDailySpend(): number {
    if (!this.activeBudget || this.activeBudget.type === 1) return 0;
    const spent = this.activeWalletExpenses.reduce((sum, t) => sum + t.totalAmount, 0);
    return spent / this.activeWalletElapsedDays;
  }

  get activeWalletAverageComparisonLabel(): string {
    if (!this.activeBudget || this.activeWalletElapsedDays <= 0) return 'Chưa đủ dữ liệu';

    const currentStart = new Date(this.activeBudget.startDate);
    currentStart.setHours(0, 0, 0, 0);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - this.activeWalletElapsedDays);
    const previousSpent = this.allTransactions
      .filter(t => {
        const date = new Date(t.transactionDate);
        return t.isExpense
          && !t.isDeleted
          && t.budgetId === this.activeBudget?.id
          && date >= previousStart
          && date < currentStart;
      })
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const previousAverage = previousSpent / this.activeWalletElapsedDays;
    const currentAverage = this.activeWalletAverageDailySpend;

    if (previousAverage <= 0) return 'Chưa có kỳ trước để so sánh';
    const change = Math.round(((currentAverage - previousAverage) / previousAverage) * 100);
    return `${change >= 0 ? 'Tăng' : 'Giảm'} ${Math.abs(change)}% so với kỳ trước`;
  }

  formatPercentageChange(value: number | null | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
    return `${value >= 0 ? 'Tăng' : 'Giảm'} ${Math.abs(value)}%`;
  }

  get kpiCards(): KpiCard[] {
    return [
      { id: 'total-spent', label: 'Tổng chi tiêu', value: this.formatCurrency(this.totalSpent), icon: 'payments', colorClass: 'kpi-card--violet', subLabel: 'Tháng này', clickable: true },
      { id: 'average-daily-spend', label: 'Chi tiêu TB/ngày', value: this.formatCurrency(this.activeWalletAverageDailySpend), icon: 'speed', colorClass: 'kpi-card--blue', subLabel: this.activeWalletAverageComparisonLabel, clickable: true },
      { id: 'top-category', label: 'Top danh mục', value: this.topCategoryName, icon: 'category', colorClass: 'kpi-card--amber', subLabel: 'Chi nhiều nhất', clickable: true },
      { id: 'active-hours', label: 'Khung giờ sôi động', value: this.activeHours[0]?.label || '-', icon: 'schedule', colorClass: 'kpi-card--emerald', subLabel: this.activeHours[0] ? `${this.activeHours[0].transactionCount} giao dịch` : 'Chưa có dữ liệu', clickable: true },
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

  openActiveHoursModal(): void {
    this.isActiveHoursModalOpen = true;
  }

  closeActiveHoursModal(): void {
    this.isActiveHoursModalOpen = false;
  }

  onKpiCardClick(card: KpiCard): void {
    if (card.id === 'top-category') {
      this.openCategorySummaryModal();
    } else if (card.id === 'total-spent') {
      this.openTrendSummaryModal();
    } else if (card.id === 'average-daily-spend' || card.id === 'active-hours') {
      this.openActiveHoursModal();
    }
  }

  // ─── AI Message ──────────────────────────────────────────────────────────
  get aiMessage(): string {
    if (this.isLoading) return 'Đang tải dữ liệu tài chính của bạn...';
    if (this.currentMonthTransactions.length === 0) return 'Hãy bắt đầu thêm giao dịch để mình hỗ trợ theo dõi chi tiêu nhé! 🚀';
    if (this.spentPercentage >= 90) return `⚠️ Bạn đã sử dụng ${this.spentPercentageLabel} ngân sách tháng này. Hãy cẩn thận!`;
    if (this.spentPercentage >= 70) return `Bạn đã dùng ${this.spentPercentageLabel}. Top: ${this.topCategoryName}. Theo dõi sát hơn nhé!`;
    return `Bạn đang kiểm soát tài chính rất tốt! 💪 Đã chi ${this.spentPercentageLabel} với ${this.totalTransactions} giao dịch.`;
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
    { id: 'resources', labelKey: 'dashboard.quickAction.resources', icon: 'payments', iconClass: 'quick-action__icon--blue', route: '/user/in-come-source' },
    { id: 'my-category', labelKey: 'dashboard.quickAction.myCategory', icon: 'category', iconClass: 'quick-action__icon--rose', route: '/user/category' },
    { id: 'review', labelKey: 'dashboard.quickAction.review', icon: 'speed', iconClass: 'quick-action__icon--amber', route: '/user/frequency' },
    { id: 'create-budget', labelKey: 'dashboard.quickAction.createBudget', icon: 'account_balance_wallet', iconClass: 'quick-action__icon--emerald', route: '/user/budget' },
    { id: 'analysis', labelKey: 'dashboard.quickAction.capture', icon: 'analytics', iconClass: 'quick-action__icon--violet', route: '/user/analysis' },
    { id: 'manual-entry', labelKey: 'dashboard.quickAction.quickEntry', icon: 'post_add', iconClass: 'quick-action__icon--cyan', route: '/user/manual-entry' },
  ];

  isQuickActionsExpanded: boolean = false;

  toggleQuickActions(): void {
    this.isQuickActionsExpanded = !this.isQuickActionsExpanded;
  }

  getVisibleQuickActions(): QuickAction[] {
    if (this.isQuickActionsExpanded) {
      return this.quickActions;
    }
    return this.quickActions.slice(0, 4);
  }

  // ─── Spending Comparison ──────────────────────────────────────────────────
  spendingComparison: SpendingComparisonResponseDto | null = null;
  selectedSpendingTab: 'week' | 'month' | 'year' = 'week';

  get currentSpendingPeriod(): SpendingPeriodDto | null {
    if (!this.spendingComparison) return null;
    return this.spendingComparison[this.selectedSpendingTab];
  }
  setSpendingTab(tab: 'week' | 'month' | 'year', event: Event): void {
    event.stopPropagation(); // prevent clicking the card
    this.selectedSpendingTab = tab;
  }

  ngOnInit(): void {
    this.initAiSuggestions();
    this.loadTransactions();
    this.loadSpendingComparison();
    this.loadActiveHours();
    this.loadActiveBudget();
  }

  ngOnDestroy(): void {
    this.speechRecognition?.stop();
  }

  private initAiSuggestions(): void {
    this.aiSuggestions = [
      this.language.t('dashboard.aiSuggestions.howMuch'),
      this.language.t('dashboard.aiSuggestions.compare'),
      this.language.t('dashboard.aiSuggestions.momBreakfast'),
      this.language.t('dashboard.aiSuggestions.savings')
    ];
  }

  fillAiQuery(suggestion: string): void {
    this.aiQuery = suggestion;
  }

  startVoiceInput(): void {
    if (this.isListening) return;

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.voiceError = this.isEnglish
        ? 'Voice input is not supported by this browser.'
        : 'Trình duyệt này chưa hỗ trợ nhập bằng giọng nói.';
      return;
    }

    this.voiceError = '';
    const recognition = new SpeechRecognition();
    this.speechRecognition = recognition;
    recognition.lang = this.isEnglish ? 'en-US' : 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = 0; index < event.results.length; index++) {
        transcript += event.results[index][0].transcript;
      }
      // Web Speech events can fire outside Angular's change-detection zone.
      this.zone.run(() => {
        this.aiQuery = transcript;
      });
    };
    recognition.onerror = (event) => {
      this.zone.run(() => {
        this.isListening = false;
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          this.voiceError = event.error === 'not-allowed'
            ? (this.isEnglish ? 'Please allow microphone access.' : 'Vui lòng cho phép truy cập micro.')
            : (this.isEnglish ? 'Could not recognize your voice.' : 'Không thể nhận diện giọng nói.');
        }
      });
    };
    recognition.onend = () => {
      this.zone.run(() => {
        this.isListening = false;
        this.speechRecognition = undefined;
      });
    };

    try {
      recognition.start();
      this.isListening = true;
    } catch {
      this.isListening = false;
      this.voiceError = this.isEnglish ? 'Could not start microphone.' : 'Không thể bật micro.';
    }
  }

  stopVoiceInput(): void {
    if (!this.isListening) return;
    this.speechRecognition?.stop();
  }

  onVoicePointerDown(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.startVoiceInput();
  }

  onVoicePointerUp(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    this.stopVoiceInput();
  }

  get isEnglish(): boolean {
    return this.language.currentLang() === 'en';
  }

  submitAiQuery(): void {
    if (!this.aiQuery.trim()) return;
    
    this.isAiLoading = true;
    const query = this.aiQuery;
    
    this.aiService.ask(query).subscribe({
      next: (response) => {
        this.currentAiResponse = { 
          title: "Trợ lý Roni ", 
          subtitle: response.reply 
        };
        
        // No need to call these here, because refreshTransactions will emit new data
        // and getTransactions().subscribe will handle reloading these components
        this.transactionService.refreshTransactions();
        this.loadActiveBudget();
      },
      error: (err) => {
        console.error(err);
        this.currentAiResponse = { 
          title: "Lỗi kết nối", 
          subtitle: "Roni đang bận hoặc có lỗi xảy ra, bạn thử lại sau nhé." 
        };
      },
      complete: () => {
        this.isAiLoading = false;
        this.aiQuery = '';
      }
    });
  }

  private loadSpendingComparison(): void {
    this.dashboardService.getSpendingComparison().subscribe({
      next: (data) => {
        this.spendingComparison = data;
      },
      error: () => {
        this.spendingComparison = null;
      },
    });
  }

  private loadActiveHours(): void {
    const now = new Date();
    this.dashboardService.getActiveHours(now.getMonth() + 1, now.getFullYear()).subscribe({
      next: (data) => {
        this.activeHours = data || [];
        this.selectedActiveHour = this.activeHours[0] || null;
      },
      error: () => {
        this.activeHours = [];
        this.selectedActiveHour = null;
      },
    });
  }

  selectActiveHour(activeHour: ActiveHourDto): void {
    this.selectedActiveHour = activeHour;
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
        
        this.loadTopCategory();
        
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
          this.totalBudget = 0;
        }
      },
      error: () => {
        this.totalBudget = 0;
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

  getDisplayAmount(budget: BudgetDto): number {
    const spent = budget.currentAmount !== undefined 
      ? budget.amount - budget.currentAmount 
      : this.getBudgetSpent(budget);
    
    if (budget.type === 1) {
      return spent;
    }
    return budget.amount - spent;
  }

  getBudgetSpentPercent(budget: BudgetDto): number {
    if (!Number.isFinite(budget.amount) || budget.amount <= 0) return 0;
    const spent = budget.currentAmount !== undefined 
      ? budget.amount - budget.currentAmount 
      : this.getBudgetSpent(budget);
    return Math.min(100, Math.max(0, Math.round((spent / budget.amount) * 100)));
  }

  getBudgetSpentPercentLabel(budget: BudgetDto): string {
    return Number.isFinite(budget.amount) && budget.amount > 0
      ? `${this.getBudgetSpentPercent(budget)}%`
      : '-';
  }

  getBudgetSpent(budget: BudgetDto): number {
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return this.allTransactions.reduce((sum, t) => {
      if (!t.isExpense) return sum;
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

  getIcon(transaction: TransactionDto): string {
    if (transaction.transactionDetails && transaction.transactionDetails.length > 1) {
      return 'ti-receipt'; // Quét bill (nhiều món)
    }

    let searchString = '';
    if (transaction.transactionDetails && transaction.transactionDetails.length === 1) {
      searchString = (transaction.transactionDetails[0].categoryName || transaction.transactionDetails[0].itemName || transaction.name || '').toLowerCase();
    } else {
      searchString = (transaction.name || '').toLowerCase();
    }

    if (searchString.includes('ăn uống') || searchString.includes('food') || searchString.includes('noodle') || searchString.includes('rice') || searchString.includes('phở') || searchString.includes('bún')) return 'ti-soup';
    if (searchString.includes('cà phê') || searchString.includes('coffee') || searchString.includes('trà') || searchString.includes('tea') || searchString.includes('drink') || searchString.includes('nước')) return 'ti-coffee';
    if (searchString.includes('mua sắm') || searchString.includes('shopping') || searchString.includes('siêu thị')) return 'ti-shopping-cart';
    if (searchString.includes('di chuyển') || searchString.includes('xe') || searchString.includes('ride') || searchString.includes('grab') || searchString.includes('taxi')) return 'ti-car';
    if (searchString.includes('giải trí') || searchString.includes('phim') || searchString.includes('entertainment')) return 'ti-device-gamepad';
    if (searchString.includes('y tế') || searchString.includes('sức khỏe') || searchString.includes('health') || searchString.includes('thuốc')) return 'ti-first-aid-kit';
    if (searchString.includes('giáo dục') || searchString.includes('học') || searchString.includes('education')) return 'ti-book';
    if (searchString.includes('nhà cửa') || searchString.includes('home') || searchString.includes('điện') || searchString.includes('nước')) return 'ti-home';

    if (transaction.source === 'snap') return 'ti-camera';
    if (transaction.source === 'manual') return 'ti-edit';
    
    return 'ti-receipt';
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
