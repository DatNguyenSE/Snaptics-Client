import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetService, BudgetDto, DepositBudgetDto } from '../../../../core/services/budget.service';
import { IncomeSourceService } from '../../../../core/services/income-source.service';
import { IncomeSourceDto } from '../../../../models/income-source.dto';
import { ToastService } from '../../../../core/services/toast-service';

@Component({
  selector: 'app-deposit-budget-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './deposit-budget-modal.html',
  styleUrl: './deposit-budget-modal.css',
})
export class DepositBudgetModal implements OnInit {
  @Input() budget!: BudgetDto;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly budgetService = inject(BudgetService);
  private readonly incomeSourceService = inject(IncomeSourceService);
  private readonly toast = inject(ToastService);

  depositForm!: FormGroup;
  isSubmitting = false;
  incomeSources: IncomeSourceDto[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadIncomeSources();
  }

  private initForm(): void {
    this.depositForm = this.fb.group({
      amount: [0, [Validators.required]],
      incomeSourceId: [null],
      note: ['']
    });

    this.depositForm.get('incomeSourceId')?.valueChanges.subscribe(sourceId => {
      if (sourceId) {
        const source = this.incomeSources.find(s => s.id === Number(sourceId));
        if (source) {
          this.depositForm.patchValue({ amount: source.amount });
        }
      }
    });
  }

  private loadIncomeSources(): void {
    this.incomeSourceService.getIncomeSources().subscribe({
      next: (data) => {
        this.incomeSources = data || [];
      }
    });
  }

  get displayAmount(): string {
    const val = this.depositForm.get('amount')?.value;
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  onAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let rawValue = input.value.replace(/\./g, '');
    let numericValue = parseInt(rawValue, 10);
    if (isNaN(numericValue) || numericValue < 0) numericValue = 0;
    this.depositForm.patchValue({ amount: numericValue });
    input.value = numericValue === 0 && rawValue === '' ? '' : numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  closeModal(): void {
    this.close.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  onSubmit(): void {
    if (this.depositForm.invalid || this.isSubmitting) {
      this.depositForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.depositForm.getRawValue();
    const payload: DepositBudgetDto = {
      amount: formVal.amount,
      incomeSourceId: formVal.incomeSourceId ? Number(formVal.incomeSourceId) : null,
      note: formVal.note || undefined
    };

    this.budgetService.depositBudget(this.budget.id, payload).subscribe({
      next: () => {
        this.toast.success('Nạp tiền thành công!');
        this.isSubmitting = false;
        this.success.emit();
        this.closeModal();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Có lỗi xảy ra khi nạp tiền');
        this.isSubmitting = false;
      }
    });
  }
}
