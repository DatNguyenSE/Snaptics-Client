import {
  Component,
  OnInit,
  inject,
  signal,
  effect,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexTooltip,
  ApexFill,
  ApexPlotOptions,
  ApexDataLabels,
  ApexStroke,
} from 'ng-apexcharts';

import { LanguageService } from '../../../core/services/language-service';
import { ThemeService } from '../../../core/services/theme.service';
import { FrequencyService } from './frequency.service';

import {
  FrequencyFilters,
  FrequencyPageData,
  FrequencyPeriod,
  TransactionTypeFilter,
  CategoryFrequency,
  FrequencyLevelBucket,
  FrequencyLevel,
  FrequencyTimelinePoint,
} from './frequency.models';
import { getFrequencyLevelKey, formatRelativeDate } from './frequency.utils';

@Component({
  selector: 'app-frequency',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './frequency.html',
  styleUrl: './frequency.css',
})
export class Frequency implements OnInit {
  protected readonly language  = inject(LanguageService);
  protected readonly theme     = inject(ThemeService);
  private readonly router      = inject(Router);
  private readonly freqService = inject(FrequencyService);
  private readonly destroyRef  = inject(DestroyRef);

  // ─── Typed option arrays (used in template @for loops) ───────────────────
  readonly periodOptions: FrequencyPeriod[] = ['7days', '30days', '3months', '6months', 'custom'];
  readonly typeOptions: TransactionTypeFilter[] = ['all', 'expense', 'income'];
  readonly chartModes: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];

  // ─── Filter state ──────────────────────────────────────────────────────────
  activePeriod          = signal<FrequencyPeriod>('30days');
  activeTransactionType = signal<TransactionTypeFilter>('all');
  activeAccount         = signal<string>('all');
  chartViewMode         = signal<'daily' | 'weekly' | 'monthly'>('daily');

  customStartDate = '';
  customEndDate   = '';

  showPeriodDropdown  = false;
  showTypeDropdown    = false;
  showAccountDropdown = false;
  showCustomDate      = false;

  // ─── Page state ────────────────────────────────────────────────────────────
  isLoading = true;
  hasError  = false;
  data: FrequencyPageData | null = null;

  // ─── Table state ───────────────────────────────────────────────────────────
  categorySearch       = '';
  categorySortBy: keyof Pick<CategoryFrequency,
    'transactionCount' | 'totalAmount' | 'trendPercent' | 'averagePerWeek'
  > = 'transactionCount';
  categorySortDir: 'asc' | 'desc' = 'desc';

  // ─── Detail panel ──────────────────────────────────────────────────────────
  selectedCategory: CategoryFrequency | null = null;

  // ─── Chart configs ─────────────────────────────────────────────────────────
  timelineSeries: ApexAxisChartSeries = [];
  timelineChartOptions: Partial<{
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    grid: ApexGrid;
    tooltip: ApexTooltip;
    fill: ApexFill;
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    stroke: ApexStroke;
    colors: string[];
  }> = {};

  constructor() {
    // Rebuild chart when theme changes
    effect(() => {
      const _ = this.theme.currentTheme();
      if (this.data) {
        this.buildChart(this.data);
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  // ─── Load ──────────────────────────────────────────────────────────────────

  loadData(): void {
    this.isLoading = true;
    this.hasError  = false;

    const filters: FrequencyFilters = {
      period:          this.activePeriod(),
      transactionType: this.activeTransactionType(),
      account:         this.activeAccount(),
      customStartDate: this.customStartDate || undefined,
      customEndDate:   this.customEndDate   || undefined,
    };

    this.freqService
      .getFrequencyData(filters, this.language.currentLang())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pageData) => {
          this.data      = pageData;
          this.isLoading = false;
          this.buildChart(pageData);
        },
        error: () => {
          this.hasError  = true;
          this.isLoading = false;
        },
      });
  }

  // ─── Filter actions ────────────────────────────────────────────────────────

  selectPeriod(period: FrequencyPeriod): void {
    this.showPeriodDropdown = false;
    if (period === 'custom') {
      this.showCustomDate = true;
      return;
    }
    this.activePeriod.set(period);
    this.loadData();
  }

  applyCustomDates(): void {
    if (this.customStartDate && this.customEndDate) {
      this.showCustomDate = false;
      this.activePeriod.set('custom');
      this.loadData();
    }
  }

  cancelCustomDates(): void {
    this.showCustomDate = false;
    if (this.activePeriod() === 'custom') {
      this.activePeriod.set('30days');
      this.loadData();
    }
  }

  selectTransactionType(type: TransactionTypeFilter): void {
    this.showTypeDropdown = false;
    this.activeTransactionType.set(type);
    this.loadData();
  }

  selectAccount(acc: string): void {
    this.showAccountDropdown = false;
    this.activeAccount.set(acc);
    this.loadData();
  }

  setChartViewMode(mode: 'daily' | 'weekly' | 'monthly'): void {
    this.chartViewMode.set(mode);
    if (this.data) {
      this.buildChart(this.data);
    }
  }

  // ─── Label helpers ─────────────────────────────────────────────────────────

  getPeriodLabel(period: FrequencyPeriod): string {
    const vi = this.language.currentLang() === 'vi';
    const map: Record<FrequencyPeriod, string> = {
      '7days':   this.language.t('frequency.period.7days'),
      '30days':  this.language.t('frequency.period.30days'),
      '3months': this.language.t('frequency.period.3months'),
      '6months': this.language.t('frequency.period.6months'),
      'custom':  this.language.t('frequency.period.custom'),
    };
    return map[period];
  }

  getTypeLabel(type: TransactionTypeFilter): string {
    const map: Record<TransactionTypeFilter, string> = {
      all:     this.language.t('frequency.filters.all'),
      expense: this.language.t('frequency.filters.expense'),
      income:  this.language.t('frequency.filters.income'),
    };
    return map[type];
  }

  getLevelLabel(level: FrequencyLevel): string {
    return this.language.t(getFrequencyLevelKey(level));
  }

  getLevelColorClass(level: FrequencyLevel): string {
    const map: Record<FrequencyLevel, string> = {
      very_frequent: 'level-badge--very-frequent',
      frequent:      'level-badge--frequent',
      occasional:    'level-badge--occasional',
      rare:          'level-badge--rare',
      unused:        'level-badge--unused',
    };
    return map[level];
  }

  getDistributionColorClass(level: FrequencyLevel): string {
    const map: Record<FrequencyLevel, string> = {
      very_frequent: 'dist-bar--very-frequent',
      frequent:      'dist-bar--frequent',
      occasional:    'dist-bar--occasional',
      rare:          'dist-bar--rare',
      unused:        'dist-bar--unused',
    };
    return map[level];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.language.locale()).format(Math.round(amount));
  }

  formatRelDate(iso: string | null): string {
    return formatRelativeDate(iso, this.language.currentLang());
  }

  formatTrend(pct: number | null): string {
    if (pct === null) return '—';
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct}%`;
  }

  getDistributionMax(): number {
    if (!this.data) return 1;
    return Math.max(1, ...this.data.distribution.map((d) => d.transactionCount));
  }

  // ─── Table ─────────────────────────────────────────────────────────────────

  get filteredCategories(): CategoryFrequency[] {
    if (!this.data) return [];
    const q = this.categorySearch.toLowerCase().trim();
    let cats = q
      ? this.data.categories.filter((c) =>
          c.categoryName.toLowerCase().includes(q),
        )
      : [...this.data.categories];

    cats.sort((a, b) => {
      const av = (a[this.categorySortBy] as number | null) ?? -Infinity;
      const bv = (b[this.categorySortBy] as number | null) ?? -Infinity;
      return this.categorySortDir === 'desc' ? bv - av : av - bv;
    });
    return cats;
  }

  sortBy(col: typeof this.categorySortBy): void {
    if (this.categorySortBy === col) {
      this.categorySortDir = this.categorySortDir === 'desc' ? 'asc' : 'desc';
    } else {
      this.categorySortBy  = col;
      this.categorySortDir = 'desc';
    }
  }

  // ─── Detail panel ──────────────────────────────────────────────────────────

  openCategoryDetail(cat: CategoryFrequency): void {
    this.selectedCategory = cat;
  }

  closeCategoryDetail(): void {
    this.selectedCategory = null;
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  goToManualEntry(): void {
    void this.router.navigateByUrl('/user/manual-entry');
  }

  // ─── Chart ─────────────────────────────────────────────────────────────────

  private buildChart(pageData: FrequencyPageData): void {
    const isDark    = this.theme.currentTheme() === 'dark';
    const lang      = this.language.currentLang();
    const locale    = this.language.locale();
    const textColor = isDark ? '#94a3b8' : '#6870a5';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(91,123,250,0.08)';
    const primary   = isDark ? '#8b5cf6' : '#5b7bfa';

    // Pick bucket size from viewMode and period
    let points = pageData.timeline;
    if (this.chartViewMode() === 'weekly' && pageData.periodDays <= 31) {
      // Aggregate daily into weekly on-the-fly
      points = this.aggregateToWeekly(points, lang);
    } else if (this.chartViewMode() === 'monthly' && pageData.periodDays <= 90) {
      points = this.aggregateToMonthly(points, locale);
    }

    this.timelineSeries = [
      {
        name: lang === 'vi' ? 'Số giao dịch' : 'Transactions',
        data: points.map((p) => p.transactionCount),
      },
    ];

    this.timelineChartOptions = {
      chart: {
        type:        'bar',
        height:      280,
        toolbar:     { show: false },
        animations:  { enabled: true, speed: 400 },
        background:  'transparent',
        fontFamily:  '\'Plus Jakarta Sans\', sans-serif',
      },
      colors:      [primary],
      plotOptions: {
        bar: { borderRadius: 6, columnWidth: '60%' },
      },
      dataLabels: { enabled: false },
      stroke:     { show: false },
      grid: {
        borderColor:  gridColor,
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
      },
      xaxis: {
        categories: points.map((p) => p.label),
        labels: {
          style:  { colors: textColor, fontSize: '11px' },
          rotate: -30,
        },
        axisBorder: { show: false },
        axisTicks:  { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: textColor, fontSize: '11px' },
          formatter: (v: number) => String(Math.round(v)),
        },
        min: 0,
      },
      fill: { opacity: 1 },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        custom: ({ seriesIndex, dataPointIndex }: { seriesIndex: number; dataPointIndex: number }) => {
          const pt = points[dataPointIndex];
          if (!pt) return '';
          const fmtAmt = (n: number) =>
            new Intl.NumberFormat(locale).format(Math.round(n));
          const expLabel = lang === 'vi' ? 'Tổng chi' : 'Expense';
          const incLabel = lang === 'vi' ? 'Tổng thu' : 'Income';
          const txLabel  = lang === 'vi' ? 'giao dịch' : 'transactions';
          return `
            <div class="freq-tooltip">
              <div class="freq-tooltip__date">${pt.label}</div>
              <div class="freq-tooltip__row">
                <span>${pt.transactionCount} ${txLabel}</span>
              </div>
              ${pt.totalExpense > 0 ? `<div class="freq-tooltip__row freq-tooltip__row--expense"><span>${expLabel}</span><span>${fmtAmt(pt.totalExpense)}đ</span></div>` : ''}
              ${pt.totalIncome > 0 ? `<div class="freq-tooltip__row freq-tooltip__row--income"><span>${incLabel}</span><span>${fmtAmt(pt.totalIncome)}đ</span></div>` : ''}
            </div>
          `;
        },
      },
    };
  }

  private aggregateToWeekly(
    daily: { label: string; date: string; transactionCount: number; totalAmount: number; totalExpense: number; totalIncome: number }[],
    lang: string,
  ): typeof daily {
    const map = new Map<string, typeof daily[0]>();
    for (const pt of daily) {
      const d   = new Date(pt.date);
      const mon = new Date(d);
      mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
      const key     = mon.toDateString();
      const weekNum = this.getISOWeek(mon);
      if (!map.has(key)) {
        map.set(key, {
          label:            lang === 'vi' ? `Tuần ${weekNum}` : `W${weekNum}`,
          date:             mon.toISOString(),
          transactionCount: 0,
          totalAmount:      0,
          totalExpense:     0,
          totalIncome:      0,
        });
      }
      const b = map.get(key)!;
      b.transactionCount += pt.transactionCount;
      b.totalAmount      += pt.totalAmount;
      b.totalExpense     += pt.totalExpense;
      b.totalIncome      += pt.totalIncome;
    }
    return Array.from(map.values());
  }

  private aggregateToMonthly(
    daily: FrequencyTimelinePoint[],
    locale: string,
  ): FrequencyTimelinePoint[] {
    const map = new Map<string, FrequencyTimelinePoint>();
    for (const pt of daily) {
      const d   = new Date(pt.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) {
        const first = new Date(d.getFullYear(), d.getMonth(), 1);
        map.set(key, {
          label:            first.toLocaleDateString(locale, { month: 'short', year: '2-digit' }),
          date:             first.toISOString(),
          transactionCount: 0,
          totalAmount:      0,
          totalExpense:     0,
          totalIncome:      0,
        });
      }
      const b = map.get(key)!;
      b.transactionCount += pt.transactionCount;
      b.totalAmount      += pt.totalAmount;
      b.totalExpense     += pt.totalExpense;
      b.totalIncome      += pt.totalIncome;
    }
    return Array.from(map.values());
  }

  private getISOWeek(d: Date): number {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7));
    const ys = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    return Math.ceil(((dt.getTime() - ys.getTime()) / 86_400_000 + 1) / 7);
  }

  // ─── Distribution helpers ──────────────────────────────────────────────────

  getDistributionPercent(bucket: FrequencyLevelBucket): number {
    const max = this.getDistributionMax();
    return max > 0 ? Math.round((bucket.transactionCount / max) * 100) : 0;
  }

  // ─── Dropdown close-on-outside helper (called from template) ───────────────

  closeAllDropdowns(): void {
    this.showPeriodDropdown  = false;
    this.showTypeDropdown    = false;
    this.showAccountDropdown = false;
  }
}
