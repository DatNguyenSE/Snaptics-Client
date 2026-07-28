import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, of } from 'rxjs';
import { TransactionService } from './transaction.service';
import { BudgetService, BudgetDto } from './budget.service';
import { TransactionDto } from '../../models/transaction.dto';
export interface RecurringExpenseDto {
  name: string;
  amount: number;
  period: string;
  nextPaymentDate: string;
  icon: string;
  colorClass: string;
}

export interface MerchantDto {
  name: string;
  logoInitials: string;
  transactionsCount: number;
  totalAmount: number;
  percentageChange: number;
  isUp: boolean;
  colorClass: string;
}

/**
 * Thống kê chỉ số KPI tài chính quan trọng
 */
export interface KPIStats {
  value: number;            // Giá trị hiện tại của chỉ số KPI
  percentageChange: number; // Tỷ lệ phần trăm thay đổi so với kỳ trước đó
  isBetter: boolean;        // Chỉ số thay đổi có mang tính tích cực không? (Ví dụ: thu nhập tăng là tốt, chi tiêu tăng là xấu)
  sparklineData: number[];  // Dữ liệu mảng số để vẽ biểu đồ đường mini (sparkline)
}

/**
 * Điểm dữ liệu dòng tiền (thu nhập vs chi tiêu) theo chu kỳ thời gian
 */
export interface CashFlowDataPoint {
  label: string;            // Nhãn hiển thị của mốc thời gian (ví dụ: Thứ hai, Tuần 1, T1 2026)
  income: number;           // Tổng thu nhập trong mốc thời gian này
  expense: number;          // Tổng chi tiêu trong mốc thời gian này
  net: number;              // Lượng tích lũy ròng (Thu nhập - Chi tiêu)
}

/**
 * Thông tin chi tiêu theo từng danh mục phân loại cụ thể
 */
export interface CategorySpendingDto {
  name: string;             // Tên danh mục (ví dụ: Ăn uống, Mua sắm)
  categoryKey: string;      // Khóa ngôn ngữ dùng để đa ngôn ngữ hóa (i18n) tên danh mục
  amount: number;           // Số tiền đã chi tiêu
  percentage: number;       // Tỷ lệ phần trăm chi tiêu của danh mục này trên tổng chi tiêu
  percentageChange: number; // Phần trăm tăng hoặc giảm so với kỳ trước đó
  isUp: boolean;            // Chi tiêu danh mục này tăng (true) hay giảm (false) so với kỳ trước
  icon: string;             // Tên biểu tượng (Material Icon) đại diện cho danh mục
  color: string;            // Mã màu HEX dùng để vẽ biểu đồ tròn/thanh
}

/**
 * Tình hình sử dụng và hiệu năng của một ngân sách (Budget)
 */
export interface BudgetPerformanceDto {
  name: string;             // Tên ngân sách (ví dụ: Ăn uống tháng 7)
  spent: number;            // Số tiền thực tế đã chi tiêu
  limit: number;            // Hạn mức tối đa được phép chi tiêu
  remaining: number;        // Số tiền còn lại có thể chi
  percentage: number;       // Tỷ lệ phần trăm đã sử dụng (được giới hạn tối đa 100%)
  status: 'safe' | 'warning' | 'danger'; // Trạng thái ngân sách (an toàn, cảnh báo sắp hết, vượt hạn mức)
}

/**
 * Gợi ý, nhận xét tài chính thông minh (AI Insights)
 */
export interface FinancialInsightDto {
  id: string;               // ID duy nhất của gợi ý
  type: 'info' | 'warning' | 'success' | 'danger'; // Loại cảnh báo/thông báo
  title: string;            // Tiêu đề của gợi ý
  description: string;      // Nội dung mô tả chi tiết gợi ý hoặc lời khuyên tài chính
  priority: 'high' | 'medium' | 'low'; // Mức độ ưu tiên hiển thị
  actionKey: string;        // Khóa dịch i18n cho nhãn nút hành động đi kèm
  actionType: 'view_tx' | 'adjust_budget' | 'create_goal' | 'view_detail'; // Loại hành động khi click vào nút
  meta?: any;               // Dữ liệu bổ sung đi kèm hành động (ví dụ: tên category cần xem)
}

/**
 * Điểm dữ liệu so sánh chi tiêu giữa kỳ này và kỳ trước theo danh mục
 */
export interface SpendingComparisonPoint {
  label: string;            // Tên danh mục chi tiêu cần so sánh
  currentAmount: number;    // Số tiền chi tiêu trong kỳ hiện tại
  previousAmount: number;   // Số tiền chi tiêu trong kỳ trước đó
}

/**
 * Báo cáo so sánh chi tiêu tổng quan
 */
export interface SpendingComparisonDto {
  conclusion: string;       // Kết luận phân tích tổng hợp bằng văn bản
  points: SpendingComparisonPoint[]; // Danh sách các danh mục để vẽ biểu đồ so sánh song song
}

/**
 * Cấu trúc toàn bộ báo cáo phân tích tài chính (Analytics Report)
 */
export interface AnalyticsReport {
  kpis: {
    income: KPIStats;       // KPI chỉ số Thu nhập
    expense: KPIStats;      // KPI chỉ số Chi tiêu
    savings: KPIStats;      // KPI chỉ số Tiết kiệm
    rate: KPIStats;         // KPI chỉ số Tỷ lệ tiết kiệm
  };
  cashFlow: CashFlowDataPoint[]; // Dữ liệu dòng tiền để vẽ biểu đồ cột chồng/song song
  categorySpending: CategorySpendingDto[]; // Phân rã chi tiêu theo danh mục (cho biểu đồ hình quạt/danh sách)
  budgets: BudgetPerformanceDto[]; // Tình hình thực hiện ngân sách
  insights: FinancialInsightDto[]; // Các gợi ý tài chính thông minh từ trợ lý ảo AI
  comparison: SpendingComparisonDto; // Dữ liệu biểu đồ cột so sánh chi tiêu các kỳ
  recurring: {              // Danh sách các khoản chi cố định định kỳ (đăng ký hàng tháng)
    items: RecurringExpenseDto[];
    totalMonthly: number;
  };
  merchants: MerchantDto[]; // Thống kê chi tiêu theo các đại lý/cửa hàng
  notableTransactions: TransactionDto[]; // Danh sách các giao dịch đáng chú ý (gần nhất hoặc giá trị cao)
  accounts: string[];       // Danh sách các tài khoản/phương thức thanh toán có giao dịch
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  // Inject các service quản lý giao dịch và ngân sách để lấy dữ liệu tính toán báo cáo
  private readonly transactionService = inject(TransactionService);
  private readonly budgetService = inject(BudgetService);

  /**
   * Tạo báo cáo phân tích chi tiêu đầy đủ dựa theo khoảng thời gian và tài khoản/phương thức thanh toán được chọn.
   * Kết hợp dữ liệu từ TransactionService và BudgetService để đưa ra các số liệu trực quan hóa cho Dashboard.
   * 
   * @param period Chu kỳ báo cáo (ví dụ: 'thisMonth', '7days', 'custom', v.v.)
   * @param account Tên tài khoản/phương thức thanh toán lọc theo (hoặc 'all' để lấy tất cả)
   * @param customStart Ngày bắt đầu tự chọn (chỉ dùng khi period = 'custom')
   * @param customEnd Ngày kết thúc tự chọn (chỉ dùng khi period = 'custom')
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
        const txs = realTxs || [];
        const budgets = realBudgets || [];

        // 1. Thu thập danh sách duy nhất các tài khoản/phương thức thanh toán (ví dụ: Cash, VPBank, Momo)
        const accountsSet = new Set<string>();
        txs.forEach(t => {
          if (t.paymentMethod) {
            accountsSet.add(t.paymentMethod);
          }
        });
        const accounts = Array.from(accountsSet);

        // 2. Xác định mốc thời gian bắt đầu và kết thúc cho chu kỳ hiện tại và chu kỳ so sánh trước đó
        const { start, end, prevStart, prevEnd } = this.getDateRanges(period, customStart, customEnd);

        // 3. Lọc danh sách giao dịch thuộc chu kỳ hiện tại và chu kỳ trước đó theo tài khoản
        const currentTxs = this.filterTxs(txs, start, end, account);
        const previousTxs = this.filterTxs(txs, prevStart, prevEnd, account);

        // 4. Tính toán các chỉ số KPI tài chính (Thu nhập, Chi tiêu, Tiết kiệm, Tỷ lệ tiết kiệm)
        const kpis = this.calculateKPIs(currentTxs, previousTxs, txs, start, end, account);

        // 5. Tổng hợp điểm dữ liệu Dòng tiền (Cash Flow) theo từng mốc thời gian trong chu kỳ
        const cashFlow = this.calculateCashFlow(currentTxs, start, end, period);

        // 6. Phân tích cơ cấu chi tiêu theo từng danh mục
        const categorySpending = this.calculateCategorySpending(currentTxs, previousTxs);

        // 7. Theo dõi tình hình thực hiện các ngân sách được thiết lập
        const budgetPerformance = this.calculateBudgetPerformance(budgets, currentTxs);

        // 8. Sinh ra các nhận xét tài chính thông minh (AI Insights) dựa trên biến động dữ liệu chi tiêu
        const insights = this.generateInsights(currentTxs, previousTxs, budgetPerformance);

        // 9. Tính toán dữ liệu so sánh chi tiêu danh mục giữa 2 chu kỳ thời gian liên tiếp
        const comparison = this.calculateComparison(txs, period, start, end, prevStart, prevEnd, account);

        // 10. Danh sách các khoản chi tiêu đăng ký định kỳ hàng tháng
        const recurringItems: RecurringExpenseDto[] = [];
        const recurringTotal = 0;

        // 11. Sắp xếp danh sách các giao dịch trong kỳ theo trình tự thời gian mới nhất lên đầu
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
          merchants: [],
          notableTransactions,
          accounts
        };
      })
    );
  }

  /**
   * Bộ lọc giao dịch: kiểm tra xem giao dịch có nằm trong mốc thời gian và tài khoản/phương thức thanh toán được chọn hay không
   */
  private filterTxs(txs: TransactionDto[], start: Date, end: Date, account: string): TransactionDto[] {
    return txs.filter(t => {
      const tDate = new Date(t.transactionDate);
      const inDateRange = tDate >= start && tDate <= end;
      if (!inDateRange) return false;
      // Lọc theo phương thức thanh toán cụ thể, nếu là 'all' thì bỏ qua điều kiện này
      if (account !== 'all' && t.paymentMethod !== account) return false;
      return true;
    });
  }

  /**
   * Tính toán các chỉ số KPI tài chính cốt lõi (Thu nhập, Chi tiêu, Tiết kiệm, Tỷ lệ tiết kiệm)
   * và phần trăm thay đổi của chúng so với kỳ trước đó. Đồng thời sinh dữ liệu biểu đồ mini (sparkline).
   */
  private calculateKPIs(
    current: TransactionDto[],
    previous: TransactionDto[],
    allTxs: TransactionDto[],
    start: Date,
    end: Date,
    account: string
  ): AnalyticsReport['kpis'] {
    // 1. Tính toán tổng của kỳ hiện tại (current period)
    const curInc = current.filter(t => !t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0); // Tổng thu nhập
    const curExp = current.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);  // Tổng chi tiêu
    const curSav = curInc - curExp;                                                              // Lượng tiết kiệm = Thu nhập - Chi tiêu
    const curRate = curInc > 0 ? (curSav / curInc) * 100 : 0;                                    // Tỷ lệ tiết kiệm (%) = (Tiết kiệm / Thu nhập) * 100

    // 2. Tính toán tổng của kỳ trước đó (previous period) để làm mốc đối chiếu
    const prevInc = previous.filter(t => !t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
    const prevExp = previous.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
    const prevSav = prevInc - prevExp;
    const prevRate = prevInc > 0 ? (prevSav / prevInc) * 100 : 0;

    // 3. Tính tỷ lệ phần trăm thay đổi tăng/giảm giữa hai kỳ
    const pctInc = prevInc > 0 ? ((curInc - prevInc) / prevInc) * 100 : 0;
    const pctExp = prevExp > 0 ? ((curExp - prevExp) / prevExp) * 100 : 0;
    const pctSav = prevSav > 0 ? ((curSav - prevSav) / prevSav) * 100 : 0;
    const pctRate = curRate - prevRate; // Sự thay đổi tuyệt đối về mặt tỷ lệ phần trăm (%)

    // 4. Sinh mảng biểu đồ thu nhỏ (sparkline) bằng cách chia nhỏ thời gian làm 7 phân đoạn
    const segments = 7;
    const incSpark = this.generateSparkline(current.filter(t => !t.isExpense), start, end, segments);
    const expSpark = this.generateSparkline(current.filter(t => t.isExpense), start, end, segments);
    
    // Sparkline cho lượng tiết kiệm ròng = sparkline thu nhập - sparkline chi tiêu
    const savSpark = incSpark.map((inc, i) => inc - expSpark[i]);
    // Sparkline cho tỷ lệ tiết kiệm (%)
    const rateSpark = incSpark.map((inc, i) => inc > 0 ? Math.round(((inc - expSpark[i]) / inc) * 100) : 0);

    return {
      income: {
        value: curInc,
        percentageChange: Math.round(pctInc * 10) / 10,
        isBetter: curInc >= prevInc, // Thu nhập tăng lên là tích cực
        sparklineData: incSpark
      },
      expense: {
        value: curExp,
        percentageChange: Math.round(pctExp * 10) / 10,
        isBetter: curExp <= prevExp, // Chi tiêu giảm đi mới là tích cực!
        sparklineData: expSpark
      },
      savings: {
        value: curSav,
        percentageChange: Math.round(pctSav * 10) / 10,
        isBetter: curSav >= prevSav, // Tiết kiệm được nhiều hơn là tích cực
        sparklineData: savSpark
      },
      rate: {
        value: Math.round(curRate * 10) / 10,
        percentageChange: Math.round(pctRate * 10) / 10,
        isBetter: curRate >= prevRate, // Tỷ lệ tiết kiệm tăng lên là tích cực
        sparklineData: rateSpark
      }
    };
  }

  /**
   * Tạo mảng số biểu thị lượng tích lũy/chi tiêu trên từng phân đoạn thời gian (sparkline).
   * Ví dụ: Chia chu kỳ làm 7 phần, tính tổng tiền giao dịch phát sinh trong mỗi phần.
   */
  private generateSparkline(txs: TransactionDto[], start: Date, end: Date, segments: number): number[] {
    const data = new Array(segments).fill(0);
    if (txs.length === 0) return data;

    const startMs = start.getTime();
    const rangeMs = end.getTime() - startMs;
    const stepMs = rangeMs / segments; // Độ dài mili-giây của mỗi phân đoạn

    txs.forEach(t => {
      const tMs = new Date(t.transactionDate).getTime();
      const offset = tMs - startMs;
      if (offset >= 0 && offset <= rangeMs) {
        // Tìm chỉ số phân đoạn mà giao dịch này thuộc về
        const segIndex = Math.min(Math.floor(offset / stepMs), segments - 1);
        data[segIndex] += t.totalAmount;
      }
    });

    return data;
  }

  /**
   * Tính toán dữ liệu dòng tiền (Cash Flow) theo từng mốc thời gian.
   * Cách phân đoạn thời gian (ngày, tuần, tháng) sẽ tự động thay đổi dựa trên tổng số ngày lọc:
   * - Khoảng lọc <= 7 ngày: Chia theo từng Ngày (Thứ 2, Thứ 3...)
   * - Khoảng lọc <= 31 ngày: Chia theo 4 Tuần (Tuần 1, Tuần 2...)
   * - Khoảng lọc <= 100 ngày: Chia theo các phân đoạn 10 Tuần gần nhất
   * - Khoảng lọc > 100 ngày: Gom nhóm theo từng Tháng lịch (ví dụ: T1 2026, T2 2026...)
   */
  private calculateCashFlow(
    txs: TransactionDto[], 
    start: Date, 
    end: Date, 
    period: string
  ): CashFlowDataPoint[] {
    const points: CashFlowDataPoint[] = [];
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      // Nhóm theo ngày (7 ngày gần nhất)
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
      // Nhóm theo tuần (trong vòng 30 ngày)
      for (let i = 4; i >= 1; i--) {
        const label = `Tuần ${5 - i}`;
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
      // Nhóm theo tuần hoặc tháng đối với chu kỳ dài hơn
      if (diffDays <= 100) {
        // Nhóm theo chu kỳ 10 tuần gần nhất
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
        // Nhóm theo tháng dương lịch thực tế (cho khoảng thời gian rất dài)
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

  /**
   * Phân tích cơ cấu chi tiêu chi tiết theo từng danh mục.
   * Ánh xạ danh mục sang các biểu tượng (Material Icons), màu sắc hiển thị phù hợp,
   * đồng thời tính toán phần trăm tỷ lệ chi tiêu và so sánh độ lệch tăng/giảm với kỳ trước đó.
   */
  private calculateCategorySpending(current: TransactionDto[], previous: TransactionDto[]): CategorySpendingDto[] {
    const curExpTxs = current.filter(t => t.isExpense);
    const prevExpTxs = previous.filter(t => t.isExpense);

    const totalExp = curExpTxs.reduce((sum, t) => sum + t.totalAmount, 0);
    const categoryTotalsMap = new Map<string, number>();
    
    // Bảng ánh xạ biểu tượng đại diện cho từng loại danh mục
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

    // Bảng ánh xạ màu sắc giao diện tương ứng cho biểu đồ
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

    // Bảng dịch mã đa ngôn ngữ tương ứng
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

    // Tính tổng số tiền chi tiêu của từng danh mục trong kỳ hiện tại
    curExpTxs.forEach(t => {
      // Lấy tên danh mục từ chi tiết giao dịch hoặc mặc định là 'Khác'
      const cat = t.transactionDetails?.[0]?.categoryName || 'Kh\u00e1c';
      categoryTotalsMap.set(cat, (categoryTotalsMap.get(cat) || 0) + t.totalAmount);
    });

    // Tính tổng số tiền chi tiêu của từng danh mục trong kỳ trước
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

    // Sắp xếp các danh mục theo số tiền chi tiêu giảm dần (chi nhiều nhất lên đầu)
    return breakdown.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Tính toán hiệu suất ngân sách (đã tiêu bao nhiêu, còn lại bao nhiêu, phần trăm sử dụng).
   * Tự động gán nhãn trạng thái dựa trên mức độ sử dụng ngân sách:
   * - Dưới 85%: An toàn ('safe')
   * - Từ 85% đến dưới 100%: Cảnh báo ('warning')
   * - Đạt hoặc vượt quá 100%: Nguy hiểm/Đã chi vượt hạn mức ('danger')
   */
  private calculateBudgetPerformance(budgets: BudgetDto[], txs: TransactionDto[]): BudgetPerformanceDto[] {
    const expenseTxs = txs.filter(t => t.isExpense);
    
    return budgets.map(b => {
      // Tính toán lượng tiền đã chi tiêu của ngân sách này
      let spent = 0;
      if (b.currentAmount !== undefined) {
        // Nếu ngân sách đã được tính toán số tiền còn lại sẵn từ Backend (currentAmount là số tiền còn lại)
        // Số tiền đã tiêu = Hạn mức ngân sách - Số tiền còn lại
        spent = b.amount - b.currentAmount;
      } else {
        // Fallback: Tính toán động số tiền đã chi tiêu dựa theo danh mục ngân sách và khoảng ngày hiệu lực
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        bStart.setHours(0, 0, 0, 0);
        bEnd.setHours(23, 59, 59, 999);

        spent = expenseTxs.reduce((sum, t) => {
          const td = new Date(t.transactionDate);
          if (td >= bStart && td <= bEnd) {
            if (!b.categoryId) {
              // Ngân sách chung (tất cả các danh mục)
              return sum + t.totalAmount;
            } else {
              // Ngân sách cho danh mục cụ thể
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

  /**
   * Phân tích và sinh ra các nhận xét gợi ý tài chính thông minh (AI Insights) từ dữ liệu thực tế:
   * 1. Cảnh báo nếu chi tiêu ăn uống tăng quá 10% so với kỳ trước.
   * 2. Báo động khẩn cấp nếu chi tiêu vượt ngân sách đã thiết lập.
   * 3. Gợi ý cơ hội tiết kiệm tiền tiêu bằng cách cắt giảm chi tiêu ăn ngoài.
   * 4. Nhắc nhở danh sách hóa đơn định kỳ sắp phải thanh toán.
   */
  private generateInsights(
    current: TransactionDto[],
    previous: TransactionDto[],
    budgets: BudgetPerformanceDto[]
  ): FinancialInsightDto[] {
    const insights: FinancialInsightDto[] = [];
    const curExp = current.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);
    const prevExp = previous.filter(t => t.isExpense).reduce((sum, t) => sum + t.totalAmount, 0);

    // 1. Phân tích xu hướng ăn uống (Food & Dining)
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

    // 2. Cảnh báo vượt ngân sách đã đặt
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

    // 3. Tư vấn tiết kiệm tiềm năng
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

    // 4. Thông báo chuẩn bị tiền thanh toán hóa đơn định kỳ (recurring bill)
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

  /**
   * Tính toán dữ liệu so sánh chi tiêu theo danh mục giữa kỳ hiện tại và kỳ trước.
   * Đồng thời tự động sinh văn bản kết luận phân tích tổng quát (conclusion).
   */
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
    
    // Tự sinh văn bản tổng hợp phân tích tài chính
    let conclusion = `Chi ti\u00eau k\u1ef3 n\u00e0y ${direction} ${Math.abs(Math.round(change * 10) / 10)}% so v\u1edbi k\u1ef3 tr\u01b0\u1edbc.`;
    if (curExp > prevExp) {
      conclusion += ' ch\u1ee7 y\u1ebfu \u0111\u1ebfn t\u1eeb \u0102n u\u1ed1ng v\u00e0 Mua s\u1eafm.';
    } else {
      conclusion += ' do b\u1ea1n \u0111\u00e3 ki\u1ec3m so\u00e1t t\u1ed1t h\u01a1n c\u00e1c kho\u1ea3n mua s\u1eafm ng\u1eabul \u1ee9ng.';
    }

    // Nhóm chi phí theo danh mục để chuẩn bị dữ liệu vẽ biểu đồ đối chiếu
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

    // Chỉ lấy Top 5 danh mục chi tiêu lớn nhất để tránh biểu đồ bị quá tải thông tin
    return {
      conclusion,
      points: points.sort((a, b) => (b.currentAmount + b.previousAmount) - (a.currentAmount + a.previousAmount)).slice(0, 5)
    };
  }

  /**
   * Sắp xếp và trả về danh sách giao dịch đáng chú ý,
   * được sắp xếp theo thời gian giao dịch mới nhất lên hàng đầu.
   */
  private getNotableTransactions(txs: TransactionDto[]): TransactionDto[] {
    return [...txs].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }

  /**
   * Xác định mốc thời gian bắt đầu và kết thúc (Date) cho cả chu kỳ hiện tại (start, end)
   * và chu kỳ so sánh ngay trước đó (prevStart, prevEnd) tương ứng với period được lựa chọn.
   * Ví dụ: Nếu kỳ hiện tại là 'thisMonth' (Từ 01 đầu tháng này đến nay),
   * thì kỳ trước đó sẽ là cả tháng trước (Từ 01 đến ngày cuối cùng của tháng trước).
   */
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
      case '7days': // 7 ngày qua
        start.setDate(today.getDate() - 7);
        prevStart.setDate(today.getDate() - 14);
        prevEnd.setDate(today.getDate() - 7 - 1);
        break;
      case '30days': // 30 ngày qua
        start.setDate(today.getDate() - 30);
        prevStart.setDate(today.getDate() - 60);
        prevEnd.setDate(today.getDate() - 30 - 1);
        break;
      case 'lastMonth': // Tháng trước
        // Ngày đầu tiên đến ngày cuối cùng của tháng trước
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end.setTime(new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999).getTime());
        
        prevStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        prevEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0, 23, 59, 59, 999);
        break;
      case '3months': // 3 tháng qua
        start.setMonth(today.getMonth() - 3);
        prevStart.setMonth(today.getMonth() - 6);
        prevEnd.setMonth(today.getMonth() - 3);
        prevEnd.setDate(prevEnd.getDate() - 1);
        break;
      case '6months': // 6 tháng qua
        start.setMonth(today.getMonth() - 6);
        prevStart.setMonth(today.getMonth() - 12);
        prevEnd.setMonth(today.getMonth() - 6);
        prevEnd.setDate(prevEnd.getDate() - 1);
        break;
      case 'thisYear': // Năm nay
        start = new Date(today.getFullYear(), 0, 1);
        prevStart = new Date(today.getFullYear() - 1, 0, 1);
        prevEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      case 'custom': // Khoảng thời gian tự chọn
        if (customStart && customEnd) {
          start = new Date(customStart);
          end.setTime(customEnd.getTime());
          
          const durationMs = end.getTime() - start.getTime();
          prevEnd = new Date(start.getTime() - 1);
          prevStart = new Date(prevEnd.getTime() - durationMs);
        } else {
          // Fallback mặc định về 30 ngày nếu không có mốc tùy chọn hợp lệ
          start.setDate(today.getDate() - 30);
          prevStart.setDate(today.getDate() - 60);
          prevEnd.setDate(today.getDate() - 30 - 1);
        }
        break;
      case 'thisMonth': // Tháng này (mặc định)
      default:
        // Từ ngày 1 của tháng này đến thời điểm hiện tại
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        prevEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        break;
    }

    // Thiết lập giờ bắt đầu ngày là 00:00:00.000 và kết thúc ngày là 23:59:59.999 để đảm bảo lọc đủ giao dịch trong ngày
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setHours(23, 59, 59, 999);

    return { start, end, prevStart, prevEnd };
  }
}
