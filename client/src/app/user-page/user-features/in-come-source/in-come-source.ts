import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncomeSourceService } from '../../../core/services/income-source.service';
import { BudgetService, BudgetDto } from '../../../core/services/budget.service';
import { IncomeSourceDto } from '../../../models/income-source.dto';

@Component({
  selector: 'app-in-come-source',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './in-come-source.html',
  styleUrl: './in-come-source.css',
})
export class InComeSource implements OnInit {
  private readonly incomeService = inject(IncomeSourceService);
  private readonly budgetService = inject(BudgetService);

  incomeSources: IncomeSourceDto[] = [];
  budgets: BudgetDto[] = [];
  
  isModalOpen = false;
  editingId: number | null = null;
  
  formData: Partial<IncomeSourceDto> = {
    name: '',
    amount: 0,
    isRecurring: false,
    budgetId: 0,
    isActive: true
  };

  ngOnInit(): void {
    this.loadIncomeSources();
    this.loadBudgets();
  }

  loadIncomeSources(): void {
    this.incomeService.getUserIncomeSources().subscribe({
      next: (data) => {
        this.incomeSources = data;
      },
      error: (err: any) => console.error('Error loading income sources', err)
    });
  }

  loadBudgets(): void {
    this.budgetService.getBudgets().subscribe({
      next: (data) => {
        this.budgets = data;
      },
      error: (err: any) => console.error('Error loading budgets', err)
    });
  }

  openAddModal(): void {
    this.editingId = null;
    this.formData = {
      name: '',
      amount: 0,
      isRecurring: false,
      budgetId: this.budgets.length > 0 ? this.budgets[0].id : 0,
      isActive: true
    };
    this.isModalOpen = true;
  }

  openEditModal(source: IncomeSourceDto): void {
    this.editingId = source.id;
    this.formData = { ...source };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveIncomeSource(): void {
    if (this.editingId) {
      this.incomeService.updateIncomeSource(this.editingId, this.formData).subscribe({
        next: () => {
          this.loadIncomeSources();
          this.closeModal();
        },
        error: (err: any) => console.error('Error updating income source', err)
      });
    } else {
      this.incomeService.createIncomeSource(this.formData).subscribe({
        next: () => {
          this.loadIncomeSources();
          this.closeModal();
        },
        error: (err: any) => console.error('Error creating income source', err)
      });
    }
  }

  deleteIncomeSource(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa nguồn tiền này?')) {
      this.incomeService.deleteIncomeSource(id).subscribe({
        next: () => {
          this.loadIncomeSources();
        },
        error: (err: any) => console.error('Error deleting income source', err)
      });
    }
  }
  
  getBudgetName(budgetId: number): string {
    const budget = this.budgets.find(b => b.id === budgetId);
    return budget ? budget.name : 'Chưa liên kết ví';
  }
}
