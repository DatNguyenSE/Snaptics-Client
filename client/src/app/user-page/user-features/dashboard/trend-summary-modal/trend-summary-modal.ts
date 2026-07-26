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
    return [...this.trendData].sort((a, b) => b.expense - a.expense);
  }

  get totalExpense(): number {
    return this.trendData.reduce((total, item) => total + item.expense, 0);
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

  getExpensePercentage(expense: number): number {
    if (!this.totalExpense) return 0;
    return Math.round((expense / this.totalExpense) * 100);
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
