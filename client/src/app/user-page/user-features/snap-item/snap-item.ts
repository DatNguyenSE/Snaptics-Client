import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of } from 'rxjs';
import { AiService } from '../../../core/services/ai.service';
import { CategoryService } from '../../../core/services/category.service';
import { LanguageService } from '../../../core/services/language-service';
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
  private readonly cdr = inject(ChangeDetectorRef);
  readonly language = inject(LanguageService);

  @ViewChild('captureInput') captureInput?: ElementRef<HTMLInputElement>;
  @ViewChild('uploadInput') uploadInput?: ElementRef<HTMLInputElement>;
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;

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

  isCameraActive = false;
  mediaStream: MediaStream | null = null;

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
    this.closeCamera();
  }

  protected openCapture(): void {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          this.mediaStream = stream;
          this.isCameraActive = true;
          setTimeout(() => {
            if (this.videoElement) {
              this.videoElement.nativeElement.srcObject = stream;
              this.videoElement.nativeElement.play();
            }
          }, 0);
        })
        .catch((err) => {
          console.error('Camera access denied or not supported:', err);
          this.captureInput?.nativeElement.click();
        });
    } else {
      this.captureInput?.nativeElement.click();
    }
  }

  protected capturePhoto(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.videoElement && this.canvasElement) {
      const video = this.videoElement.nativeElement;
      const canvas = this.canvasElement.nativeElement;

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        this.toast.error(this.language.t('snapItem.error.cameraLoading') || 'Camera đang tải, vui lòng thử lại');
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        try {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const file = new File([blob], `snap-${Date.now()}.jpg`, { type: 'image/jpeg' });
                this.closeCamera();
                this.processFile(file);
                this.cdr.detectChanges(); // Ensure UI updates immediately
              } else {
                this.toast.error(this.language.t('snapItem.error.captureFailed') || 'Không thể chụp ảnh');
              }
            },
            'image/jpeg',
            0.9
          );
        } catch (err) {
          console.error("Lỗi vẽ canvas:", err);
          this.toast.error(this.language.t('snapItem.error.captureFailed') || 'Lỗi chụp ảnh');
        }
      }
    }
  }

  protected closeCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive = false;
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
    this.closeCamera();
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
      .createFromAnalyze({
        itemName: title,
        estimatedPriceVND: amount,
        quantity: 1,
        category: category || null,
        unit: 'cái'
      }, this.currentFile)
      .subscribe({
        next: () => {
          this.toast.success(this.language.t('snapItem.toast.saved'));
          void this.router.navigateByUrl('/user/dashboard');
        },
        error: () => {
          this.snapState = 'ready';
          this.toast.error(this.language.t('snapItem.toast.saveFailed'));
        },
      });
  }

  protected cancel(): void {
    if (this.isCameraActive) {
      this.closeCamera();
      return;
    }

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

    this.processFile(file);
  }

  private processFile(file: File): void {
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
          this.errorMessage = this.language.t('snapItem.error.extractFailed');
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
