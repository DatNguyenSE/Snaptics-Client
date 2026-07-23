import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, take } from 'rxjs';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDto } from '../../../models/transaction.dto';
import {
  FrequencyFilters,
  FrequencyPageData,
  FrequencySummary,
  CategoryFrequency,
  FrequencyTimelinePoint,
  FrequentTransaction,
  FrequencyLevelBucket,
  FrequencyInsight,
  FrequencyLevel,
} from './frequency.models';
import {
  calculatePeriodDates,
  calculatePreviousPeriodDates,
  computeTrendPercent,
  getFrequencyLevel,
  formatDateLabel,
  formatWeekLabel,
  formatMonthLabel,
  PeriodRange,
} from './frequency.utils';

/**
 * FrequencyService is a **frontend adapter** that derives all frequency metrics
 * from the existing transaction list.
 *
 * TODO (backend): When the backend exposes a dedicated endpoint, replace
 * the observable chain below with an HTTP call:
 *
 *   GET /Analytics/transaction-frequency
 *     ?startDate=<ISO>
 *     &endDate=<ISO>
 *     &transactionType=expense|income|all
 *     &accountId=<id>
 *     &groupBy=category
 */
@Injectable({ providedIn: 'root' })
export class FrequencyService {
  private readonly transactionService = inject(TransactionService);

  /**
   * Returns a fully-computed FrequencyPageData observable.
   * Filters are applied, then metrics are derived in pure functions.
   */
  getFrequencyData(filters: FrequencyFilters, lang: string): Observable<FrequencyPageData> {
    return this.transactionService.getTransactions().pipe(
      take(1),
      map((transactions) => this.calculateFrequencyData(transactions, filters, lang)),
    );
  }

  // ─── Core computation ───────────────────────────────────────────────────────

  calculateFrequencyData(
    allTransactions: TransactionDto[],
    filters: FrequencyFilters,
    lang: string,
  ): FrequencyPageData {
    const currentRange  = calculatePeriodDates(
      filters.period,
      filters.customStartDate,
      filters.customEndDate,
    );
    const previousRange = calculatePreviousPeriodDates(currentRange);

    // Filter by period
    const currentTxs  = this.filterByPeriodAndType(allTransactions, currentRange, filters);
    const previousTxs = this.filterByPeriodAndType(allTransactions, previousRange, {
      ...filters,
      // Same type filter, same account, different period
    });

    const availableAccounts = this.extractAccounts(allTransactions);

    const categories        = this.buildCategoryFrequencies(currentTxs, previousTxs, currentRange);
    const summary           = this.buildSummary(currentTxs, previousTxs, categories, currentRange);
    const timeline          = this.buildTimeline(currentTxs, currentRange, lang);
    const distribution      = this.buildDistribution(categories);
    const frequentTxs       = this.buildFrequentTransactions(currentTxs, previousTxs, currentRange);
    const insights          = this.buildInsights(summary, categories, frequentTxs, currentRange, lang);

    return {
      summary,
      timeline,
      categories,
      distribution,
      frequentTransactions: frequentTxs,
      insights,
      availableAccounts,
      periodDays: currentRange.days,
    };
  }

  // ─── Filter helpers ─────────────────────────────────────────────────────────

  private filterByPeriodAndType(
    txs: TransactionDto[],
    range: PeriodRange,
    filters: FrequencyFilters,
  ): TransactionDto[] {
    return txs.filter((t) => {
      const date = new Date(t.transactionDate);
      if (date < range.start || date > this.endOfDay(range.end)) return false;

      if (filters.transactionType === 'expense' && !t.isExpense) return false;
      if (filters.transactionType === 'income'  &&  t.isExpense) return false;

      if (filters.account && filters.account !== 'all') {
        const pm = (t.paymentMethod ?? '').toLowerCase();
        if (pm !== filters.account.toLowerCase()) return false;
      }

      return true;
    });
  }

  private endOfDay(d: Date): Date {
    const out = new Date(d);
    out.setHours(23, 59, 59, 999);
    return out;
  }

  // ─── Available accounts ────────────────────────────────────────────────────

  private extractAccounts(txs: TransactionDto[]): string[] {
    const set = new Set<string>();
    for (const t of txs) {
      const pm = t.paymentMethod?.trim();
      if (pm) set.add(pm);
    }
    return Array.from(set).sort();
  }

  // ─── Category frequencies ──────────────────────────────────────────────────

  private buildCategoryFrequencies(
    current: TransactionDto[],
    previous: TransactionDto[],
    range: PeriodRange,
  ): CategoryFrequency[] {
    const map = new Map<string, TransactionDto[]>();

    for (const t of current) {
      const cat = this.resolveCategoryName(t);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }

    // Previous period counts per category
    const prevCounts = new Map<string, number>();
    for (const t of previous) {
      const cat = this.resolveCategoryName(t);
      prevCounts.set(cat, (prevCounts.get(cat) ?? 0) + 1);
    }

    const result: CategoryFrequency[] = [];

    for (const [catName, txs] of map) {
      const count          = txs.length;
      const totalAmount    = txs.reduce((s, t) => s + t.totalAmount, 0);
      const averageAmount  = count > 0 ? totalAmount / count : 0;
      const normalised     = (count / range.days) * 30;
      const prevCount      = prevCounts.get(catName) ?? 0;
      const trendPercent   = computeTrendPercent(count, prevCount);

      // Active days (distinct calendar dates)
      const activeDaysSet = new Set<string>();
      for (const t of txs) {
        activeDaysSet.add(new Date(t.transactionDate).toDateString());
      }

      // Average gap between transactions
      const sorted = [...txs].sort(
        (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime(),
      );
      let avgGap: number | null = null;
      if (sorted.length >= 2) {
        const gaps: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
          const diff =
            new Date(sorted[i].transactionDate).getTime() -
            new Date(sorted[i - 1].transactionDate).getTime();
          gaps.push(diff / 86_400_000);
        }
        avgGap = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length * 10) / 10;
      }

      const lastDate = sorted.at(-1)?.transactionDate ?? null;
      const computedAvgPerWeek = Math.round((count / range.days) * 7 * 10) / 10;

      result.push({
        categoryId:           catName,
        categoryName:         catName,
        transactionCount:     count,
        normalizedMonthlyCount: Math.round(normalised * 10) / 10,
        activeDays:           activeDaysSet.size,
        totalAmount,
        averageAmount:        Math.round(averageAmount),
        averageGapDays:       avgGap,
        averagePerWeek:       computedAvgPerWeek,
        lastTransactionAt:    lastDate,
        trendPercent:         prevCount === 0 && count === 0 ? null : trendPercent,
        frequencyLevel:       getFrequencyLevel(normalised),
      });
    }

    return result.sort((a, b) => b.transactionCount - a.transactionCount);
  }

  // ─── Summary / KPI ─────────────────────────────────────────────────────────

  private buildSummary(
    current: TransactionDto[],
    previous: TransactionDto[],
    categories: CategoryFrequency[],
    range: PeriodRange,
  ): FrequencySummary {
    const total    = current.length;
    const prevTotal = previous.length;

    const top = categories[0] ?? null;

    // "Repeat rate" = transactions in frequent+ categories / total
    const frequentCats = new Set(
      categories
        .filter((c) => c.frequencyLevel === 'very_frequent' || c.frequencyLevel === 'frequent')
        .map((c) => c.categoryName),
    );
    const repeatTxs = current.filter((t) => {
      const cat = this.resolveCategoryName(t);
      return frequentCats.has(cat);
    });
    const repeatRate = total > 0 ? Math.round((repeatTxs.length / total) * 100) : 0;

    return {
      totalTransactions:          total,
      previousPeriodChange:       prevTotal > 0 || total > 0
        ? computeTrendPercent(total, prevTotal)
        : null,
      averagePerWeek:             Math.round((total / range.days) * 7 * 10) / 10,
      mostFrequentCategory:       top?.categoryName ?? null,
      mostFrequentCategoryCount:  top?.transactionCount ?? 0,
      repeatRate,
    };
  }

  // ─── Timeline ──────────────────────────────────────────────────────────────

  private buildTimeline(
    txs: TransactionDto[],
    range: PeriodRange,
    lang: string,
  ): FrequencyTimelinePoint[] {
    const locale = lang === 'vi' ? 'vi-VN' : 'en-US';

    if (range.days <= 31) {
      return this.buildDailyTimeline(txs, range, locale, lang);
    } else if (range.days <= 90) {
      return this.buildWeeklyTimeline(txs, range, locale, lang);
    } else {
      return this.buildMonthlyTimeline(txs, range, locale);
    }
  }

  private buildDailyTimeline(
    txs: TransactionDto[],
    range: PeriodRange,
    locale: string,
    lang: string,
  ): FrequencyTimelinePoint[] {
    const map = new Map<string, FrequencyTimelinePoint>();
    const cur = new Date(range.start);
    while (cur <= range.end) {
      const key = cur.toDateString();
      map.set(key, {
        label:            formatDateLabel(cur, locale),
        date:             cur.toISOString(),
        transactionCount: 0,
        totalAmount:      0,
        totalExpense:     0,
        totalIncome:      0,
      });
      cur.setDate(cur.getDate() + 1);
    }

    for (const t of txs) {
      const key = new Date(t.transactionDate).toDateString();
      const pt  = map.get(key);
      if (pt) {
        pt.transactionCount++;
        pt.totalAmount += t.totalAmount;
        if (t.isExpense) pt.totalExpense += t.totalAmount;
        else             pt.totalIncome  += t.totalAmount;
      }
    }

    return Array.from(map.values());
  }

  private buildWeeklyTimeline(
    txs: TransactionDto[],
    range: PeriodRange,
    locale: string,
    lang: string,
  ): FrequencyTimelinePoint[] {
    const buckets = new Map<string, FrequencyTimelinePoint>();

    const getWeekKey = (d: Date): string => {
      const mon = new Date(d);
      mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
      mon.setHours(0, 0, 0, 0);
      return mon.toISOString();
    };

    for (const t of txs) {
      const d   = new Date(t.transactionDate);
      const key = getWeekKey(d);
      if (!buckets.has(key)) {
        const weekStart = new Date(key);
        buckets.set(key, {
          label:            formatWeekLabel(weekStart, locale, lang),
          date:             key,
          transactionCount: 0,
          totalAmount:      0,
          totalExpense:     0,
          totalIncome:      0,
        });
      }
      const pt = buckets.get(key)!;
      pt.transactionCount++;
      pt.totalAmount += t.totalAmount;
      if (t.isExpense) pt.totalExpense += t.totalAmount;
      else             pt.totalIncome  += t.totalAmount;
    }

    return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  private buildMonthlyTimeline(
    txs: TransactionDto[],
    range: PeriodRange,
    locale: string,
  ): FrequencyTimelinePoint[] {
    const buckets = new Map<string, FrequencyTimelinePoint>();

    const getMonthKey = (d: Date): string =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    for (const t of txs) {
      const d   = new Date(t.transactionDate);
      const key = getMonthKey(d);
      if (!buckets.has(key)) {
        const first = new Date(d.getFullYear(), d.getMonth(), 1);
        buckets.set(key, {
          label:            formatMonthLabel(first, locale),
          date:             first.toISOString(),
          transactionCount: 0,
          totalAmount:      0,
          totalExpense:     0,
          totalIncome:      0,
        });
      }
      const pt = buckets.get(key)!;
      pt.transactionCount++;
      pt.totalAmount += t.totalAmount;
      if (t.isExpense) pt.totalExpense += t.totalAmount;
      else             pt.totalIncome  += t.totalAmount;
    }

    return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  // ─── Distribution ──────────────────────────────────────────────────────────

  private buildDistribution(categories: CategoryFrequency[]): FrequencyLevelBucket[] {
    const order: FrequencyLevel[] = ['very_frequent', 'frequent', 'occasional', 'rare', 'unused'];
    const map = new Map<FrequencyLevel, FrequencyLevelBucket>(
      order.map((l) => [l, { level: l, categoryCount: 0, transactionCount: 0 }]),
    );

    for (const cat of categories) {
      const bucket = map.get(cat.frequencyLevel)!;
      bucket.categoryCount++;
      bucket.transactionCount += cat.transactionCount;
    }

    return order.map((l) => map.get(l)!).filter((b) => b.categoryCount > 0);
  }

  // ─── Frequent transactions ─────────────────────────────────────────────────

  private buildFrequentTransactions(
    current: TransactionDto[],
    previous: TransactionDto[],
    range: PeriodRange,
  ): FrequentTransaction[] {
    const map = new Map<string, TransactionDto[]>();

    for (const t of current) {
      const key = this.resolveTxName(t);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }

    const prevCounts = new Map<string, number>();
    for (const t of previous) {
      const key = this.resolveTxName(t);
      prevCounts.set(key, (prevCounts.get(key) ?? 0) + 1);
    }

    const result: FrequentTransaction[] = [];

    for (const [name, txs] of map) {
      if (txs.length < 2) continue; // Only show groups with >= 2 occurrences

      const count       = txs.length;
      const total       = txs.reduce((s, t) => s + t.totalAmount, 0);
      const avg         = Math.round(total / count);
      const prevCount   = prevCounts.get(name) ?? 0;
      const trend       = computeTrendPercent(count, prevCount);

      const sorted = [...txs].sort(
        (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime(),
      );
      let avgGap: number | null = null;
      if (sorted.length >= 2) {
        const gaps: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
          const diff =
            new Date(sorted[i].transactionDate).getTime() -
            new Date(sorted[i - 1].transactionDate).getTime();
          gaps.push(diff / 86_400_000);
        }
        avgGap = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length * 10) / 10;
      }

      result.push({
        name,
        categoryName:     this.resolveCategoryName(txs[0]),
        transactionCount: count,
        averageAmount:    avg,
        totalAmount:      total,
        averageGapDays:   avgGap,
        trendPercent:     prevCount === 0 && count === 0 ? null : trend,
      });
    }

    return result.sort((a, b) => b.transactionCount - a.transactionCount).slice(0, 10);
  }

  // ─── Rule-based insights ───────────────────────────────────────────────────

  private buildInsights(
    summary: FrequencySummary,
    categories: CategoryFrequency[],
    freqTxs: FrequentTransaction[],
    range: PeriodRange,
    lang: string,
  ): FrequencyInsight[] {
    const vi = lang === 'vi';
    const insights: FrequencyInsight[] = [];

    // Not enough data
    if (summary.totalTransactions < 5) {
      return [{
        id:          'no_data',
        type:        'info',
        title:       vi ? 'Chưa đủ dữ liệu' : 'Not enough data',
        description: vi
          ? 'Chưa có đủ dữ liệu để phân tích thói quen giao dịch trong khoảng thời gian này.'
          : 'Not enough data to analyse transaction habits for this period.',
      }];
    }

    // High frequency but small amounts
    const highFreqSmallAmt = freqTxs.find(
      (t) => t.transactionCount >= 8 && t.averageAmount < 100_000,
    );
    if (highFreqSmallAmt) {
      const fmt = (n: number) => new Intl.NumberFormat(vi ? 'vi-VN' : 'en-US').format(n);
      insights.push({
        id:   'high_freq_small',
        type: 'info',
        title: vi
          ? `Giao dịch nhỏ thường xuyên: ${highFreqSmallAmt.name}`
          : `Frequent small transactions: ${highFreqSmallAmt.name}`,
        description: vi
          ? `Bạn có ${highFreqSmallAmt.transactionCount} giao dịch tại "${highFreqSmallAmt.name}" trong ${range.days} ngày. Mỗi lần trung bình ${fmt(highFreqSmallAmt.averageAmount)}đ, tổng cộng ${fmt(highFreqSmallAmt.totalAmount)}đ.`
          : `You have ${highFreqSmallAmt.transactionCount} transactions at "${highFreqSmallAmt.name}" over ${range.days} days. Average ${fmt(highFreqSmallAmt.averageAmount)} per visit, totalling ${fmt(highFreqSmallAmt.totalAmount)}.`,
      });
    }

    // Trend increased strongly
    const topTrend = categories.find(
      (c) => (c.trendPercent ?? 0) > 20 && c.transactionCount >= 3,
    );
    if (topTrend) {
      insights.push({
        id:   'trend_up',
        type: 'warning',
        title: vi
          ? `Tần suất tăng mạnh: ${topTrend.categoryName}`
          : `Sharp increase: ${topTrend.categoryName}`,
        description: vi
          ? `Tần suất giao dịch thuộc danh mục "${topTrend.categoryName}" tăng ${topTrend.trendPercent}% so với kỳ trước.`
          : `Transaction frequency in "${topTrend.categoryName}" rose ${topTrend.trendPercent}% vs. previous period.`,
      });
    }

    // High value, low frequency
    const totalExpense = categories
      .filter((c) => c.totalAmount > 0)
      .reduce((s, c) => s + c.totalAmount, 0);
    const highValLowFreq = categories.find(
      (c) =>
        c.transactionCount <= 3 &&
        c.totalAmount > 0 &&
        totalExpense > 0 &&
        (c.totalAmount / totalExpense) > 0.25,
    );
    if (highValLowFreq) {
      const pct = Math.round((highValLowFreq.totalAmount / totalExpense) * 100);
      const fmt = (n: number) => new Intl.NumberFormat(vi ? 'vi-VN' : 'en-US').format(n);
      insights.push({
        id:   'high_val_low_freq',
        type: 'info',
        title: vi
          ? `Giá trị lớn, ít phát sinh: ${highValLowFreq.categoryName}`
          : `High value, low frequency: ${highValLowFreq.categoryName}`,
        description: vi
          ? `"${highValLowFreq.categoryName}" chỉ xuất hiện ${highValLowFreq.transactionCount} lần nhưng chiếm ${pct}% tổng chi tiêu (${fmt(highValLowFreq.totalAmount)}đ).`
          : `"${highValLowFreq.categoryName}" occurred only ${highValLowFreq.transactionCount} times but accounts for ${pct}% of total spending (${fmt(highValLowFreq.totalAmount)}).`,
      });
    }

    return insights.slice(0, 3);
  }

  // ─── Name resolution ───────────────────────────────────────────────────────

  /**
   * Resolves the best available name for grouping frequent transactions.
   * Priority: transaction name → first item name → category name → 'Unknown'
   */
  private resolveTxName(t: TransactionDto): string {
    if (t.name && t.name.trim()) return t.name.trim();
    const first = t.transactionDetails?.[0];
    if (first?.itemName?.trim()) return first.itemName.trim();
    if (first?.categoryName?.trim()) return first.categoryName.trim();
    return 'Unknown';
  }

  /** Returns the primary category name for a transaction. */
  private resolveCategoryName(t: TransactionDto): string {
    const first = t.transactionDetails?.[0];
    const cat   = first?.categoryName?.trim();
    return cat || 'Khác';
  }
}
