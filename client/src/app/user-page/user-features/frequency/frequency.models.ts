/**
 * Frequency feature models.
 *
 * FrequencyLevel is always derived at runtime from transaction counts
 * normalised to a 30-day window.  It is NEVER stored on a Category entity.
 */

// ─── Frequency level ────────────────────────────────────────────────────────

export type FrequencyLevel =
  | 'very_frequent'
  | 'frequent'
  | 'occasional'
  | 'rare'
  | 'unused';

// ─── Period type ─────────────────────────────────────────────────────────────

export type FrequencyPeriod = '7days' | '30days' | '3months' | '6months' | 'custom';

// ─── Transaction type filter ─────────────────────────────────────────────────

export type TransactionTypeFilter = 'all' | 'expense' | 'income';

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface FrequencyFilters {
  period: FrequencyPeriod;
  transactionType: TransactionTypeFilter;
  /** Payment method / account, or 'all' */
  account: string;
  /** Used when period === 'custom' */
  customStartDate?: string;
  customEndDate?: string;
}

// ─── KPI summary ─────────────────────────────────────────────────────────────

export interface FrequencySummary {
  /** Number of transactions in current period */
  totalTransactions: number;
  /** Percentage change vs previous period (+/-) */
  previousPeriodChange: number | null;
  /** Average number of transactions per week in current period */
  averagePerWeek: number;
  /** Name of the most-used category */
  mostFrequentCategory: string | null;
  /** Transaction count of the most-used category */
  mostFrequentCategoryCount: number;
  /**
   * Percentage of transactions that belong to categories with
   * frequencyLevel "frequent" or higher.
   */
  repeatRate: number;
}

// ─── Category frequency ───────────────────────────────────────────────────────

export interface CategoryFrequency {
  categoryId: number | string;
  categoryName: string;
  /** Raw transaction count in the selected period */
  transactionCount: number;
  /**
   * Count normalised to a 30-day window:
   *   transactionCount / selectedPeriodDays * 30
   */
  normalizedMonthlyCount: number;
  /** Days on which at least one transaction occurred */
  activeDays: number;
  totalAmount: number;
  averageAmount: number;
  /** Average number of calendar days between transactions, or null if <= 1 tx */
  averageGapDays: number | null;
  averagePerWeek: number;
  /** ISO date string of the most recent transaction */
  lastTransactionAt: string | null;
  /** Percentage change in transaction count vs previous period */
  trendPercent: number | null;
  frequencyLevel: FrequencyLevel;
}

// ─── Timeline data point ──────────────────────────────────────────────────────

export interface FrequencyTimelinePoint {
  /** Display label (e.g. "17/07", "Tuần 3", "T7/2026") */
  label: string;
  /** ISO date string (start of the bucket) */
  date: string;
  transactionCount: number;
  totalAmount: number;
  /** Breakdown for tooltip */
  totalExpense: number;
  totalIncome: number;
}

// ─── Frequent transaction group ───────────────────────────────────────────────

export interface FrequentTransaction {
  /** Merchant name, transaction name, item name, or category name */
  name: string;
  categoryName: string;
  transactionCount: number;
  averageAmount: number;
  totalAmount: number;
  /** Average calendar days between occurrences, or null if <= 1 tx */
  averageGapDays: number | null;
  /** Percentage change in count vs previous period */
  trendPercent: number | null;
}

// ─── Frequency level distribution ────────────────────────────────────────────

export interface FrequencyLevelBucket {
  level: FrequencyLevel;
  categoryCount: number;
  transactionCount: number;
}

// ─── Auto-generated insight ───────────────────────────────────────────────────

export interface FrequencyInsight {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  description: string;
}

// ─── Full page data ───────────────────────────────────────────────────────────

export interface FrequencyPageData {
  summary: FrequencySummary;
  timeline: FrequencyTimelinePoint[];
  categories: CategoryFrequency[];
  distribution: FrequencyLevelBucket[];
  frequentTransactions: FrequentTransaction[];
  insights: FrequencyInsight[];
  /** Distinct payment methods found in data, for the account filter */
  availableAccounts: string[];
  /** Number of days in the selected period */
  periodDays: number;
}
