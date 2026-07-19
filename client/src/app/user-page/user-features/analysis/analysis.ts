import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LanguageService } from '../../../core/services/language-service';
import { ThemeService } from '../../../core/services/theme.service';
import { AnalyticsService, AnalyticsReport, CashFlowDataPoint } from '../../../core/services/analytics.service';
import { TransactionDto } from '../../../models/transaction.dto';
import { TransactionDetailModal } from '../transaction/transaction-detail-modal/transaction-detail-modal';
import {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexResponsive,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexTooltip,
  ApexFill,
  ApexPlotOptions
} from 'ng-apexcharts';

export type PeriodType = '7days' | '30days' | 'thisMonth' | 'lastMonth' | '3months' | '6months' | 'thisYear' | 'custom';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgApexchartsModule,
    TransactionDetailModal
  ],
  templateUrl: './analysis.html',
  styleUrl: './analysis.css'
})
export class Analysis implements OnInit {
  protected readonly language = inject(LanguageService);
  protected readonly theme = inject(ThemeService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly router = inject(Router);

  // --- Filter State ---
  activePeriod = signal<PeriodType>('thisMonth');
  activeAccount = signal<string>('all');
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');

  showCustomDatePicker = false;
  showPeriodDropdown = false;
  showAccountDropdown = false;

  // --- Loading/Error/Data State ---
  isLoading = true;
  hasError = false;
  report: AnalyticsReport | null = null;

  // --- Interaction State ---
  selectedTransaction: TransactionDto | null = null;
  selectedCategoryFilter: string | null = null;
  activeNotableTab = 'all'; // all, high, unusual, uncategorized, bills

  // --- Chart Configurations ---
  cashFlowSeries: ApexAxisChartSeries = [];
  cashFlowChartOptions: any = {};
  cashFlowViewMode: 'daily' | 'weekly' | 'monthly' = 'daily';

  categorySeries: ApexNonAxisChartSeries = [];
  categoryChartOptions: any = {};

  comparisonSeries: ApexAxisChartSeries = [];
  comparisonChartOptions: any = {};
  comparisonViewMode: 'category' | 'week' | 'account' = 'category';

  constructor() {
    // Re-render/build charts when theme changes
    effect(() => {
      const activeTheme = this.theme.currentTheme();
      if (this.report) {
        this.buildCharts(this.report);
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    let start: Date | undefined;
    let end: Date | undefined;

    if (this.activePeriod() === 'custom') {
      if (this.customStartDate() && this.customEndDate()) {
        start = new Date(this.customStartDate());
        end = new Date(this.customEndDate());
      }
    }

    this.analyticsService.getAnalysisReport(
      this.activePeriod(),
      this.activeAccount(),
      start,
      end
    ).subscribe({
      next: (reportData) => {
        this.report = reportData;
        this.buildCharts(reportData);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading analytics report:', err);
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  // --- Period Dropdown Selection ---
  selectPeriod(period: PeriodType): void {
    this.showPeriodDropdown = false;
    if (period === 'custom') {
      this.showCustomDatePicker = true;
      return;
    }
    this.activePeriod.set(period);
    this.selectedCategoryFilter = null; // reset filter
    this.loadData();
  }

  applyCustomDates(): void {
    if (this.customStartDate() && this.customEndDate()) {
      this.showCustomDatePicker = false;
      this.activePeriod.set('custom');
      this.selectedCategoryFilter = null;
      this.loadData();
    }
  }

  cancelCustomDates(): void {
    this.showCustomDatePicker = false;
    if (this.activePeriod() === 'custom') {
      // Revert if no dates applied
      this.activePeriod.set('thisMonth');
      this.loadData();
    }
  }

  getPeriodLabel(period: PeriodType): string {
    const labels: Record<PeriodType, string> = {
      '7days': this.language.currentLang() === 'vi' ? '7 ng\u00e0y qua' : 'Last 7 Days',
      '30days': this.language.currentLang() === 'vi' ? '30 ng\u00e0y qua' : 'Last 30 Days',
      'thisMonth': this.language.currentLang() === 'vi' ? 'Th\u00e1ng n\u00e0y' : 'This Month',
      'lastMonth': this.language.currentLang() === 'vi' ? 'Th\u00e1ng tr\u01b0\u1edbc' : 'Last Month',
      '3months': this.language.currentLang() === 'vi' ? '3 th\u00e1ng qua' : 'Last 3 Months',
      '6months': this.language.currentLang() === 'vi' ? '6 th\u00e1ng qua' : 'Last 6 Months',
      'thisYear': this.language.currentLang() === 'vi' ? 'N\u0103m nay' : 'This Year',
      'custom': this.language.currentLang() === 'vi' ? 'T\u00f9y ch\u1ec9nh...' : 'Custom Range...'
    };
    return labels[period] || period;
  }

  // --- Account Filter Selection ---
  selectAccount(acc: string): void {
    this.showAccountDropdown = false;
    this.activeAccount.set(acc);
    this.selectedCategoryFilter = null;
    this.loadData();
  }

  getAccountLabel(acc: string): string {
    if (acc === 'all') {
      return this.language.t('analysis.allAccounts');
    }
    return acc;
  }

  // --- Cash Flow View Mode Switcher ---
  setCashFlowMode(mode: 'daily' | 'weekly' | 'monthly'): void {
    this.cashFlowViewMode = mode;
    if (this.report) {
      this.buildCashFlowChart(this.report.cashFlow);
    }
  }

  // --- Category Spending Drill-down filter ---
  toggleCategoryFilter(categoryName: string): void {
    if (this.selectedCategoryFilter === categoryName) {
      this.selectedCategoryFilter = null; // deselect
    } else {
      this.selectedCategoryFilter = categoryName;
    }
  }

  // --- Notable Transactions Tab Filters ---
  setNotableTab(tab: string): void {
    this.activeNotableTab = tab;
  }

  get filteredNotableTransactions(): TransactionDto[] {
    if (!this.report) return [];

    let txs = this.report.notableTransactions;

    // Apply category drill-down filter if selected
    if (this.selectedCategoryFilter) {
      txs = txs.filter(t => {
        const cat = t.transactionDetails?.[0]?.categoryName || 'Kh\u00e1c';
        return cat.toLowerCase() === this.selectedCategoryFilter?.toLowerCase();
      });
    }

    // Apply tab filter
    switch (this.activeNotableTab) {
      case 'high':
        // High value: > 1,000,000 đ
        return txs.filter(t => t.totalAmount > 1000000);
      case 'unusual':
        // Unusual: e.g. amount is odd or specifically flagged as expense & is manual and amount > 500k
        return txs.filter(t => t.isExpense && t.totalAmount > 500000 && t.source === 'manual');
      case 'uncategorized':
        // Uncategorized: categoryName is 'Khác' or empty
        return txs.filter(t => {
          const cat = t.transactionDetails?.[0]?.categoryName || '';
          return cat === 'Kh\u00e1c' || cat === 'Other' || !cat;
        });
      case 'bills':
        // From bills: source is 'receipt'
        return txs.filter(t => t.source === 'receipt');
      case 'all':
      default:
        return txs;
    }
  }

  // --- Export Feature ---
  exportReport(event: Event): void {
    event.preventDefault();
    if (!this.report) return;

    // Generate CSV data format
    const isEn = this.language.currentLang() === 'en';
    const csvContent = [];
    
    // Header
    csvContent.push(isEn ? 'SPEND ANALYSIS REPORT' : 'B\u00c1O C\u00c1O PH\u00c2N T\u00cdCH CHI TI\u00caU');
    csvContent.push(`${isEn ? 'Period' : 'K\u1ef3 b\u00e1o c\u00e1o'}:,${this.getPeriodLabel(this.activePeriod())}`);
    csvContent.push(`${isEn ? 'Account' : 'T\u00e0i kho\u1ea3n'}:,${this.getAccountLabel(this.activeAccount())}`);
    csvContent.push('');

    // KPI Values
    csvContent.push(`${isEn ? 'Metric' : 'Ch\u1ec9 s\u1ed1'},${isEn ? 'Value' : 'Gi\u00e1 tr\u1ecb'}`);
    csvContent.push(`${this.language.t('analysis.kpi.income')},${this.report.kpis.income.value}`);
    csvContent.push(`${this.language.t('analysis.kpi.expense')},${this.report.kpis.expense.value}`);
    csvContent.push(`${this.language.t('analysis.kpi.savings')},${this.report.kpis.savings.value}`);
    csvContent.push(`${this.language.t('analysis.kpi.rate')},${this.report.kpis.rate.value}%`);
    csvContent.push('');

    // Category Spending
    csvContent.push(isEn ? 'Spending by Category' : 'Chi ti\u00eau theo Danh m\u1ee5c');
    csvContent.push(`${isEn ? 'Category' : 'Danh m\u1ee5c'},${isEn ? 'Amount' : 'S\u1ed1 ti\u1ec1n'},${isEn ? 'Percentage' : 'T\u1ef7 l\u1ec7'}`);
    this.report.categorySpending.forEach(cat => {
      csvContent.push(`"${this.language.t(cat.categoryKey)}",${cat.amount},${cat.percentage}%`);
    });

    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Snaptics_Analysis_${this.activePeriod()}_${this.activeAccount()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- AI Insights action click handlers ---
  handleInsightAction(insight: any): void {
    if (insight.actionType === 'view_tx') {
      this.activeNotableTab = 'all';
      if (insight.meta?.categoryName) {
        this.selectedCategoryFilter = insight.meta.categoryName;
      }
      // Scroll smoothly to transactions list
      const el = document.getElementById('notable-txs-card');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (insight.actionType === 'adjust_budget') {
      void this.router.navigate(['/user/budget']);
    } else if (insight.actionType === 'create_goal') {
      void this.router.navigate(['/user/budget']);
    } else if (insight.actionType === 'view_detail') {
      // Toggle to bills
      this.activeNotableTab = 'bills';
      const el = document.getElementById('notable-txs-card');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // --- Notable Transaction detail modal ---
  openTransactionDetail(t: TransactionDto): void {
    this.selectedTransaction = t;
  }

  closeTransactionDetail(): void {
    this.selectedTransaction = null;
  }

  // --- Shared helper functions ---
  formatCurrency(value: number): string {
    return `${new Intl.NumberFormat(this.language.locale()).format(value)}\u0111`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(this.language.locale(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  getCategoryLabel(t: TransactionDto): string {
    const name = t.transactionDetails?.[0]?.categoryName;
    if (!name) return this.language.t('dashboard.category.other');

    const normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const key = `dashboard.category.${normalizedName}`;
    const translated = this.language.t(key);

    return translated === key ? name : translated;
  }

  getNotableIcon(t: TransactionDto): string {
    if (t.source === 'manual') return 'edit_square';
    if (t.source === 'receipt') return 'receipt_long';
    return 'photo_camera';
  }

  getNotableSourceClass(t: TransactionDto): string {
    if (t.source === 'manual') return 'notable-source--manual';
    if (t.source === 'receipt') return 'notable-source--scan';
    return 'notable-source--snap';
  }

  getNotableSourceLabel(source: string | undefined): string {
    if (source === 'manual') return this.language.t('analysis.transactions.sourceManual');
    if (source === 'receipt') return this.language.t('analysis.transactions.sourceScan');
    return this.language.t('analysis.transactions.sourceSync');
  }

  // --- CHART BUILDERS ---
  private buildCharts(report: AnalyticsReport): void {
    const isDark = document.documentElement.classList.contains('dark-theme');
    const labelColor = isDark ? '#94a3b8' : '#6870a5';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(91,123,250,0.06)';

    this.buildCashFlowChart(report.cashFlow);

    // 1. Donut spending by Category chart
    const donutCategories = report.categorySpending.map(cat => this.language.t(cat.categoryKey));
    const donutSeries = report.categorySpending.map(cat => cat.amount);
    const donutColors = report.categorySpending.map(cat => cat.color);

    this.categorySeries = donutSeries;
    this.categoryChartOptions = {
      chart: {
        type: 'donut',
        height: 280,
        fontFamily: 'inherit',
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            const index = config.dataPointIndex;
            const categoryData = report.categorySpending[index];
            if (categoryData) {
              this.toggleCategoryFilter(categoryData.name);
            }
          }
        }
      },
      labels: donutCategories,
      colors: donutColors.length > 0 ? donutColors : ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'],
      dataLabels: {
        enabled: false
      },
      legend: {
        show: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: [isDark ? '#1e293b' : '#ffffff']
      },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            background: 'transparent',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '12px',
                fontWeight: 600,
                color: labelColor,
                offsetY: -8
              },
              value: {
                show: true,
                fontSize: '18px',
                fontWeight: 800,
                color: isDark ? '#f8fafc' : '#1b1d2e',
                offsetY: 6,
                formatter: (val: string) => {
                  return this.formatCurrency(Number(val));
                }
              },
              total: {
                show: true,
                showAlways: true,
                label: this.language.currentLang() === 'vi' ? 'T\u1ed5ng chi' : 'Total Spent',
                fontSize: '11px',
                fontWeight: 700,
                color: labelColor,
                formatter: (w: any) => {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return this.formatCurrency(total);
                }
              }
            }
          }
        }
      },
      tooltip: {
        enabled: true,
        theme: isDark ? 'dark' : 'light',
        y: {
          formatter: (val: number) => this.formatCurrency(val)
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 240
            }
          }
        }
      ]
    };

    // 2. Spending Comparison double column chart
    const compCategories = report.comparison.points.map(pt => {
      // Find category config translation
      const catMatch = report.categorySpending.find(cat => cat.name === pt.label);
      return catMatch ? this.language.t(catMatch.categoryKey) : pt.label;
    });
    const curCompSeries = report.comparison.points.map(pt => pt.currentAmount);
    const prevCompSeries = report.comparison.points.map(pt => pt.previousAmount);

    this.comparisonSeries = [
      {
        name: this.language.currentLang() === 'vi' ? 'K\u1ef3 n\u00e0y' : 'Current Period',
        data: curCompSeries
      },
      {
        name: this.language.currentLang() === 'vi' ? 'K\u1ef3 tr\u01b0\u1edbc' : 'Previous Period',
        data: prevCompSeries
      }
    ];

    this.comparisonChartOptions = {
      chart: {
        type: 'bar',
        height: 240,
        fontFamily: 'inherit',
        toolbar: {
          show: false
        }
      },
      colors: ['#6366f1', labelColor],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '50%',
          borderRadius: 4
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: compCategories,
        labels: {
          style: {
            colors: labelColor,
            fontSize: '11px'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: labelColor,
            fontSize: '10px'
          },
          formatter: (v: number) => {
            return v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${v / 1000}k`;
          }
        }
      },
      fill: {
        opacity: [1, 0.4] // make previous period slightly faded
      },
      grid: {
        borderColor: gridColor,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        },
        xaxis: {
          lines: {
            show: false
          }
        }
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        labels: {
          colors: isDark ? '#f8fafc' : '#1b1d2e'
        }
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: {
          formatter: (val: number) => this.formatCurrency(val)
        }
      }
    };
  }

  private buildCashFlowChart(cashFlowPoints: CashFlowDataPoint[]): void {
    const isDark = document.documentElement.classList.contains('dark-theme');
    const labelColor = isDark ? '#94a3b8' : '#6870a5';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(91,123,250,0.06)';

    const labels = cashFlowPoints.map(p => p.label);
    const incomeData = cashFlowPoints.map(p => p.income);
    const expenseData = cashFlowPoints.map(p => p.expense);
    const netData = cashFlowPoints.map(p => p.net);

    this.cashFlowSeries = [
      {
        name: this.language.t('analysis.cashFlow.income'),
        type: 'area',
        data: incomeData
      },
      {
        name: this.language.t('analysis.cashFlow.expense'),
        type: 'area',
        data: expenseData
      },
      {
        name: this.language.t('analysis.cashFlow.net'),
        type: 'line',
        data: netData
      }
    ];

    this.cashFlowChartOptions = {
      chart: {
        height: 320,
        type: 'line',
        stacked: false,
        fontFamily: 'inherit',
        toolbar: {
          show: false
        }
      },
      stroke: {
        width: [2, 2, 3],
        curve: 'smooth',
        dashArray: [0, 0, 0]
      },
      colors: ['#10b981', '#ef4444', '#6366f1'], // green, red, indigo
      fill: {
        type: 'solid',
        opacity: [0.08, 0.08, 1] // low opacity for areas, full solid for the net line
      },
      markers: {
        size: [0, 0, 4],
        hover: {
          size: 6
        }
      },
      xaxis: {
        categories: labels,
        labels: {
          style: {
            colors: labelColor,
            fontSize: '11px'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: labelColor,
            fontSize: '10px'
          },
          formatter: (v: number) => {
            return v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${v / 1000}k` : `${v}`;
          }
        }
      },
      grid: {
        borderColor: gridColor,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        },
        xaxis: {
          lines: {
            show: false
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        labels: {
          colors: isDark ? '#f8fafc' : '#1b1d2e'
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        theme: isDark ? 'dark' : 'light',
        y: {
          formatter: (val: number) => this.formatCurrency(val)
        }
      }
    };
  }

  getSparklinePath(data: number[] | undefined): string {
    if (!data || data.length === 0) return 'M 0 24 L 100 24';
    const max = Math.max(...data.map(Math.abs), 1);
    return 'M ' + data.map((val, i) => {
      const x = i * (100 / (data.length - 1));
      const y = 24 - (Math.abs(val) / max * 20);
      return `${x} ${y}`;
    }).join(' L ');
  }
}
