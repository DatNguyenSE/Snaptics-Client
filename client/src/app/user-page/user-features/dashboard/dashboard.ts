import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, effect, ViewChildren, QueryList } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDto } from '../../../models/transaction.dto';
import { environment } from '../../../environments/environment.development';
import { UserHeader } from '../../user-layout/user-header/user-header';
import { TransactionDetailModal } from '../transaction/transaction-detail-modal/transaction-detail-modal';
import { AiAssistant } from '../ai-assistant/ai-assistant';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { ThemeService } from '../../../core/services/theme.service';

Chart.register(...registerables);

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
  // AI Assistant is imported here to be used in the template
  imports: [RouterLink, UserHeader, DatePipe, TransactionDetailModal, BaseChartDirective, AiAssistant],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  protected readonly language = inject(LanguageService);
  private readonly transactionService = inject(TransactionService);
  private readonly theme = inject(ThemeService);

  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  constructor() {
    effect(() => {
      const isDark = this.theme.currentTheme() === 'dark';
      // Read language signal so effect re-runs on language change
      const lang = this.language.currentLang();
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)';
      const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(30, 41, 59, 0.92)';
      const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

      // Bar chart — adapt colors
      const barMuted = isDark ? 'rgba(96, 165, 250, 0.25)' : 'rgba(91, 123, 250, 0.2)';
      const barSat = isDark ? '#60a5fa' : '#5b7bfa';
      const barVivid = isDark ? '#3b82f6' : '#4f46e5';

      // Bar chart — adapt labels per language
      this.barChartData.labels = lang === 'vi'
        ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      if (this.barChartData?.datasets?.[0]) {
        this.barChartData.datasets[0].backgroundColor = [
          barMuted, barMuted, barMuted, barMuted, barMuted, barSat, barVivid
        ];
        this.barChartData.datasets[0].hoverBackgroundColor = [
          isDark ? 'rgba(96, 165, 250, 0.45)' : 'rgba(91, 123, 250, 0.4)',
          isDark ? 'rgba(96, 165, 250, 0.45)' : 'rgba(91, 123, 250, 0.4)',
          isDark ? 'rgba(96, 165, 250, 0.45)' : 'rgba(91, 123, 250, 0.4)',
          isDark ? 'rgba(96, 165, 250, 0.45)' : 'rgba(91, 123, 250, 0.4)',
          isDark ? 'rgba(96, 165, 250, 0.45)' : 'rgba(91, 123, 250, 0.4)',
          isDark ? '#93c5fd' : '#818cf8',
          isDark ? '#60a5fa' : '#6366f1'
        ];
      }

      // Doughnut — adapt labels + "Khác" color for theme
      this.doughnutChartData.labels = [
        this.language.t('dashboard.category.food'),
        this.language.t('dashboard.category.drinks'),
        this.language.t('dashboard.category.travel'),
        this.language.t('dashboard.category.other'),
      ];
      if (this.doughnutChartData?.datasets?.[0]) {
        const kColor = isDark ? '#334155' : '#cbd5e1';
        this.doughnutChartData.datasets[0].backgroundColor = ['#3b82f6', '#22c55e', '#f59e0b', kColor];
      }

      if (this.barChartOptions?.scales?.['x']?.ticks) {
        this.barChartOptions.scales['x'].ticks.color = textColor;
      }
      if (this.barChartOptions?.scales?.['y']?.grid) {
        this.barChartOptions.scales['y'].grid.color = gridColor;
      }
      if (this.barChartOptions?.plugins?.tooltip) {
        (this.barChartOptions.plugins.tooltip as any).backgroundColor = tooltipBg;
        (this.barChartOptions.plugins.tooltip as any).borderColor = tooltipBorder;
      }
      if (this.doughnutChartOptions?.plugins?.legend?.labels) {
        this.doughnutChartOptions.plugins.legend.labels.color = textColor;
      }
      if (this.doughnutChartOptions?.plugins?.tooltip) {
        this.doughnutChartOptions.plugins.tooltip.backgroundColor = tooltipBg;
        this.doughnutChartOptions.plugins.tooltip.borderColor = tooltipBorder;
      }

      this.charts?.forEach(c => c.update());
    });
  }

  readonly totalBudget = 500000;
  totalSpent = 0;
  remainingBudget = 500000;
  spentPercentage = 0;

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

  recentTransactions: TransactionDto[] = [];
  selectedTransaction: TransactionDto | null = null;

  // Bar Chart (Weekly Spending)
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: 'bold' },
        bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
        displayColors: false,
        callbacks: {
          label: (context: any) => this.formatCurrency(context.parsed.y || 0)
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#94a3b8' }
      },
      y: {
        border: { display: false },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { display: false }
      }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [
      {
        data: [20000, 45000, 35000, 30000, 50000, 95000, 120000],
        backgroundColor: [
          'rgba(96, 165, 250, 0.35)',
          'rgba(96, 165, 250, 0.35)',
          'rgba(96, 165, 250, 0.35)',
          'rgba(96, 165, 250, 0.35)',
          'rgba(96, 165, 250, 0.35)',
          '#60a5fa',
          '#3b82f6'
        ],
        hoverBackgroundColor: [
          'rgba(96, 165, 250, 0.55)',
          'rgba(96, 165, 250, 0.55)',
          'rgba(96, 165, 250, 0.55)',
          'rgba(96, 165, 250, 0.55)',
          'rgba(96, 165, 250, 0.55)',
          '#93c5fd',
          '#60a5fa'
        ],
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      }
    ]
  };

  // Doughnut Chart (Spending by Category)
  public doughnutChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
          color: '#94a3b8'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        cornerRadius: 10,
        callbacks: {
          label: (context: any) => ` ${context.label}: ${this.formatCurrency(context.parsed)}`
        }
      }
    },
    cutout: '68%',
  };
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Ăn uống', 'Đồ uống', 'Di chuyển', 'Khác'],
    datasets: [
      {
        data: [85000, 40000, 45000, 15000],
        backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#334155'],
        borderWidth: 0,
        hoverOffset: 6,
        spacing: 2,
      }
    ]
  };

  ngOnInit(): void {
    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.recentTransactions = data.slice(0, 4);
        this.calculateDashboardStats(data);
      },
      error: (err) => console.error('Failed to load transactions', err),
    });
  }

  private getCategoryGroup(categoryName: string | null | undefined, name: string | null | undefined): 'Food' | 'Drinks' | 'Travel' | 'Other' {
    const cat = (categoryName || '').toLowerCase();
    const title = (name || '').toLowerCase();

    if (cat.includes('food') || cat.includes('ăn') || title.includes('noodle') || title.includes('food') || title.includes('rice') || title.includes('bánh') || title.includes('phở') || title.includes('cơm')) {
      return 'Food';
    }
    if (cat.includes('drink') || cat.includes('uống') || title.includes('coffee') || title.includes('tea') || title.includes('drink') || title.includes('nước') || title.includes('cafe')) {
      return 'Drinks';
    }
    if (cat.includes('travel') || cat.includes('di chuyển') || cat.includes('xe') || title.includes('ride') || title.includes('grab') || title.includes('taxi') || title.includes('xe')) {
      return 'Travel';
    }
    return 'Other';
  }

  private calculateDashboardStats(transactions: TransactionDto[]): void {
    // 1. Total spent today
    const today = new Date();
    const todayTransactions = transactions.filter((t) => {
      const tDate = new Date(t.transactionDate);
      return (
        tDate.getDate() === today.getDate() &&
        tDate.getMonth() === today.getMonth() &&
        tDate.getFullYear() === today.getFullYear()
      );
    });
    this.totalSpent = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    this.remainingBudget = Math.max(0, this.totalBudget - this.totalSpent);
    this.spentPercentage = this.totalBudget > 0 
      ? Math.min(100, Math.round((this.totalSpent / this.totalBudget) * 100)) 
      : 0;

    // 2. Weekly spending (Monday - Sunday of the current week)
    const now = new Date();
    const currentDay = now.getDay();
    const monday = new Date(now);
    const distance = currentDay === 0 ? -6 : 1 - currentDay;
    monday.setDate(now.getDate() + distance);
    monday.setHours(0, 0, 0, 0);

    const weeklyData = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dayStr = day.toDateString();
      const dayTransactions = transactions.filter(
        (t) => new Date(t.transactionDate).toDateString() === dayStr
      );
      weeklyData[i] = dayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    }
    this.barChartData.datasets[0].data = weeklyData;

    // 3. Category spending (Food, Drinks, Travel, Other)
    let foodTotal = 0;
    let drinksTotal = 0;
    let travelTotal = 0;
    let otherTotal = 0;

    for (const t of transactions) {
      if (t.transactionDetails && t.transactionDetails.length > 0) {
        for (const d of t.transactionDetails) {
          const amount = d.price * (d.quantity || 1);
          const group = this.getCategoryGroup(d.categoryName, d.itemName);
          if (group === 'Food') foodTotal += amount;
          else if (group === 'Drinks') drinksTotal += amount;
          else if (group === 'Travel') travelTotal += amount;
          else otherTotal += amount;
        }
      } else {
        const group = this.getCategoryGroup(null, t.name);
        if (group === 'Food') foodTotal += t.totalAmount;
        else if (group === 'Drinks') drinksTotal += t.totalAmount;
        else if (group === 'Travel') travelTotal += t.totalAmount;
        else otherTotal += t.totalAmount;
      }
    }
    this.doughnutChartData.datasets[0].data = [foodTotal, drinksTotal, travelTotal, otherTotal];

    // 4. AI Insight (based on highest category spending)
    const maxVal = Math.max(foodTotal, drinksTotal, travelTotal, otherTotal);
    let highestCategoryKey = 'dashboard.category.other';
    if (maxVal > 0) {
      if (maxVal === foodTotal) highestCategoryKey = 'dashboard.category.food';
      else if (maxVal === drinksTotal) highestCategoryKey = 'dashboard.category.drinks';
      else if (maxVal === travelTotal) highestCategoryKey = 'dashboard.category.travel';
    }
    // Update aiInsight property
    (this.aiInsight as any).categoryKey = highestCategoryKey;

    // 5. Update charts view
    this.charts?.forEach((c) => c.update());
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
