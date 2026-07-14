import { Component, EventEmitter, Input, OnInit, Output, inject, OnChanges } from '@angular/core';
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

  ngOnChanges(): void {
    if (this.isOpen && this.trendData.length === 0) {
      this.loadData();
    }
  }

  setFilter(filter: 'week' | 'month' | 'year'): void {
    this.activeFilter = filter;
    this.loadData();
  }

  get maxExpense(): number {
    return this.trendData.reduce((max, item) => Math.max(max, item.expense), 0) || 1;
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
