import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '../../../../core/services/language-service';
import { CategoryDto } from '../../../../models/category.dto';
import { BudgetDto } from '../../../../core/services/budget.service';

export interface TransactionEntryFormControls {
  title: FormControl<string>;
  amount: FormControl<number | null>;
  quantity: FormControl<number | null>;
  category: FormControl<string>;
  date: FormControl<string>;
  budgetId: FormControl<number | null>;
  note: FormControl<string>;
  isExpense: FormControl<boolean>;
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
  @Input() budgets: BudgetDto[] = [];
  @Input() isSaving = false;
  @Input() showImageUpload = false;
  @Input() saveLabel = this.language.t('common.save');
  @Input() cancelLabel = this.language.t('common.cancel');
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() imageSelected = new EventEmitter<File | null>();

  previewUrl: string | null = null;

  protected getCategoryLabel(name: string): string {
    const normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const key = `dashboard.category.${normalizedName}`;
    const translated = this.language.t(key);

    return translated === key ? name : translated;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) {
      this.previewUrl = URL.createObjectURL(file);
    } else {
      this.previewUrl = null;
    }
    this.imageSelected.emit(file);
  }

  removeImage(): void {
    this.previewUrl = null;
    this.imageSelected.emit(null);
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
        case 'quantity':
          return this.language.currentLang() === 'vi' ? 'Số lượng là bắt buộc' : 'Quantity is required';
        case 'date':
          return this.language.t('entryForm.error.dateRequired');
        default:
          return this.language.t('entryForm.error.required');
      }
    }

    if (controlName === 'amount' && control.errors['min']) {
      return this.language.t('entryForm.error.amountMin');
    }

    if (controlName === 'quantity' && control.errors['min']) {
      return this.language.currentLang() === 'vi' ? 'Số lượng phải lớn hơn 0' : 'Quantity must be > 0';
    }

    return null;
  }

  protected get formattedDateDisplay(): string {
    const dateVal = this.form.controls.date?.value;
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const seconds = d.getSeconds().toString().padStart(2, '0');
      
      if (dateVal.includes('T')) {
        return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
      }
      return `${day}/${month}/${year}`;
    } catch {
      return dateVal;
    }
  }

  get formattedAmount(): string {
    const val = this.form.controls.amount?.value;
    if (val == null || val === ('' as any)) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  onAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value.replace(/\D/g, '');
    const numValue = rawValue ? parseInt(rawValue, 10) : null;
    this.form.controls.amount.setValue(numValue);
    this.form.controls.amount.markAsDirty();
    // Update the input view to show the formatted value immediately
    input.value = this.formattedAmount;
  }

  protected setExpenseType(isExpense: boolean): void {
    this.form.controls.isExpense.setValue(isExpense);
    this.form.controls.isExpense.markAsDirty();
  }

  protected openDatePicker(input: HTMLInputElement): void {
    if ('showPicker' in input && typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        // Fallback silently if browser restricts showPicker invocation context
      }
    }
  }

  protected onSave(): void {
    this.save.emit();
  }

  protected onCancel(): void {
    this.cancel.emit();
  }
}

