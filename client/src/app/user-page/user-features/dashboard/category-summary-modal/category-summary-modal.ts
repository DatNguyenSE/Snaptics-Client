import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, inject, OnChanges } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { CategorySummaryResponseDto } from '../../../../models/dashboard.dto';

@Component({
  selector: 'app-category-summary-modal',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './category-summary-modal.html',
  styleUrl: './category-summary-modal.css'
})
export class CategorySummaryModal implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  private readonly dashboardService = inject(DashboardService);
  
  summaryData: CategorySummaryResponseDto | null = null;
  isLoading = false;
  activeFilter: 'week' | 'month' | 'year' = 'month';

  readonly categoryColors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

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

  private loadData(): void {
    this.isLoading = true;
    this.dashboardService.getCategorySummary(this.activeFilter).subscribe({
      next: (data) => {
        this.summaryData = data;
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

  getColor(index: number): string {
    return this.categoryColors[index % this.categoryColors.length];
  }

  formatPercentage(value: number | null | undefined): string {
    return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value)}%` : '-';
  }

  getPercentageWidth(value: number | null | undefined): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  }
}
