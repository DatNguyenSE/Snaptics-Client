import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetService } from '../../../../core/services/budget.service';
import { ToastService } from '../../../../core/services/toast-service';
import { SharedBudgetDto } from '../../../../models/shared-budget.dto';

@Component({
  selector: 'app-create-shared-budget-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create-shared-budget-modal.html',
  styleUrl: './create-shared-budget-modal.css',
})
export class CreateSharedBudgetModal implements OnInit {
  private readonly budgetService = inject(BudgetService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  @Output() created = new EventEmitter<SharedBudgetDto>();
  @Output() closed = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  memberEmailInput = '';
  memberEmails: string[] = [];

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    const endOfYear = new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0];

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      amount: [0, [Validators.required, Validators.min(1)]],
      startDate: [today, Validators.required],
      endDate: [endOfYear, Validators.required],
      currency: ['VND'],
    });
  }

  get displayAmount(): string {
    const val = this.form.get('amount')?.value;
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  onAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\./g, '');
    const num = parseInt(raw, 10);
    const final = isNaN(num) ? 0 : num;
    this.form.patchValue({ amount: final });
    input.value = final === 0 && raw === '' ? '' : final.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  addMemberEmail(): void {
    const email = this.memberEmailInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.toast.error('Email không hợp lệ');
      return;
    }
    if (this.memberEmails.includes(email)) {
      this.toast.warning('Email này đã được thêm');
      return;
    }
    this.memberEmails.push(email);
    this.memberEmailInput = '';
  }

  removeMemberEmail(email: string): void {
    this.memberEmails = this.memberEmails.filter((e) => e !== email);
  }

  onMemberEmailKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addMemberEmail();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const val = this.form.getRawValue();

    this.budgetService
      .createSharedBudget({
        name: val.name.trim(),
        description: val.description?.trim() || null,
        amount: val.amount,
        startDate: new Date(val.startDate).toISOString(),
        endDate: new Date(val.endDate).toISOString(),
        currency: val.currency || 'VND',
        initialMemberEmails: this.memberEmails,
        isActive: true,
      })
      .subscribe({
        next: (budget) => {
          this.toast.success(`Tạo ví "${budget.name}" thành công!`);
          this.created.emit(budget);
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Không thể tạo ví dùng chung');
          this.isSubmitting = false;
        },
      });
  }

  onClose(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.isSubmitting) this.onClose();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
