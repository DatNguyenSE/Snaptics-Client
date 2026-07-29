import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncomeSourceService } from '../../../core/services/income-source.service';
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

  incomeSources: IncomeSourceDto[] = [];
  
  isModalOpen = false;
  editingId: number | null = null;
  
  formData: Partial<IncomeSourceDto> = {
    name: '',
    amount: 0,
    isRecurring: false,
    isActive: true
  };

  ngOnInit(): void {
    this.loadIncomeSources();
  }

  loadIncomeSources(): void {
    this.incomeService.getUserIncomeSources().subscribe({
      next: (data) => {
        this.incomeSources = data;
      },
      error: (err: any) => console.error('Error loading income sources', err)
    });
  }

  openAddModal(): void {
    this.editingId = null;
    this.formData = {
      name: '',
      amount: 0,
      isRecurring: false,
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
    const { budgetId: _budgetId, ...incomeSourceData } = this.formData;

    if (this.editingId) {
      this.incomeService.updateIncomeSource(this.editingId, incomeSourceData).subscribe({
        next: () => {
          this.loadIncomeSources();
          this.closeModal();
        },
        error: (err: any) => console.error('Error updating income source', err)
      });
    } else {
      this.incomeService.createIncomeSource(incomeSourceData).subscribe({
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
}
