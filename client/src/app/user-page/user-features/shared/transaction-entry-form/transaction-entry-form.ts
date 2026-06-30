import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '../../../../core/services/language-service';
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
  protected readonly language = inject(LanguageService);

  @Input({ required: true }) form!: TransactionEntryFormGroup;
  @Input() categories: CategoryDto[] = [];
  @Input() isSaving = false;
  @Input() showPaymentMethod = false;
  @Input() saveLabel = this.language.t('common.save');
  @Input() cancelLabel = this.language.t('common.cancel');
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  protected readonly paymentMethods = PAYMENT_METHOD_OPTIONS;

  protected getCategoryLabel(name: string): string {
    const normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const key = `dashboard.category.${normalizedName}`;
    const translated = this.language.t(key);

    return translated === key ? name : translated;
  }

  protected getPaymentMethodLabel(method: string): string {
    const normalizedMethod = method.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const key = `entryForm.paymentMethod.${normalizedMethod}`;
    const translated = this.language.t(key);

    return translated === key ? method : translated;
  }

  protected getErrorMessage(controlName: keyof TransactionEntryFormControls): string | null {
    const control = this.form.controls[controlName];

    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      switch (controlName) {
        case 'title':
          return this.language.t('entryForm.error.titleRequired');
        case 'amount':
          return this.language.t('entryForm.error.amountRequired');
        case 'date':
          return this.language.t('entryForm.error.dateRequired');
        default:
          return this.language.t('entryForm.error.required');
      }
    }

    if (controlName === 'amount' && control.errors['min']) {
      return this.language.t('entryForm.error.amountMin');
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
