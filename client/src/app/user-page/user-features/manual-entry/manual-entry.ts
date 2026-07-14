import { Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of } from 'rxjs';
import { CategoryService } from '../../../core/services/category.service';
import { LanguageService } from '../../../core/services/language-service';
import { ToastService } from '../../../core/services/toast-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryDto } from '../../../models/category.dto';
import { TransactionEntryForm, TransactionEntryFormControls } from '../shared/transaction-entry-form/transaction-entry-form';
import {
  FALLBACK_CATEGORIES,
  PAYMENT_METHOD_OPTIONS,
  getTodayInputValue,
  resolveCategories,
} from '../shared/transaction-entry/transaction-entry.utils';

@Component({
  selector: 'app-manual-entry',
  standalone: true,
  imports: [ReactiveFormsModule, TransactionEntryForm],
  templateUrl: './manual-entry.html',
  styleUrl: './manual-entry.css',
})
export class ManualEntry implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly toast = inject(ToastService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  readonly language = inject(LanguageService);

  readonly form = new FormGroup<TransactionEntryFormControls>({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    category: new FormControl('', { nonNullable: true }),
    date: new FormControl(getTodayInputValue(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paymentMethod: new FormControl(PAYMENT_METHOD_OPTIONS[0], { nonNullable: true }),
    note: new FormControl('', { nonNullable: true }),
    isExpense: new FormControl(true, { nonNullable: true }),
  });

  categories: CategoryDto[] = FALLBACK_CATEGORIES;
  isSaving = false;

  ngOnInit(): void {
    this.categoryService
      .getCategories()
      .pipe(
        map((categories) => resolveCategories(categories)),
        catchError(() => of(FALLBACK_CATEGORIES)),
      )
      .subscribe((categories) => {
        this.categories = categories;
      });
  }

  protected saveTransaction(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, amount, category, date, paymentMethod, note, isExpense } = this.form.getRawValue();

    if (amount === null) {
      return;
    }

    this.isSaving = true;

    this.transactionService
      .createTransactionEntry({
        title,
        amount,
        category: category || null,
        transactionDate: date,
        paymentMethod,
        note: note || null,
        isExpense,
        source: 'manual',
      })
      .subscribe({
        next: () => {
          this.toast.success(this.language.t('manualEntry.toast.saved'));
          void this.router.navigateByUrl('/user/dashboard');
        },
        error: () => {
          this.isSaving = false;
          this.toast.error(this.language.t('manualEntry.toast.saveFailed'));
        },
      });
  }

  protected cancel(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/user/dashboard');
  }
}
