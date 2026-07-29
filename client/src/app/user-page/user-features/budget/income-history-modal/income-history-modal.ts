import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetService, BudgetDto, IncomeHistoryDto } from '../../../../core/services/budget.service';
import { IncomeSourceService } from '../../../../core/services/income-source.service';
import { IncomeSourceDto } from '../../../../models/income-source.dto';

@Component({
  selector: 'app-income-history-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './income-history-modal.html',
  styleUrl: './income-history-modal.css',
})
export class IncomeHistoryModal implements OnInit {
  @Input() budget!: BudgetDto;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  private readonly budgetService = inject(BudgetService);
  private readonly incomeSourceService = inject(IncomeSourceService);

  history: IncomeHistoryDto[] = [];
  incomeSources: IncomeSourceDto[] = [];
  isLoading = true;
  hasError = false;

  ngOnInit(): void {
    this.loadIncomeSources();
    this.loadHistory();
  }

  private loadIncomeSources(): void {
    this.incomeSourceService.getIncomeSources().subscribe({
      next: (data) => {
        this.incomeSources = data || [];
      }
    });
  }

  private loadHistory(): void {
    this.isLoading = true;
    this.hasError = false;
    this.budgetService.getIncomeHistory(this.budget.id).subscribe({
      next: (data) => {
        this.history = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  getSourceName(sourceId?: number | null): string {
    if (!sourceId) return 'Tự nhập thủ công';
    const source = this.incomeSources.find(s => s.id === sourceId);
    return source ? source.name : 'Nguồn thu (Đã xóa)';
  }

  formatCurrency(amount: number): string {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
  }

  closeModal(): void {
    this.close.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
