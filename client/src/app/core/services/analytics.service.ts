import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, of } from 'rxjs';
import { TransactionService } from './transaction.service';
import { BudgetService, BudgetDto } from './budget.service';
import { TransactionDto } from '../../models/transaction.dto';
import { 
  MOCK_TRANSACTIONS, 
  MOCK_BUDGETS, 
  MOCK_RECURRING_EXPENSES, 
  MOCK_MERCHANTS,
  RecurringExpenseDto,
  MerchantDto
} from '../../user-page/user-features/analysis/mock-analysis-data';

export interface KPIStats {
  value: number;
  percentageChange: number; // vs previous period
  isBetter: boolean; // is increase/decrease positive? (e.g. increase in income is better, increase in expense is worse)
  sparklineData: number[];
}

export interface CashFlowDataPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategorySpendingDto {
  name: string;
  categoryKey: string;
  amount: number;
  percentage: number;
  percentageChange: number;
  isUp: boolean;
  icon: string;
  color: string;
}

export interface BudgetPerformanceDto {
  name: string;
  spent: number;
  limit: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
}

export interface FinancialInsightDto {
  id: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionKey: string;
  actionType: 'view_tx' | 'adjust_budget' | 'create_goal' | 'view_detail';
  meta?: any;
}

export interface SpendingComparisonPoint {
  label: string;
  currentAmount: number;
  previousAmount: number;
}

export interface SpendingComparisonDto {
  conclusion: string;
  points: SpendingComparisonPoint[];
}

export interface AnalyticsReport {
  kpis: {
    income: KPIStats;
    expense: KPIStats;
    savings: KPIStats;
    rate: KPIStats;
  };
  cashFlow: CashFlowDataPoint[];
  categorySpending: CategorySpendingDto[];
  budgets: BudgetPerformanceDto[];
  insights: FinancialInsightDto[];
  comparison: SpendingComparisonDto;
  recurring: {
    items: RecurringExpenseDto[];
    totalMonthly: number;
  };
  merchants: MerchantDto[];
  notableTransactions: TransactionDto[];
  accounts: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly transactionService = inject(TransactionService);
  private readonly budgetService = inject(BudgetService);

  /**
   * Generates a complete spend analysis report for the specified parameters.
   */
  getAnalysisReport(
    period: string,
    account: string,
    customStart?: Date,
    customEnd?: Date
  ): Observable<AnalyticsReport> {
    return combineLatest([
      this.transactionService.getTransactions(),
      this.budgetService.getBudgets()
    ]).pipe(
      map(([realTxs, realBudgets]) => {
        // Decide whether we need to fall back to mock data
        // If there are no real transactions, we use mock transactions so the page looks stunning
        const useMock = realTxs.length === 0;
        const txs = useMock ? MOCK_TRANSACTIONS : realTxs;
        const budgets = useMock ? MOCK_BUDGETS : (realBudgets || []);

        // 1. Get unique account list (paymentMethods)
        const accountsSet = new Set<string>();
        txs.forEach(t => {
          if (t.paymentMethod) {
            accountsSet.add(t.paymentMethod);
          }
        });
        const accounts = Array.from(accountsSet);

        // 2. Parse date ranges for current and previous periods
        const { start, end, prevStart, prevEnd } = this.getDateRanges(period, customStart, customEnd);

        // 3. Filter transactions
        const currentTxs = this.filterTxs(txs, start, end, account);
        const previousTxs = this.filterTxs(txs, prevStart, prevEnd, account);

        // 4. Calculate KPIs
        const kpis = this.calculateKPIs(currentTxs, previousTxs, txs, start, end, account);

        // 5. Cash Flow points
        const cashFlow = this.calculateCashFlow(currentTxs, start, end, period);

        // 6. Category spending
        const categorySpending = this.calculateCategorySpending(currentTxs, previousTxs);

        // 7. Budget performance
        const budgetPerformance = this.calculateBudgetPerformance(budgets, currentTxs);

        // 8. AI Insights
        const insights = this.generateInsights(currentTxs, previousTxs, budgetPerformance);

        // 9. Comparison Chart
        const comparison = this.calculateComparison(txs, period, start, end, prevStart, prevEnd, account);

        // 10. Recurring expenses (Netflix, Spotify...)
        const recurringItems = MOCK_RECURRING_EXPENSES;
        const recurringTotal = recurringItems.reduce((sum, item) => sum + item.amount, 0);

        // 11. Notable transactions (High value, unusual...)
        const notableTransactions = this.getNotableTransactions(currentTxs);

        return {
          kpis,
          cashFlow,
          categorySpending,
          budgets: budgetPerformance,
          insights,
          comparison,
          recurring: {
            items: recurringItems,
            totalMonthly: recurringTotal
          },
          merchants: MOCK_MERCHANTS,
          notableTransactions,
          accounts
        };
      })
    );
  }

  private filterTxs(txs: TransactionDto[], start: Date, end: Date, account: string): TransactionDto[] {
    return txs.filter(t => {
      const tDate = new Date(t.transactionDate);
      const inDateRange = tDate >= start && tDate <= end;
      if (!inDateRange) return false;
      if (account !== 'all' && t.paymentMethod !== account) return false;
      return true;
    });
  }

  private calculateKPIs(
    current: TransactionDto[],
    previous: TransactionDto[],
    allTxs: TransactionDto[],
    start: Date,
    end: Date,
    account: string
  ): AnalyticsReport['kpis'] {
    // Current totals
    const curInc = current.filter(t => !t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
    const curExp = current.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
    const curSav = curInc - curExp;
    const curRate = curInc > 0 ? (curSav / curInc) * 100 : 0;

    // Previous totals
    const prevInc = previous.filter(t => !t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
    const prevExp = previous.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
    const prevSav = prevInc - prevExp;
    const prevRate = prevInc > 0 ? (prevSav / prevInc) * 100 : 0;

    // Percent changes
    const pctInc = prevInc > 0 ? ((curInc - prevInc) / prevInc) * 100 : 0;
    const pctExp = prevExp > 0 ? ((curExp - prevExp) / prevExp) * 100 : 0;
    const pctSav = prevSav > 0 ? ((curSav - prevSav) / prevSav) * 100 : 0;
    const pctRate = curRate - prevRate; // absolute rate difference

    // Generate sparklines (e.g. 7 points representing chronological subdivision of current period)
    const segments = 7;
    const incSpark = this.generateSparkline(current.filter(t => !t.isExpense), start, end, segments);
    const expSpark = this.generateSparkline(current.filter(t => t.isExpense), start, end, segments);
    
    // Net savings sparkline is inc - exp for each segment
    const savSpark = incSpark.map((inc, i) => inc - expSpark[i]);
    // Savings rate sparkline
    const rateSpark = incSpark.map((inc, i) => inc > 0 ? Math.round(((inc - expSpark[i]) / inc) * 100) : 0);

    return {
      income: {
        value: curInc,
        percentageChange: Math.round(pctInc * 10) / 10,
        isBetter: curInc >= prevInc,
        sparklineData: incSpark
      },
      expense: {
        value: curExp,
        percentageChange: Math.round(pctExp * 10) / 10,
        isBetter: curExp <= prevExp, // Lower expense is better!
        sparklineData: expSpark
      },
      savings: {
        value: curSav,
        percentageChange: Math.round(pctSav * 10) / 10,
        isBetter: curSav >= prevSav,
        sparklineData: savSpark
      },
      rate: {
        value: Math.round(curRate * 10) / 10,
        percentageChange: Math.round(pctRate * 10) / 10,
        isBetter: curRate >= prevRate,
        sparklineData: rateSpark
      }
    };
  }

  private generateSparkline(txs: TransactionDto[], start: Date, end: Date, segments: number): number[] {
    const data = new Array(segments).fill(0);
    if (txs.length === 0) return data;

    const startMs = start.getTime();
    const rangeMs = end.getTime() - startMs;
    const stepMs = rangeMs / segments;

    txs.forEach(t => {
      const tMs = new Date(t.transactionDate).getTime();
      const offset = tMs - startMs;
      if (offset >= 0 && offset <= rangeMs) {
        const segIndex = Math.min(Math.floor(offset / stepMs), segments - 1);
        data[segIndex] += t.totalAmount;
      }
    });

    return data;
  }

  private calculateCashFlow(
    txs: TransactionDto[], 
    start: Date, 
    end: Date, 
    period: string
  ): CashFlowDataPoint[] {
    // Depending on the period type, we divide the time scale into days, weeks, or months
    const points: CashFlowDataPoint[] = [];
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      // Daily (7 points)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(end);
        d.setDate(d.getDate() - i);
        const label = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(d);
        const dayTxs = txs.filter(t => new Date(t.transactionDate).toDateString() === d.toDateString());
        const inc = dayTxs.filter(t => !t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
        const exp = dayTxs.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
        points.push({ label, income: inc, expense: exp, net: inc - exp });
      }
    } else if (diffDays <= 31) {
      // Weekly (4 points or by 5-day intervals)
      // Group by weeks
      for (let i = 4; i >= 1; i--) {
        const label = `Tu\u1ea7n ${5 - i}`;
        const wEnd = new Date(end);
        wEnd.setDate(wEnd.getDate() - (i - 1) * 7);
        const wStart = new Date(wEnd);
        wStart.setDate(wStart.getDate() - 6);
        wStart.setHours(0,0,0,0);
        wEnd.setHours(23,59,59,999);

        const wTxs = txs.filter(t => {
          const td = new Date(t.transactionDate);
          return td >= wStart && td <= wEnd;
        });

        const inc = wTxs.filter(t => !t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
        const exp = wTxs.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
        points.push({ label, income: inc, expense: exp, net: inc - exp });
      }
    } else {
      // Monthly (e.g. by months or weeks depending on duration)
      if (diffDays <= 100) {
        // Group by weeks
        for (let i = 10; i >= 1; i--) {
          const wEnd = new Date(end);
          wEnd.setDate(wEnd.getDate() - (i - 1) * 7);
          const label = `${wEnd.getDate()}/${wEnd.getMonth() + 1}`;
          const wStart = new Date(wEnd);
          wStart.setDate(wStart.getDate() - 6);
          wStart.setHours(0,0,0,0);
          wEnd.setHours(23,59,59,999);

          const wTxs = txs.filter(t => {
            const td = new Date(t.transactionDate);
            return td >= wStart && td <= wEnd;
          });

          const inc = wTxs.filter(t => !t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
          const exp = wTxs.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
          points.push({ label, income: inc, expense: exp, net: inc - exp });
        }
      } else {
        // Group by calendar months
        const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        const tempStart = new Date(start);
        while (tempStart <= end) {
          const y = tempStart.getFullYear();
          const m = tempStart.getMonth();
          const label = `${monthNames[m]} ${y}`;
          
          const mTxs = txs.filter(t => {
            const td = new Date(t.transactionDate);
            return td.getFullYear() === y && td.getMonth() === m;
          });

          const inc = mTxs.filter(t => !t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
          const exp = mTxs.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
          points.push({ label, income: inc, expense: exp, net: inc - exp });

          tempStart.setMonth(tempStart.getMonth() + 1);
        }
      }
    }

    return points;
  }

  private calculateCategorySpending(current: TransactionDto[], previous: TransactionDto[]): CategorySpendingDto[] {
    const curExpTxs = current.filter(t => t.isExpense);
    const prevExpTxs = previous.filter(t => t.isExpense);

    const totalExp = curExpTxs.reduce((sum, t) => sum + t.totalAmount, 0);
    const categoryTotalsMap = new Map<string, number>();
    const categoryIconMap: Record<string, string> = {
      '\u0102n u\u1ed1ng': 'lunch_dining',
      'Food': 'lunch_dining',
      'Food & Dining': 'lunch_dining',
      'Nh\u00e0 \u1edf': 'home',
      'Housing': 'home',
      'Di chuy\u1ec3n': 'directions_car',
      'Travel': 'directions_car',
      'Mua s\u1eafm': 'shopping_bag',
      'Shopping': 'shopping_bag',
      'Gi\u1ea3i tr\u00ed': 'sports_esports',
      'Entertainment': 'sports_esports',
      'H\u00f3a \u0111\u01a1n': 'receipt_long',
      'Bills': 'receipt_long',
      'Bills & Utilities': 'receipt_long',
      'Kh\u00e1c': 'pending_actions',
      'Other': 'pending_actions'
    };

    const categoryColorMap: Record<string, string> = {
      '\u0102n u\u1ed1ng': '#6366f1', // Indigo
      'Food': '#6366f1',
      'Food & Dining': '#6366f1',
      'Nh\u00e0 \u1edf': '#10b981', // Green
      'Housing': '#10b981',
      'Di chuy\u1ec3n': '#f59e0b', // Amber
      'Travel': '#f59e0b',
      'Mua s\u1eafm': '#ec4899', // Pink
      'Shopping': '#ec4899',
      'Gi\u1ea3i tr\u00ed': '#8b5cf6', // Violet
      'Entertainment': '#8b5cf6',
      'H\u00f3a \u0111\u01a1n': '#06b6d4', // Cyan
      'Bills': '#06b6d4',
      'Bills & Utilities': '#06b6d4',
      'Kh\u00e1c': '#64748b', // Slate
      'Other': '#64748b'
    };

    const categoryTranslateKeys: Record<string, string> = {
      '\u0102n u\u1ed1ng': 'analysis.categories.food',
      'Food': 'analysis.categories.food',
      'Food & Dining': 'analysis.categories.food',
      'Nh\u00e0 \u1edf': 'analysis.categories.housing',
      'Housing': 'analysis.categories.housing',
      'Di chuy\u1ec3n': 'analysis.categories.travel',
      'Travel': 'analysis.categories.travel',
      'Mua s\u1eafm': 'analysis.categories.shopping',
      'Shopping': 'analysis.categories.shopping',
      'Gi\u1ea3i tr\u00ed': 'analysis.categories.entertainment',
      'Entertainment': 'analysis.categories.entertainment',
      'H\u00f3a \u0111\u01a1n': 'analysis.categories.bills',
      'Bills': 'analysis.categories.bills',
      'Bills & Utilities': 'analysis.categories.bills',
      'Kh\u00e1c': 'analysis.categories.other',
      'Other': 'analysis.categories.other'
    };

    // Calculate current category totals
    curExpTxs.forEach(t => {
      // Find category name from details or fallback to default
      const cat = t.transactionDetails?.[0]?.categoryName || 'Kh\u00e1c';
      categoryTotalsMap.set(cat, (categoryTotalsMap.get(cat) || 0) + t.totalAmount);
    });

    // Calculate previous category totals for comparison
    const prevCategoryTotalsMap = new Map<string, number>();
    prevExpTxs.forEach(t => {
      const cat = t.transactionDetails?.[0]?.categoryName || 'Kh\u00e1c';
      prevCategoryTotalsMap.set(cat, (prevCategoryTotalsMap.get(cat) || 0) + t.totalAmount);
    });

    const breakdown: CategorySpendingDto[] = [];
    categoryTotalsMap.forEach((amount, name) => {
      const percentage = totalExp > 0 ? (amount / totalExp) * 100 : 0;
      const prevAmount = prevCategoryTotalsMap.get(name) || 0;
      const percentageChange = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : 0;
      
      const normalizedName = name.trim();
      const icon = categoryIconMap[normalizedName] || 'pending_actions';
      const color = categoryColorMap[normalizedName] || '#64748b';
      const categoryKey = categoryTranslateKeys[normalizedName] || 'analysis.categories.other';

      breakdown.push({
        name: normalizedName,
        categoryKey,
        amount,
        percentage: Math.round(percentage * 10) / 10,
        percentageChange: Math.round(Math.abs(percentageChange) * 10) / 10,
        isUp: amount >= prevAmount,
        icon,
        color
      });
    });

    // Sort descending by amount
    return breakdown.sort((a, b) => b.amount - a.amount);
  }

  private calculateBudgetPerformance(budgets: BudgetDto[], txs: TransactionDto[]): BudgetPerformanceDto[] {
    const expenseTxs = txs.filter(t => t.isExpense);
    
    return budgets.map(b => {
      // Calculate amount spent against this budget
      let spent = 0;
      if (b.currentAmount !== undefined) {
        // If the budget has a pre-calculated currentAmount from backend
        // Wait, currentAmount is remaining amount or spent amount?
        // Looking at dashboard.ts line 358:
        // const spent = budget.amount - budget.currentAmount;
        // So spent = b.amount - b.currentAmount. Let's calculate dynamically as fallback if currentAmount is missing.
        spent = b.amount - b.currentAmount;
      } else {
        // Dynamic budget calculation based on date range and category
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        bStart.setHours(0, 0, 0, 0);
        bEnd.setHours(23, 59, 59, 999);

        spent = expenseTxs.reduce((sum, t) => {
          const td = new Date(t.transactionDate);
          if (td >= bStart && td <= bEnd) {
            if (!b.categoryId) {
              return sum + t.totalAmount;
            } else {
              const catSum = (t.transactionDetails || [])
                .filter(d => d.categoryId === b.categoryId)
                .reduce((s, d) => s + (d.price * d.quantity), 0);
              return sum + catSum;
            }
          }
          return sum;
        }, 0);
      }

      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      let status: BudgetPerformanceDto['status'] = 'safe';
      if (percentage >= 100) {
        status = 'danger';
      } else if (percentage >= 85) {
        status = 'warning';
      }

      return {
        name: b.name,
        spent,
        limit: b.amount,
        remaining: Math.max(0, b.amount - spent),
        percentage: Math.min(100, Math.round(percentage)),
        status
      };
    });
  }

  private generateInsights(
    current: TransactionDto[],
    previous: TransactionDto[],
    budgets: BudgetPerformanceDto[]
  ): FinancialInsightDto[] {
    const insights: FinancialInsightDto[] = [];
    const curExp = current.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
    const prevExp = previous.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);

    // 1. Food trend insight
    const foodCurrent = current.filter(t => t.isExpense && (t.transactionDetails?.[0]?.categoryName === '\u0102n u\u1ed1ng' || t.transactionDetails?.[0]?.categoryName === 'Food' || t.transactionDetails?.[0]?.categoryName === 'Food & Dining')).reduce((sum, t) => sum + t.totalAmount, 0);
    const foodPrevious = previous.filter(t => t.isExpense && (t.transactionDetails?.[0]?.categoryName === '\u0102n u\u1ed1ng' || t.transactionDetails?.[0]?.categoryName === 'Food' || t.transactionDetails?.[0]?.categoryName === 'Food & Dining')).reduce((sum, t) => sum + t.totalAmount, 0);
    if (foodCurrent > 0 && foodPrevious > 0) {
      const pct = ((foodCurrent - foodPrevious) / foodPrevious) * 100;
      if (pct > 10) {
        insights.push({
          id: 'food_increase',
          type: 'warning',
          title: 'Chi ti\u00eau \u0103n u\u1ed1ng t\u0103ng',
          description: `Chi ti\u00eau \u0103n u\u1ed1ng \u0111\u00e3 t\u0103ng ${Math.round(pct)}% so v\u1edbi k\u1ef3 tr\u01b0\u1edbc. H\u00e3y ki\u1ec3m tra l\u1ea1i c\u00e1c \u0111\u01a1n GrabFood ho\u1eb7c nh\u00e0 h\u00e0ng g\u1ea7n \u0111\u00e2y.`,
          priority: 'medium',
          actionKey: 'analysis.insights.actions.viewTx',
          actionType: 'view_tx',
          meta: { categoryName: '\u0102n u\u1ed1ng' }
        });
      }
    }

    // 2. Budget alert insight
    const overBudget = budgets.find(b => b.status === 'danger');
    if (overBudget) {
      insights.push({
        id: 'budget_limit',
        type: 'danger',
        title: 'V\u01b0\u1ee3t ng\u00e2n s\u00e1ch',
        description: `B\u1ea1n \u0111\u00e3 v\u01b0\u1ee3t ng\u00e2n s\u00e1ch danh m\u1ee5c "${overBudget.name}" kho\u1ea3n ${new Intl.NumberFormat('vi-VN').format(overBudget.spent - overBudget.limit)}\u0111.`,
        priority: 'high',
        actionKey: 'analysis.insights.actions.adjust',
        actionType: 'adjust_budget'
      });
    }

    // 3. Potential savings advice
    if (foodCurrent > 1500000) {
      const savingsVal = Math.round(foodCurrent * 0.1);
      insights.push({
        id: 'potential_saving',
        type: 'success',
        title: 'C\u01a1 h\u1ed9i ti\u1ebft ki\u1ec7m',
        description: `N\u1ebfu gi\u1ea3m 10% chi ph\u00ed \u0103n ngo\u00e0i, b\u1ea1n c\u00f3 th\u1ec3 ti\u1ebft ki\u1ec7m th\u00eam kho\u1ea3n ${new Intl.NumberFormat('vi-VN').format(savingsVal)}\u0111 m\u1ed7i th\u00e1ng.`,
        priority: 'low',
        actionKey: 'analysis.insights.actions.goal',
        actionType: 'create_goal'
      });
    }

    // 4. Upcoming bills notification
    insights.push({
      id: 'upcoming_recurring',
      type: 'info',
      title: 'H\u00f3a \u0111\u01a1n s\u1eafp t\u1edbi',
      description: 'B\u1ea1n c\u00f3 3 kho\u1ea3n thanh to\u00e1n \u0111\u1ecbnh k\u1ef3 trong v\u00f2ng 7 ng\u00e0y t\u1edbi (Netflix, Internet, Spotify).',
      priority: 'low',
      actionKey: 'analysis.insights.actions.detail',
      actionType: 'view_detail'
    });

    return insights;
  }

  private calculateComparison(
    allTxs: TransactionDto[],
    period: string,
    start: Date,
    end: Date,
    prevStart: Date,
    prevEnd: Date,
    account: string
  ): SpendingComparisonDto {
    const currentPeriodTxs = this.filterTxs(allTxs, start, end, account);
    const previousPeriodTxs = this.filterTxs(allTxs, prevStart, prevEnd, account);

    const curExp = currentPeriodTxs.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
    const prevExp = previousPeriodTxs.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);

    const change = prevExp > 0 ? ((curExp - prevExp) / prevExp) * 100 : 0;
    const direction = curExp >= prevExp ? 't\u0103ng' : 'gi\u1ea3m';
    
    // Summary conclusion
    let conclusion = `Chi ti\u00eau k\u1ef3 n\u00e0y ${direction} ${Math.abs(Math.round(change * 10) / 10)}% so v\u1edbi k\u1ef3 tr\u01b0\u1edbc.`;
    if (curExp > prevExp) {
      conclusion += ' ch\u1ee7 y\u1ebfu \u0111\u1ebfn t\u1eeb \u0102n u\u1ed1ng v\u00e0 Mua s\u1eafm.';
    } else {
      conclusion += ' do b\u1ea1n \u0111\u00e3 ki\u1ec3m so\u00e1t t\u1ed1t h\u01a1n c\u00e1c kho\u1ea3n mua s\u1eafm ng\u1eabul \u1ee9ng.';
    }

    // Chart points: Group by category
    const pointsMap = new Map<string, { current: number; previous: number }>();
    const allCategories = new Set<string>();

    currentPeriodTxs.filter(t => t.isExpense).forEach(t => {
      const cat = t.transactionDetails?.[0]?.categoryName || 'Kh\u00e1c';
      allCategories.add(cat);
      if (!pointsMap.has(cat)) pointsMap.set(cat, { current: 0, previous: 0 });
      pointsMap.get(cat)!.current += t.totalAmount;
    });

    previousPeriodTxs.filter(t => t.isExpense).forEach(t => {
      const cat = t.transactionDetails?.[0]?.categoryName || 'Kh\u00e1c';
      allCategories.add(cat);
      if (!pointsMap.has(cat)) pointsMap.set(cat, { current: 0, previous: 0 });
      pointsMap.get(cat)!.previous += t.totalAmount;
    });

    const points: SpendingComparisonPoint[] = [];
    pointsMap.forEach((val, key) => {
      points.push({
        label: key,
        currentAmount: val.current,
        previousAmount: val.previous
      });
    });

    // Limit to top 5 categories
    return {
      conclusion,
      points: points.sort((a, b) => (b.currentAmount + b.previousAmount) - (a.currentAmount + a.previousAmount)).slice(0, 5)
    };
  }

  private getNotableTransactions(txs: TransactionDto[]): TransactionDto[] {
    // Sort transactions by amount descending and get notable ones
    // E.g., unusual = expense > 1,000,000đ, high value...
    // Return sorted by date
    return [...txs].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }

  private getDateRanges(period: string, customStart?: Date, customEnd?: Date): {
    start: Date;
    end: Date;
    prevStart: Date;
    prevEnd: Date;
  } {
    const end = new Date();
    let start = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    const today = new Date();

    switch (period) {
      case '7days':
        start.setDate(today.getDate() - 7);
        prevStart.setDate(today.getDate() - 14);
        prevEnd.setDate(today.getDate() - 7 - 1);
        break;
      case '30days':
        start.setDate(today.getDate() - 30);
        prevStart.setDate(today.getDate() - 60);
        prevEnd.setDate(today.getDate() - 30 - 1);
        break;
      case 'lastMonth':
        // 1st day of last month to last day of last month
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end.setTime(new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999).getTime());
        
        prevStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        prevEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0, 23, 59, 59, 999);
        break;
      case '3months':
        start.setMonth(today.getMonth() - 3);
        prevStart.setMonth(today.getMonth() - 6);
        prevEnd.setMonth(today.getMonth() - 3);
        prevEnd.setDate(prevEnd.getDate() - 1);
        break;
      case '6months':
        start.setMonth(today.getMonth() - 6);
        prevStart.setMonth(today.getMonth() - 12);
        prevEnd.setMonth(today.getMonth() - 6);
        prevEnd.setDate(prevEnd.getDate() - 1);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        prevStart = new Date(today.getFullYear() - 1, 0, 1);
        prevEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
        if (customStart && customEnd) {
          start = new Date(customStart);
          end.setTime(customEnd.getTime());
          
          const durationMs = end.getTime() - start.getTime();
          prevEnd = new Date(start.getTime() - 1);
          prevStart = new Date(prevEnd.getTime() - durationMs);
        } else {
          // Default fallback to 30 days
          start.setDate(today.getDate() - 30);
          prevStart.setDate(today.getDate() - 60);
          prevEnd.setDate(today.getDate() - 30 - 1);
        }
        break;
      case 'thisMonth':
      default:
        // 1st of this month to today
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        prevEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        break;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setHours(23, 59, 59, 999);

    return { start, end, prevStart, prevEnd };
  }
}
