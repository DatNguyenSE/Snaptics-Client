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
import { BudgetDto, BudgetService } from '../../../core/services/budget.service';
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
  private readonly budgetService = inject(BudgetService);
  private readonly toast = inject(ToastService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  readonly language = inject(LanguageService);

  readonly form = new FormGroup<TransactionEntryFormControls>({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    quantity: new FormControl<number | null>(1, [Validators.required, Validators.min(1)]),
    category: new FormControl('', { nonNullable: true }),
    date: new FormControl(getTodayInputValue(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    budgetId: new FormControl<number | null>(null),
    note: new FormControl('', { nonNullable: true }),
    isExpense: new FormControl(true, { nonNullable: true }),
  });

  categories: CategoryDto[] = FALLBACK_CATEGORIES;
  budgets: BudgetDto[] = [];
  selectedImage: File | null = null;
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

    this.budgetService.getAllAccessibleBudgets().subscribe({
      next: (budgets) => {
        this.budgets = [...budgets].sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
        if (this.budgets.length > 0) {
          this.form.controls.budgetId.setValue(this.budgets[0].id);
        }
      },
      error: () => {
        this.budgets = [];
      }
    });
  }

  onImageSelected(file: File | null): void {
    this.selectedImage = file;
  }

  protected saveTransaction(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, amount, category, date, budgetId, note, isExpense } = this.form.getRawValue();

    if (amount === null) {
      return;
    }



    this.isSaving = true;

    this.transactionService
      .createTransaction({
        title,
        amount,
        category: category || null,
        transactionDate: date,
        budgetId: budgetId,
        note: note || null,
        isExpense,
        source: 'manual',
      }, this.selectedImage)
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
