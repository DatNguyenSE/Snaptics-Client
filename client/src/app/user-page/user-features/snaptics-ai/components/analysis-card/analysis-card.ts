import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisData } from '../../../../../core/services/chat-storage.service';

@Component({
  selector: 'app-analysis-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analysis-card" *ngIf="data">
      <!-- KPI Stats Grid -->
      <div class="kpi-grid">
        <div class="kpi-item" *ngIf="data.currentAmount !== undefined">
          <span class="kpi-label">Tổng chi kỳ này</span>
          <span class="kpi-value">{{ formatCurrency(data.currentAmount) }}</span>
        </div>
        <div class="kpi-item" *ngIf="data.previousAmount !== undefined">
          <span class="kpi-label">Kỳ trước</span>
          <span class="kpi-value kpi-value--muted">{{ formatCurrency(data.previousAmount) }}</span>
        </div>
        <div class="kpi-item" *ngIf="data.percentageChange !== undefined">
          <span class="kpi-label">Thay đổi</span>
          <span class="kpi-change" [class.kpi-change--down]="data.percentageChange < 0" [class.kpi-change--up]="data.percentageChange > 0">
            <span class="material-symbols-outlined font-icon">
              {{ data.percentageChange < 0 ? 'trending_down' : 'trending_up' }}
            </span>
            {{ data.percentageChange > 0 ? '+' : '' }}{{ data.percentageChange }}%
          </span>
        </div>
        <div class="kpi-item" *ngIf="data.topCategory">
          <span class="kpi-label">Chi nhiều nhất</span>
          <span class="kpi-value kpi-value--accent">{{ data.topCategory }}</span>
        </div>
      </div>

      <!-- Categories Progress List -->
      <div class="categories-list" *ngIf="data.categories && data.categories.length > 0">
        <h4 class="section-title">Chi tiết danh mục</h4>
        @for (cat of data.categories; track cat.name) {
          <div class="category-row">
            <div class="category-info">
              <span class="category-name">{{ cat.name }}</span>
              <span class="category-amount">{{ formatCurrency(cat.amount) }}</span>
            </div>
            <div class="progress-container">
              <div 
                class="progress-bar" 
                [style.width.%]="getPercentageOfTotal(cat.amount)"
                [style.background]="getCategoryColor(cat.name)"
              ></div>
            </div>
          </div>
        }
      </div>

      <!-- Recommendation Block -->
      <div class="ai-recommendation">
        <div class="rec-header">
          <span class="material-symbols-outlined rec-icon">tips_and_updates</span>
          <span class="rec-title">Gợi ý từ Snaptics AI</span>
        </div>
        <p class="rec-text">{{ getRecommendationText() }}</p>
      </div>

      <!-- Footer Action -->
      <div class="card-footer">
        <button type="button" class="action-btn" (click)="onReportClick()">
          <span>Xem báo cáo chi tiết</span>
          <span class="material-symbols-outlined action-icon">chevron_right</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .analysis-card {
      background: var(--sw-card);
      border: 1px solid var(--sw-border);
      border-radius: 16px;
      padding: 16px;
      margin: 12px 0;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      border-bottom: 1px solid var(--sw-border);
      padding-bottom: 14px;
    }
    .kpi-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .kpi-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--sw-muted-foreground);
    }
    .kpi-value {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--sw-foreground);
    }
    .kpi-value--muted {
      color: var(--sw-muted-foreground);
      font-weight: 700;
    }
    .kpi-value--accent {
      color: var(--sw-primary);
    }
    .kpi-change {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 1.125rem;
      font-weight: 800;
    }
    .kpi-change--down {
      color: var(--sw-accent); /* green (savings) */
    }
    .kpi-change--up {
      color: #ef4444; /* red (spending increase) */
    }
    .font-icon {
      font-size: 1.25rem;
    }
    .section-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--sw-foreground);
      margin: 0 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .category-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .category-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
      font-weight: 600;
    }
    .category-name {
      color: var(--sw-foreground);
    }
    .category-amount {
      color: var(--sw-foreground);
      font-weight: 700;
    }
    .progress-container {
      height: 6px;
      background: var(--sw-muted);
      border-radius: 3px;
      overflow: hidden;
      width: 100%;
    }
    .progress-bar {
      height: 100%;
      border-radius: 3px;
    }
    .ai-recommendation {
      background: var(--sw-primary-soft);
      border: 1px dashed rgba(91, 123, 250, 0.3);
      border-radius: 12px;
      padding: 12px;
    }
    .rec-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .rec-icon {
      font-size: 1.125rem;
      color: var(--sw-primary);
    }
    .rec-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--sw-primary);
    }
    .rec-text {
      font-size: 0.8125rem;
      color: var(--sw-foreground);
      margin: 0;
      line-height: 1.5;
    }
    .card-footer {
      display: flex;
      justify-content: flex-end;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: transparent;
      border: none;
      color: var(--sw-primary);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.2s ease;
    }
    .action-btn:hover {
      background: var(--sw-primary-soft);
    }
    .action-icon {
      font-size: 1.125rem;
    }
  `]
})
export class AnalysisCard {
  @Input() data: AnalysisData | null = null;

  formatCurrency(value: number): string {
    return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
  }

  getPercentageOfTotal(amount: number): number {
    if (!this.data || !this.data.categories) return 0;
    const total = this.data.categories.reduce((sum, c) => sum + c.amount, 0);
    return total > 0 ? (amount / total) * 100 : 0;
  }

  getCategoryColor(name: string): string {
    const normalized = name.toLowerCase().trim();
    if (normalized.includes('ăn uống') || normalized.includes('food') || normalized.includes('dining')) {
      return '#6366f1'; // Indigo
    }
    if (normalized.includes('di chuyển') || normalized.includes('travel') || normalized.includes('grab')) {
      return '#f59e0b'; // Amber
    }
    if (normalized.includes('mua sắm') || normalized.includes('shopping') || normalized.includes('shopee')) {
      return '#ec4899'; // Pink
    }
    if (normalized.includes('hóa đơn') || normalized.includes('bill')) {
      return '#06b6d4'; // Cyan
    }
    if (normalized.includes('nhà ở') || normalized.includes('housing')) {
      return '#10b981'; // Green
    }
    return '#8b5cf6'; // Violet/other
  }

  getRecommendationText(): string {
    if (!this.data) return '';
    const topCat = this.data.topCategory || '';
    if (topCat.includes('Ăn uống')) {
      return 'Bạn có thể đặt giới hạn 600.000đ cho danh mục ăn uống vào tuần sau để duy trì tốc độ tiết kiệm hiện tại.';
    }
    if (topCat.includes('Mua sắm')) {
      return 'Hầu hết các giao dịch mua sắm đến từ Shopee. Việc áp dụng quy tắc trì hoãn 48h trước khi đặt hàng có thể giúp bạn tiết kiệm khoảng 800.000đ.';
    }
    if (this.data.percentageChange !== undefined && this.data.percentageChange < 0) {
      return 'Xu hướng chi tiêu của bạn đang đi xuống rất tích cực. Hãy tiếp tục duy trì thói quen chi tiêu thông minh này để nhanh chóng đạt mục tiêu tài chính.';
    }
    return 'Duy trì hạn mức chi tiêu hàng ngày ở mức 400.000đ sẽ giúp bạn đảm bảo ngân sách dự phòng cuối tháng luôn an toàn.';
  }

  onReportClick() {
    alert('Đang chuyển đến báo cáo chi tiết (Tính năng liên kết sẽ được kết nối ở API thật).');
  }
}
