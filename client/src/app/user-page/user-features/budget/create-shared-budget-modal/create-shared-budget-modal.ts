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
import { BudgetDto } from '../../../../core/services/budget.service';
import { BudgetMemberService } from '../../../../core/services/budgetMember.service';
import { ToastService } from '../../../../core/services/toast-service';
import { Input } from '@angular/core';

@Component({
  selector: 'app-create-shared-budget-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create-shared-budget-modal.html',
  styleUrl: './create-shared-budget-modal.css',
})
export class CreateSharedBudgetModal implements OnInit {
  private readonly budgetMemberService = inject(BudgetMemberService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  @Input() budgets: BudgetDto[] = [];
  @Output() invited = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      budgetId: [this.budgets.length > 0 ? this.budgets[0].id : null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const val = this.form.getRawValue();

    this.budgetMemberService
      .inviteMember(val.budgetId, { email: val.email })
      .subscribe({
        next: () => {
          this.toast.success(`Đã gửi lời mời đến ${val.email} thành công!`);
          this.invited.emit();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Không thể gửi lời mời');
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
