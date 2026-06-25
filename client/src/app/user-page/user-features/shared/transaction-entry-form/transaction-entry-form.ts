import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CategoryDto } from '../../../../models/category.dto';
import { PAYMENT_METHOD_OPTIONS } from '../transaction-entry/transaction-entry.utils';

export interface TransactionEntryFormControls {
  title: FormControl<string>;
  amount: FormControl<number | null>;
  category: FormControl<string>;
  date: FormControl<string>;
  paymentMethod: FormControl<string>;
  note: FormControl<string>;
}

export type TransactionEntryFormGroup = FormGroup<TransactionEntryFormControls>;

@Component({
  selector: 'app-transaction-entry-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-entry-form.html',
  styleUrl: './transaction-entry-form.css',
})
export class TransactionEntryForm {
  @Input({ required: true }) form!: TransactionEntryFormGroup;
  @Input() categories: CategoryDto[] = [];
  @Input() isSaving = false;
  @Input() showPaymentMethod = false;
  @Input() saveLabel = 'Save';
  @Input() cancelLabel = 'Cancel';
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  protected readonly paymentMethods = PAYMENT_METHOD_OPTIONS;

  protected getErrorMessage(controlName: keyof TransactionEntryFormControls): string | null {
    const control = this.form.controls[controlName];

    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      switch (controlName) {
        case 'title':
          return 'Item name is required.';
        case 'amount':
          return 'Amount is required.';
        case 'date':
          return 'Date is required.';
        default:
          return 'This field is required.';
      }
    }

    if (controlName === 'amount' && control.errors['min']) {
      return 'Amount must be greater than 0.';
    }

    return null;
  }

  protected onSave(): void {
    this.save.emit();
  }

  protected onCancel(): void {
    this.cancel.emit();
  }
}
