import { Component, EventEmitter, HostListener, OnInit, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { LanguageService } from '../../../../core/services/language-service';
import { CategoryService } from '../../../../core/services/category.service';
import { BudgetService, CreateBudgetRequest, BudgetDto } from '../../../../core/services/budget.service';
import { ToastService } from '../../../../core/services/toast-service';
import { CategoryDto } from '../../../../models/category.dto';
import { getTodayInputValue } from '../../shared/transaction-entry/transaction-entry.utils';

export const dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;
  const period = control.get('period')?.value;

  if (period === 'CUSTOM' && startDate && endDate) {
    return new Date(endDate) >= new Date(startDate) ? null : { endDateBeforeStartDate: true };
  }
  return null;
};

@Component({
  selector: 'app-create-budget-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-budget-modal.html',
  styleUrl: '../dashboard.css', // Reuse modal CSS from dashboard.css directly
})
export class CreateBudgetModal implements OnInit {
  @Output() closeModal = new EventEmitter<void>();
  @Output() budgetCreated = new EventEmitter<BudgetDto>();

  protected readonly language = inject(LanguageService);
  private readonly categoryService = inject(CategoryService);
  private readonly budgetService = inject(BudgetService);
  private readonly toast = inject(ToastService);

  readonly presets = [1_000_000, 2_000_000, 5_000_000, 10_000_000];
  categories: CategoryDto[] = [];
  isSubmitting = false;

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    period: new FormControl<'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('MONTHLY', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl(getTodayInputValue(), { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl(getTodayInputValue(), { nonNullable: true }),
    categoryId: new FormControl<number | null>(null),
    note: new FormControl('', { nonNullable: true }),
  }, { validators: [dateRangeValidator] });

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: () => {
        this.categories = [];
      }
    });

    // Auto focus name input
    setTimeout(() => {
      const nameInput = document.getElementById('budgetName');
      if (nameInput) nameInput.focus();
    }, 50);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: any): void {
    if (!this.isSubmitting) {
      this.onClose();
    }
  }

  onPeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const periodValue = select.value;
    const endDateControl = this.form.controls.endDate;

    if (periodValue === 'CUSTOM') {
      endDateControl.setValidators([Validators.required]);
    } else {
      endDateControl.clearValidators();
    }
    endDateControl.updateValueAndValidity();
  }

  setAmountPreset(val: number): void {
    this.form.controls.amount.setValue(val);
    this.form.controls.amount.markAsDirty();
  }

  get formattedAmountPreview(): string {
    const val = this.form.controls.amount.value;
    if (val === null || val === undefined || isNaN(val)) return '0đ';
    return `${new Intl.NumberFormat(this.language.locale()).format(val)}đ`;
  }

  getErrorMessage(controlName: 'name' | 'amount' | 'startDate' | 'endDate'): string | null {
    const control = this.form.controls[controlName];
    if (!control || !(control.touched || control.dirty)) {
      return null;
    }

    if (control.errors?.['required']) {
      switch (controlName) {
        case 'name':
          return this.language.t('dashboard.createBudgetModal.nameRequired');
        case 'amount':
          return this.language.t('dashboard.createBudgetModal.amountRequired');
        case 'startDate':
          return this.language.t('dashboard.createBudgetModal.startDateRequired');
        case 'endDate':
          return this.language.t('dashboard.createBudgetModal.endDateRequired');
      }
    }

    if (controlName === 'amount' && control.errors?.['min']) {
      return this.language.t('dashboard.createBudgetModal.amountMinError');
    }

    return null;
  }

  get formRangeError(): string | null {
    if (this.form.errors?.['endDateBeforeStartDate'] && (this.form.controls.endDate.touched || this.form.controls.endDate.dirty)) {
      return this.language.t('dashboard.createBudgetModal.endDateMinError');
    }
    return null;
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, amount, period, startDate, endDate, categoryId, note } = this.form.getRawValue();
    if (amount === null) return;

    this.isSubmitting = true;

    const payload: CreateBudgetRequest = {
      name: name.trim(),
      amount,
      period,
      startDate,
      endDate: period === 'CUSTOM' ? endDate : startDate,
      categoryId: categoryId ? Number(categoryId) : null,
      note: note.trim(),
    };

    this.budgetService.createBudget(payload).subscribe({
      next: (budget) => {
        this.budgetCreated.emit(budget);
        this.isSubmitting = false;
        this.onClose();
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || err?.message;
        const fallback = this.language.t('dashboard.createBudgetModal.errorFallback');
        this.toast.error(msg || fallback);
      }
    });
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
