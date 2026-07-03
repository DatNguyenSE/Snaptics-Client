import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, effect, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDto } from '../../../models/transaction.dto';
import { environment } from '../../../environments/environment.development';
import { UserHeader } from '../../user-layout/user-header/user-header';
import { TransactionDetailModal } from '../transaction/transaction-detail-modal/transaction-detail-modal';
import { AiAssistant } from '../ai-assistant/ai-assistant';
import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';
import { ThemeService } from '../../../core/services/theme.service';

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
  imports: [RouterLink, DatePipe, TransactionDetailModal, NgApexchartsModule, AiAssistant],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  protected readonly language = inject(LanguageService);
  private readonly transactionService = inject(TransactionService);
  private readonly theme = inject(ThemeService);

  @ViewChild('barChart') barChart!: ChartComponent;
  @ViewChild('doughnutChart') doughnutChart!: ChartComponent;

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

  readonly categoryStats = [
    { nameKey: 'dashboard.category.food', amount: 85000, percent: 46, color: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    { nameKey: 'dashboard.category.drinks', amount: 40000, percent: 22, color: 'linear-gradient(90deg, #10b981, #34d399)' },
    { nameKey: 'dashboard.category.travel', amount: 45000, percent: 24, color: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
    { nameKey: 'dashboard.category.other', amount: 15000, percent: 8, color: 'linear-gradient(90deg, #64748b, #94a3b8)' },
  ];

  recentTransactions: TransactionDto[] = [];
  selectedTransaction: TransactionDto | null = null;

  chartViewMode: 'weekly' | 'monthly' | 'yearly' = 'weekly';

  private readonly weeklyBarData = {
    series: [{ name: "Spending", data: [20000, 45000, 35000, 30000, 50000, 95000, 120000] }]
  };

  private readonly monthlyBarData = {
    series: [{ name: "Spending", data: [350000, 420000, 280000, 500000] }]
  };

  private readonly yearlyBarData = {
    series: [{ name: "Spending", data: [420000, 380000, 500000, 480000, 600000, 750000, 680000, 800000, 950000, 850000, 920000, 1050000] }]
  };

  private readonly weeklyDoughnutData = [85000, 40000, 45000, 15000];
  private readonly monthlyDoughnutData = [350000, 150000, 200000, 50000];
  private readonly yearlyDoughnutData = [3500000, 1500000, 2000000, 500000];

  touchStartX = 0;
  touchEndX = 0;

  public barChartOptions: Partial<ApexOptions> = {
    series: [{
      name: "Spending",
      data: [20000, 45000, 35000, 30000, 50000, 95000, 120000]
    }],
    chart: {
      type: "bar",
      height: 250,
      toolbar: { show: false },
      animations: {
        enabled: true,
        speed: 800,
        dynamicAnimation: { speed: 350 }
      },
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '45%',
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    xaxis: {
      categories: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 500 }
      }
    },
    yaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.1)',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: ['#3b82f6'],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 0.8,
        stops: [0, 100]
      }
    },
    colors: ['#8b5cf6'],
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number) => this.formatCurrency(val)
      },
      style: { fontSize: '12px', fontFamily: 'Plus Jakarta Sans, sans-serif' }
    }
  };

  public doughnutChartOptions: Partial<ApexOptions> = {
    series: [85000, 40000, 45000, 15000],
    chart: {
      type: "donut",
      height: 260,
      animations: {
        enabled: true,
        speed: 800
      },
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    },
    labels: ['Ăn uống', 'Đồ uống', 'Di chuyển', 'Khác'],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#64748b'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: false
          }
        },
        expandOnClick: false
      }
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontWeight: 600,
      labels: { colors: '#94a3b8' },
      markers: { 
        strokeWidth: 0,
      }
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val: number) => this.formatCurrency(val) },
      style: { fontSize: '12px', fontFamily: 'Plus Jakarta Sans, sans-serif' }
    }
  };

  constructor() {
    effect(() => {
      const isDark = this.theme.currentTheme() === 'dark';
      const lang = this.language.currentLang();
      this.updateChartTheme(isDark, lang);
    });
  }

  private updateChartTheme(isDark: boolean, lang: string) {
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const strokeColor = isDark ? '#0f172a' : '#ffffff';

    let barCategories: string[] = [];
    if (this.chartViewMode === 'weekly') {
      barCategories = lang === 'vi' ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    } else if (this.chartViewMode === 'monthly') {
      barCategories = lang === 'vi' ? ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'] : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    } else {
      barCategories = lang === 'vi' ? ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }

    const donutLabels = [
      this.language.t('dashboard.category.food'),
      this.language.t('dashboard.category.drinks'),
      this.language.t('dashboard.category.travel'),
      this.language.t('dashboard.category.other'),
    ];

    if (this.barChartOptions.xaxis) {
      this.barChartOptions.xaxis.categories = barCategories;
      if (this.barChartOptions.xaxis.labels?.style) {
        this.barChartOptions.xaxis.labels.style.colors = textColor;
      }
    }
    if (this.barChartOptions.grid) {
      this.barChartOptions.grid.borderColor = gridColor;
    }
    
    if (this.doughnutChartOptions.labels) {
      this.doughnutChartOptions.labels = donutLabels;
    }
    if (this.doughnutChartOptions.legend?.labels) {
      this.doughnutChartOptions.legend.labels.colors = textColor;
    }
    if (this.doughnutChartOptions.stroke) {
      this.doughnutChartOptions.stroke.colors = [strokeColor];
    }

    if (this.barChart) {
      this.barChart.updateOptions(this.barChartOptions, false, true);
    }
    if (this.doughnutChart) {
      this.doughnutChart.updateOptions(this.doughnutChartOptions, false, true);
    }
  }

  ngOnInit(): void {
    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.recentTransactions = data.slice(0, 4);
      },
      error: (err) => console.error('Failed to load transactions', err),
    });
  }

  openTransactionDetail(transaction: TransactionDto) {
    this.selectedTransaction = transaction;
  }

  closeTransactionDetail() {
    this.selectedTransaction = null;
  }

  toggleChartView(mode: 'weekly' | 'monthly' | 'yearly') {
    if (this.chartViewMode === mode) return;
    this.chartViewMode = mode;
    this.updateCharts();
  }

  handleTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  handleTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const swipeThreshold = 50;
    if (this.touchEndX < this.touchStartX - swipeThreshold) {
      // Swiped left (next)
      if (this.chartViewMode === 'weekly') this.toggleChartView('monthly');
      else if (this.chartViewMode === 'monthly') this.toggleChartView('yearly');
    } else if (this.touchEndX > this.touchStartX + swipeThreshold) {
      // Swiped right (prev)
      if (this.chartViewMode === 'yearly') this.toggleChartView('monthly');
      else if (this.chartViewMode === 'monthly') this.toggleChartView('weekly');
    }
  }

  get currentSpentPercentage(): number {
    return this.chartViewMode === 'weekly' ? this.spentPercentage : (this.chartViewMode === 'monthly' ? 75 : 60);
  }

  private updateCharts() {
    const barData = this.chartViewMode === 'weekly' ? this.weeklyBarData : (this.chartViewMode === 'monthly' ? this.monthlyBarData : this.yearlyBarData);
    const donutData = this.chartViewMode === 'weekly' ? this.weeklyDoughnutData : (this.chartViewMode === 'monthly' ? this.monthlyDoughnutData : this.yearlyDoughnutData);
    
    // Update the local options object with the new data
    this.barChartOptions.series = barData.series;
    this.doughnutChartOptions.series = donutData;

    // Change chart type for yearly
    if (this.barChartOptions.chart) {
      this.barChartOptions.chart.type = this.chartViewMode === 'yearly' ? 'area' : 'bar';
    }
    // Adjust stroke for the line/area chart vs bar chart
    if (this.barChartOptions.stroke) {
      this.barChartOptions.stroke.width = this.chartViewMode === 'yearly' ? 3 : 0;
      this.barChartOptions.stroke.curve = 'smooth';
    }
    
    // updateChartTheme will now apply the new series along with the theme and X-axis categories 
    // in a single updateOptions call for each chart, avoiding race conditions.
    this.updateChartTheme(this.theme.currentTheme() === 'dark', this.language.currentLang());
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
    if (transaction.transactionDetails?.length > 1) return 'receipt_long';

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
    if (transaction.transactionDetails?.length > 1) return 'dashboard.category.bill';
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
