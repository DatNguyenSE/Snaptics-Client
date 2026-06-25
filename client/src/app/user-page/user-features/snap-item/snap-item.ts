import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of } from 'rxjs';
import { AiService } from '../../../core/services/ai.service';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryDto } from '../../../models/category.dto';
import { TransactionEntryForm, TransactionEntryFormControls } from '../shared/transaction-entry-form/transaction-entry-form';
import { FALLBACK_CATEGORIES, getTodayInputValue, resolveCategories } from '../shared/transaction-entry/transaction-entry.utils';
import { buildMockSnapItemExtraction, parseSnapItemAnalysis } from './snap-item-extraction';

type SnapItemState = 'idle' | 'extracting' | 'ready' | 'error' | 'saving';
type ExtractionSource = 'ai' | 'mock';

@Component({
  selector: 'app-snap-item',
  standalone: true,
  imports: [ReactiveFormsModule, TransactionEntryForm],
  templateUrl: './snap-item.html',
  styleUrl: './snap-item.css',
})
export class SnapItem implements OnInit, OnDestroy {
  private readonly aiService = inject(AiService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly toast = inject(ToastService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  @ViewChild('captureInput') captureInput?: ElementRef<HTMLInputElement>;
  @ViewChild('uploadInput') uploadInput?: ElementRef<HTMLInputElement>;

  readonly form = new FormGroup<TransactionEntryFormControls>({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    category: new FormControl('', { nonNullable: true }),
    date: new FormControl(getTodayInputValue(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paymentMethod: new FormControl('Cash', { nonNullable: true }),
    note: new FormControl('', { nonNullable: true }),
  });

  categories: CategoryDto[] = FALLBACK_CATEGORIES;
  snapState: SnapItemState = 'idle';
  extractionSource: ExtractionSource | null = null;
  previewUrl: string | null = null;
  currentFile: File | null = null;
  errorMessage = '';

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

  ngOnDestroy(): void {
    this.clearPreview();
  }

  protected openCapture(): void {
    this.captureInput?.nativeElement.click();
  }

  protected openUpload(): void {
    this.uploadInput?.nativeElement.click();
  }

  protected onCaptureSelected(event: Event): void {
    this.handleFileSelection(event);
  }

  protected onUploadSelected(event: Event): void {
    this.handleFileSelection(event);
  }

  protected resetSnapFlow(): void {
    this.form.reset({
      title: '',
      amount: null,
      category: '',
      date: getTodayInputValue(),
      paymentMethod: 'Cash',
      note: '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.currentFile = null;
    this.errorMessage = '';
    this.extractionSource = null;
    this.snapState = 'idle';
    this.clearPreview();
  }

  protected saveTransaction(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, amount, category, date, note } = this.form.getRawValue();

    if (amount === null) {
      return;
    }

    this.snapState = 'saving';

    this.transactionService
      .createTransactionEntry({
        title,
        amount,
        category: category || null,
        transactionDate: date,
        note: note || null,
        imagePreviewUrl: this.previewUrl,
        isAiEstimated: true,
        source: 'snap',
      })
      .subscribe({
        next: () => {
          this.toast.success('Snap item saved to your transactions.');
          void this.router.navigateByUrl('/user/dashboard');
        },
        error: () => {
          this.snapState = 'ready';
          this.toast.error('Unable to save this item right now.');
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

  protected get hasPreview(): boolean {
    return !!this.previewUrl;
  }

  private handleFileSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file) {
      return;
    }

    this.currentFile = file;
    this.errorMessage = '';
    this.snapState = 'extracting';
    this.setPreview(file);

    this.aiService
      .analyzeImage(file)
      .pipe(
        map((response) => {
          const parsedResponse = parseSnapItemAnalysis(response, this.categories);

          if (parsedResponse) {
            return { extraction: parsedResponse, source: 'ai' as const };
          }

          return {
            extraction: buildMockSnapItemExtraction(file, this.categories),
            source: 'mock' as const,
          };
        }),
        catchError(() =>
          of({
            extraction: buildMockSnapItemExtraction(file, this.categories),
            source: 'mock' as const,
          }),
        ),
      )
      .subscribe({
        next: ({ extraction, source }) => {
          this.extractionSource = source;
          this.form.patchValue({
            title: extraction.itemName,
            amount: extraction.estimatedAmount,
            category: extraction.category ?? '',
            date: extraction.date.slice(0, 10),
            note: extraction.note,
          });
          this.snapState = 'ready';
        },
        error: () => {
          this.errorMessage = 'We could not extract item details from this image.';
          this.snapState = 'error';
        },
      });
  }

  private setPreview(file: File): void {
    this.clearPreview();
    this.previewUrl = URL.createObjectURL(file);
  }

  private clearPreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    this.previewUrl = null;
  }
}
