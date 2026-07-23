import {
  FrequencyLevel,
  FrequencyPeriod,
} from './frequency.models';

// ─── Frequency level calculation ──────────────────────────────────────────────

/**
 * Derives a frequency level from a count normalised to a 30-day window.
 *
 * Thresholds (normalizedMonthlyCount):
 *   >= 12  → very_frequent
 *   >= 6   → frequent
 *   >= 2   → occasional
 *   >  0   → rare
 *   == 0   → unused
 */
export function getFrequencyLevel(normalizedMonthlyCount: number): FrequencyLevel {
  if (normalizedMonthlyCount >= 12) return 'very_frequent';
  if (normalizedMonthlyCount >= 6)  return 'frequent';
  if (normalizedMonthlyCount >= 2)  return 'occasional';
  if (normalizedMonthlyCount > 0)   return 'rare';
  return 'unused';
}

/**
 * Returns the i18n key for a frequency level label.
 * Call `language.t(key)` in the template or service.
 */
export function getFrequencyLevelKey(level: FrequencyLevel): string {
  const map: Record<FrequencyLevel, string> = {
    very_frequent: 'frequency.level.veryFrequent',
    frequent:      'frequency.level.frequent',
    occasional:    'frequency.level.occasional',
    rare:          'frequency.level.rare',
    unused:        'frequency.level.unused',
  };
  return map[level];
}

// ─── Period date helpers ──────────────────────────────────────────────────────

export interface PeriodRange {
  start: Date;
  end: Date;
  days: number;
}

/**
 * Returns start/end Date objects for the selected period.
 * Custom period requires explicit dates to be passed.
 */
export function calculatePeriodDates(
  period: FrequencyPeriod,
  customStart?: string,
  customEnd?: string,
): PeriodRange {
  const now = new Date();
  const today = startOfDay(now);

  switch (period) {
    case '7days': {
      const start = offsetDays(today, -6);
      return buildRange(start, today);
    }
    case '30days': {
      const start = offsetDays(today, -29);
      return buildRange(start, today);
    }
    case '3months': {
      const start = offsetDays(today, -89);
      return buildRange(start, today);
    }
    case '6months': {
      const start = offsetDays(today, -179);
      return buildRange(start, today);
    }
    case 'custom': {
      if (customStart && customEnd) {
        const start = startOfDay(new Date(customStart));
        const end   = startOfDay(new Date(customEnd));
        return buildRange(start, end);
      }
      // Fallback: last 30 days
      const start = offsetDays(today, -29);
      return buildRange(start, today);
    }
  }
}

/**
 * Returns the immediately preceding period of the same length.
 */
export function calculatePreviousPeriodDates(current: PeriodRange): PeriodRange {
  const prevEnd   = offsetDays(current.start, -1);
  const prevStart = offsetDays(prevEnd, -(current.days - 1));
  return buildRange(prevStart, prevEnd);
}

// ─── Trend percentage ─────────────────────────────────────────────────────────

/**
 * Returns percentage change from previous to current, handling division-by-zero.
 */
export function computeTrendPercent(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

// ─── Date formatting helpers ──────────────────────────────────────────────────

export function formatDateLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
}

export function formatWeekLabel(date: Date, locale: string, lang: string): string {
  const weekNum = getISOWeek(date);
  return lang === 'vi' ? `Tuần ${weekNum}` : `W${weekNum}`;
}

export function formatMonthLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
}

export function formatRelativeDate(isoDate: string | null, lang: string): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  const now   = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) return lang === 'vi' ? 'Hôm nay' : 'Today';
  if (diffDays === 1) return lang === 'vi' ? 'Hôm qua' : 'Yesterday';
  if (diffDays < 7)  return lang === 'vi' ? `${diffDays} ngày trước` : `${diffDays} days ago`;
  return date.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function offsetDays(base: Date, delta: number): Date {
  const out = new Date(base);
  out.setDate(out.getDate() + delta);
  return out;
}

function buildRange(start: Date, end: Date): PeriodRange {
  const diffMs  = end.getTime() - start.getTime();
  const days    = Math.max(1, Math.round(diffMs / 86_400_000) + 1);
  return { start, end, days };
}

/** ISO 8601 week number */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}
