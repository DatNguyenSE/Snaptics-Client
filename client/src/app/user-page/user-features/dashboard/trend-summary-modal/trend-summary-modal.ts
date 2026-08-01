import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, inject, OnChanges } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { BarChartDto } from '../../../../models/dashboard.dto';

@Component({
  selector: 'app-trend-summary-modal',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './trend-summary-modal.html',
  styleUrl: './trend-summary-modal.css'
})
export class TrendSummaryModal implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  private readonly dashboardService = inject(DashboardService);
  
  trendData: BarChartDto[] = [];
  isLoading = false;
  activeFilter: 'week' | 'month' | 'year' = 'month';

  ngOnInit(): void {
    if (this.isOpen) {
      this.loadData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true && changes['isOpen'].previousValue !== true) {
      this.loadData();
    }
  }

  setFilter(filter: 'week' | 'month' | 'year'): void {
    this.activeFilter = filter;
    this.loadData();
  }

  get orderedTrendData(): BarChartDto[] {
    return [...this.trendData].sort((a, b) => (b.expense || 0) - (a.expense || 0));
  }

  get totalExpense(): number {
    return this.trendData.reduce(
      (total, item) => total + (typeof item.expense === 'number' && Number.isFinite(item.expense) ? item.expense : 0),
      0,
    );
  }

  get highestExpense(): BarChartDto | null {
    return this.orderedTrendData[0] || null;
  }

  get filterLabel(): string {
    return this.activeFilter === 'week' ? 'Tuần này' : this.activeFilter === 'year' ? 'Năm nay' : 'Tháng này';
  }

  get maxExpense(): number {
    return this.trendData.reduce((max, item) => Math.max(max, item.expense), 0) || 1;
  }

  formatLabel(label: string): string {
    if (this.activeFilter === 'week' && label) {
      const parts = label.split('/');
      if (parts.length >= 2) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (!isNaN(day) && !isNaN(month)) {
          const year = new Date().getFullYear();
          const date = new Date(year, month - 1, day);
          const dayOfWeek = date.getDay();
          const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          return `${dayNames[dayOfWeek]} - ${label}`;
        }
      }
    }
    return label;
  }

  getExpensePercentage(expense: number | null | undefined): string {
    if (typeof expense !== 'number' || !Number.isFinite(expense) || !this.totalExpense) return '-';
    return `${Math.round((expense / this.totalExpense) * 100)}%`;
  }

  getExpenseProgress(expense: number | null | undefined): number {
    if (typeof expense !== 'number' || !Number.isFinite(expense) || !this.maxExpense) return 0;
    return Math.max(0, Math.min(100, (expense / this.maxExpense) * 100));
  }

  private loadData(): void {
    this.isLoading = true;
    this.dashboardService.getTrendSummary(this.activeFilter).subscribe({
      next: (data) => {
        this.trendData = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  closeModal(): void {
    this.isOpen = false;
    this.close.emit();
  }
}
