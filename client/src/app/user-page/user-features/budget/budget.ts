import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserHeader } from '../../user-layout/user-header/user-header';
import { BudgetService, BudgetDto, CreateBudgetRequest } from '../../../core/services/budget.service';
import { LanguageService } from '../../../core/services/language-service';
import { ToastService } from '../../../core/services/toast-service';
import { SharedBudgetDto, BudgetMemberDto } from '../../../models/shared-budget.dto';
import { CreateSharedBudgetModal } from './create-shared-budget-modal/create-shared-budget-modal';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, UserHeader, ReactiveFormsModule, CreateSharedBudgetModal],
  templateUrl: './budget.html',
  styleUrl: './budget.css',
})
export class Budget implements OnInit {
  private readonly budgetService = inject(BudgetService);
  protected readonly language = inject(LanguageService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // ─── Personal budgets ──────────────────────────────────────────────────────
  budgets: BudgetDto[] = [];
  isLoading = true;
  hasError = false;

  // ─── Shared budgets ────────────────────────────────────────────────────────
  sharedBudgets: SharedBudgetDto[] = [];
  isLoadingShared = true;
  hasErrorShared = false;

  // ─── Tab ───────────────────────────────────────────────────────────────────
  activeTab: 'personal' | 'shared' = 'personal';

  // ─── Personal Budget Modal ─────────────────────────────────────────────────
  isModalOpen = false;
  isSubmitting = false;
  modalMode: 'ADD' | 'EDIT' = 'ADD';
  editingBudgetId: number | null = null;
  budgetForm!: FormGroup;

  // ─── Shared Budget Modal ───────────────────────────────────────────────────
  isSharedModalOpen = false;

  ngOnInit(): void {
    this.initForm();
    this.loadBudgets();
    this.loadSharedBudgets();
  }

  setTab(tab: 'personal' | 'shared'): void {
    this.activeTab = tab;
  }

  // ─── Personal Budget ───────────────────────────────────────────────────────

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.budgetForm = this.fb.group({
      name: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      type: [0, Validators.required],
      startDate: [today, Validators.required],
      endDate: [today, Validators.required],
      isDefault: [false],
    });
  }

  get displayAmount(): string {
    const val = this.budgetForm.get('amount')?.value;
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  onAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let rawValue = input.value.replace(/\./g, '');
    let isNegative = rawValue.startsWith('-');
    if (isNegative) rawValue = rawValue.substring(1);
    let numericValue = parseInt(rawValue, 10);
    if (isNaN(numericValue)) numericValue = 0;
    let finalValue = isNegative ? -numericValue : numericValue;
    this.budgetForm.patchValue({ amount: finalValue });
    let display =
      numericValue === 0 && rawValue === ''
        ? ''
        : numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (isNegative)
      display = '-' + (numericValue === 0 && input.value === '-' ? '' : display);
    input.value = display;
  }

  loadBudgets(): void {
    this.isLoading = true;
    this.hasError = false;
    this.budgetService.getBudgets().subscribe({
      next: (data) => {
        // Filter out shared budgets (walletType === 'SHARED') from the personal list
        this.budgets = data
          .filter((b) => !b.isShared && b.walletType !== 'SHARED')
          .sort((a, b) => {
            const aDefault = a.isDefault ? 1 : 0;
            const bDefault = b.isDefault ? 1 : 0;
            if (aDefault !== bDefault) return bDefault - aDefault;
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          });
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  loadSharedBudgets(): void {
    this.isLoadingShared = true;
    this.hasErrorShared = false;
    this.budgetService.getSharedBudgets().subscribe({
      next: (data) => {
        this.sharedBudgets = data;
        this.isLoadingShared = false;
      },
      error: () => {
        this.hasErrorShared = true;
        this.isLoadingShared = false;
      },
    });
  }

  openModal(budget?: BudgetDto): void {
    this.isModalOpen = true;
    this.isSubmitting = false;
    if (budget) {
      this.modalMode = 'EDIT';
      this.editingBudgetId = budget.id;
      let start = '';
      if (budget.startDate) {
        const d = new Date(budget.startDate);
        if (!isNaN(d.getTime())) start = d.toISOString().split('T')[0];
      }
      let end = '';
      if (budget.endDate) {
        const d = new Date(budget.endDate);
        if (!isNaN(d.getTime())) end = d.toISOString().split('T')[0];
      }
      this.budgetForm.patchValue({
        name: budget.name,
        amount: budget.amount,
        type: budget.type !== undefined ? budget.type : 0,
        startDate: start,
        endDate: end,
        isDefault: budget.isDefault || false,
      });
    } else {
      this.modalMode = 'ADD';
      this.editingBudgetId = null;
      this.budgetForm.reset({
        name: '',
        amount: 0,
        type: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        isDefault: false,
      });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.isModalOpen && !this.isSubmitting) {
      this.closeModal();
    }
    if (this.isSharedModalOpen) {
      this.closeSharedModal();
    }
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  onSubmit(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const formVal = this.budgetForm.getRawValue();
    const payload: CreateBudgetRequest = {
      id: this.modalMode === 'EDIT' && this.editingBudgetId ? this.editingBudgetId : 0,
      name: formVal.name,
      amount: formVal.amount,
      type: Number(formVal.type),
      startDate: formVal.startDate
        ? new Date(formVal.startDate).toISOString()
        : new Date().toISOString(),
      endDate: formVal.endDate
        ? new Date(formVal.endDate).toISOString()
        : new Date().toISOString(),
      categoryId: null,
      note: '',
      isDefault: formVal.isDefault || false,
      isActive: true,
    };

    if (this.modalMode === 'ADD') {
      this.budgetService.createBudget(payload).subscribe({
        next: () => {
          this.toast.success('Thêm ngân sách thành công');
          this.closeModal();
          this.loadBudgets();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Có lỗi xảy ra khi thêm');
          this.isSubmitting = false;
        },
      });
    } else if (this.modalMode === 'EDIT' && this.editingBudgetId) {
      this.budgetService.updateBudget(this.editingBudgetId, payload).subscribe({
        next: () => {
          this.toast.success('Cập nhật ngân sách thành công');
          this.closeModal();
          this.loadBudgets();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Có lỗi xảy ra khi cập nhật');
          this.isSubmitting = false;
        },
      });
    }
  }

  deleteBudget(id: number): void {
    if (!confirm('Bạn có chắc chắn muốn xóa ngân sách này không?')) return;
    this.budgetService.deleteBudget(id).subscribe({
      next: () => {
        this.toast.success('Xóa ngân sách thành công');
        this.loadBudgets();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Không thể xóa ngân sách');
      },
    });
  }

  // ─── Shared Budget ─────────────────────────────────────────────────────────

  openSharedModal(): void {
    this.isSharedModalOpen = true;
  }

  closeSharedModal(): void {
    this.isSharedModalOpen = false;
  }

  onSharedBudgetCreated(budget: SharedBudgetDto): void {
    this.closeSharedModal();
    this.sharedBudgets = [budget, ...this.sharedBudgets];
    this.activeTab = 'shared';
    this.router.navigate(['/user/budget', budget.id]);
  }

  navigateToSharedBudget(budget: SharedBudgetDto): void {
    this.router.navigate(['/user/budget', budget.id]);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  formatCurrency(value: number | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '0đ';
    return `${new Intl.NumberFormat(this.language.locale()).format(value)}đ`;
  }

  getBudgetSpentPercent(budget: BudgetDto): number {
    if (budget.currentAmount !== undefined) {
      const spent = budget.amount - budget.currentAmount;
      return Math.min(100, Math.max(0, Math.round((spent / budget.amount) * 100)));
    }
    return 0;
  }

  getSpentAmount(budget: BudgetDto): number {
    if (budget.currentAmount !== undefined) {
      return budget.amount - budget.currentAmount;
    }
    return 0;
  }

  getSharedSpentPercent(budget: SharedBudgetDto): number {
    if (budget.currentAmount !== undefined) {
      const spent = budget.amount - budget.currentAmount;
      return Math.min(100, Math.max(0, Math.round((spent / budget.amount) * 100)));
    }
    return 0;
  }

  getSharedSpentAmount(budget: SharedBudgetDto): number {
    if (budget.currentAmount !== undefined) return budget.amount - budget.currentAmount;
    return 0;
  }

  getDisplayedMembers(budget: SharedBudgetDto): BudgetMemberDto[] {
    return (budget.members ?? []).slice(0, 3);
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
}
