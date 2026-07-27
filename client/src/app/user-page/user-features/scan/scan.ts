import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  NgZone,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, map, of, Subscription, timeout } from 'rxjs';
import { AiService } from '../../../core/services/ai.service';
import { CategoryService } from '../../../core/services/category.service';
import { LanguageService } from '../../../core/services/language-service';
import { ToastService } from '../../../core/services/toast-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { CreateTransactionFromBillDto, ReadBillResponseDto } from '../../../models/ai-bill.dto';
import { CategoryDto } from '../../../models/category.dto';
import { BudgetDto, BudgetService } from '../../../core/services/budget.service';
import {
  TransactionEntryForm,
  TransactionEntryFormControls,
} from '../shared/transaction-entry-form/transaction-entry-form';
import {
  FALLBACK_CATEGORIES,
  PAYMENT_METHOD_OPTIONS,
  getTodayInputValue,
  resolveCategories,
} from '../shared/transaction-entry/transaction-entry.utils';
import { parseSnapItemAnalysis } from './scan-extraction';
import { buildMockSnapItemExtraction } from '../snap-item/snap-item-extraction';

// ─── Type Definitions ─────────────────────────────────────────────────────────
export type ScanMode = 'receipt' | 'item' | 'manual';
export type CameraPermission =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'unsupported';
export type CaptureState = 'live' | 'preview';
export type ProcessingState = 'idle' | 'scanning' | 'success' | 'result' | 'saving' | 'error';

export interface ReceiptItem {
  id: number;
  name: string;
  categoryId: number | null;
  categoryLabel: string;
  categoryClass: string;
  unitPrice: number;
  price: number;
  quantity: number;
  unit: string | null;
  isEditing?: boolean;
}

const CATEGORY_CLASSES: Record<string, string> = {
  Drinks: 'category-pill--blue',
  Food: 'category-pill--amber',
  Other: 'category-pill--slate',
};

const ACCEPTED_FORMATS = 'image/jpeg,image/png,image/webp,image/jpg';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TransactionEntryForm],
  templateUrl: './scan.html',
  styleUrl: './scan.css',
})
export class Scan implements OnInit, OnDestroy {
  // ─── Services ───────────────────────────────────────────────────────────────
  private readonly toast = inject(ToastService);
  private readonly aiService = inject(AiService);
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly budgetService = inject(BudgetService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  readonly lang = inject(LanguageService);

  // ─── ViewChild refs ─────────────────────────────────────────────────────────
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cameraContainer') cameraContainer?: ElementRef<HTMLElement>;
  @ViewChild('uploadInput') uploadInput?: ElementRef<HTMLInputElement>;

  // ─── Constants ──────────────────────────────────────────────────────────────

  // ─── Constants ──────────────────────────────────────────────────────────────
  readonly acceptedFormats = ACCEPTED_FORMATS;
  readonly scanModes: { id: ScanMode; icon: string; labelKey: string }[] = [
    { id: 'receipt', icon: 'receipt_long', labelKey: 'scan.mode.receipt' },
    { id: 'item', icon: 'image_search', labelKey: 'scan.mode.item' },
  ];

  // ─── State ──────────────────────────────────────────────────────────────────
  scanMode: ScanMode = 'receipt';
  cameraPermission: CameraPermission = 'idle';
  captureState: CaptureState = 'live';
  processingState: ProcessingState = 'idle';

  // Scanning Timer & Subscription Management
  private scanSubscription: Subscription | null = null;
  private scanTimer: any = null;
  private successTimeout: any = null;
  private highlightTimeout: any = null;
  scanElapsedSeconds = 0;
  isLowConfidence = false;
  highlightFields = false;

  // Auto Capture & Scan History
  autoCaptureEnabled = false;
  countdownSeconds = 0;
  private autoCaptureInterval: any = null;
  recentScans: any[] = [];

  // Camera
  mediaStream: MediaStream | null = null;
  facingMode: 'environment' | 'user' = 'environment';
  flashEnabled = false;
  hasMultipleCameras = false;
  hasFlash = false;

  // Preview / image
  previewUrl: string | null = null;
  currentFile: File | null = null;
  previewMatchesCamera = false;
  previewAspectRatio = 'auto';

  // Form / Data
  categories: CategoryDto[] = [...FALLBACK_CATEGORIES];
  budgets: BudgetDto[] = [];
  errorMessage: string | null = null;
  isEditingBill = false;
  isProcessing = false;

  // Item Scan Form
  readonly manualForm = new FormGroup<TransactionEntryFormControls>({
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
  isSaving = false;

  // Receipt Scan Form Fields
  receiptItems: ReceiptItem[] = [];
  storeName = '';
  receiptDate = '';
  billImageKey: string | null = null;
  totalAmount = 0;
  billNote = '';
  budgetId: number | null = null;

  // Processing microcopy
  private microcopyInterval: any = null;
  microcopyIndex = 0;
  readonly microcopyTexts = [
    'scan.analyzing.1',
    'scan.analyzing.2',
    'scan.analyzing.3',
    'scan.analyzing.4',
    'scan.analyzing.5',
    'scan.analyzing.6'
  ];

  get dynamicMicrocopy(): string {
    return this.lang.t(this.microcopyTexts[this.microcopyIndex]);
  }

  get loadingText(): string {
    const isItem = this.scanMode === 'item';
    if (this.scanElapsedSeconds < 3) {
      return isItem ? this.lang.t('scan.itemLoadingStep1') : this.lang.t('scan.loadingStep1');
    } else if (this.scanElapsedSeconds < 7) {
      return isItem ? this.lang.t('scan.itemLoadingStep2') : this.lang.t('scan.loadingStep2');
    } else {
      return isItem ? this.lang.t('scan.itemLoadingStep3') : this.lang.t('scan.loadingStep3');
    }
  }

  get isCameraActive(): boolean {
    return !!this.mediaStream;
  }

  get showCamera(): boolean {
    return this.scanMode !== 'manual' && this.captureState === 'live' && !this.previewUrl;
  }

  get cameraFrameClass(): string {
    return this.scanMode === 'receipt' ? 'scan-frame--receipt' : 'scan-frame--item';
  }

  get instructionText(): string {
    return this.scanMode === 'receipt'
      ? this.lang.t('scan.instruction.receipt')
      : this.lang.t('scan.instruction.item');
  }

  // ─── Timers ──────────────────────────────────────────────────────────────────
  private startMicrocopyTimer(): void {
    this.clearMicrocopyTimer();
    this.scanElapsedSeconds = 0;
    this.scanTimer = setInterval(() => {
      this.scanElapsedSeconds++;
      this.cdr.detectChanges();
    }, 1000);
  }

  private clearMicrocopyTimer(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.categoryService.getCategories().pipe(
      map((cats) => resolveCategories(cats)),
      catchError(() => of(FALLBACK_CATEGORIES)),
    ).subscribe((categories) => {
      this.categories = categories;
    });

    this.budgetService.getBudgets().subscribe({
      next: (budgets) => {
        this.budgets = budgets;
        const defaultBudget = budgets.find(b => b.isDefault) || budgets[0];
        if (defaultBudget) {
          this.manualForm.controls.budgetId.setValue(defaultBudget.id);
          this.budgetId = defaultBudget.id;
        }
      },
      error: () => {
        this.budgets = [];
      }
    });

    this.detectCameraCapabilities();
    this.initCamera();
    this.loadRecentScans();
  }

  ngOnDestroy(): void {
    if (this.scanSubscription) {
      this.scanSubscription.unsubscribe();
      this.scanSubscription = null;
    }
    this.clearMicrocopyTimer();
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
      this.successTimeout = null;
    }
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = null;
    }
    this.stopCamera();
    this.clearPreview();
    this.clearAutoCaptureTimer();
  }

  // ─── Camera Capabilities ─────────────────────────────────────────────────────
  private async detectCameraCapabilities(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      this.hasMultipleCameras = videoDevices.length > 1;
    } catch {
      this.hasMultipleCameras = false;
    }
  }

  // ─── Camera Lifecycle ────────────────────────────────────────────────────────
  async initCamera(): Promise<void> {
    if (this.scanMode === 'manual') {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraPermission = 'unsupported';
      return;
    }

    this.cameraPermission = 'requesting';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      this.mediaStream = stream;
      this.cameraPermission = 'granted';
      
      // Check for flash/torch
      const track = stream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        try {
          const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
          this.hasFlash = !!caps.torch;
        } catch {
          this.hasFlash = false;
        }
      }
      
      this.cdr.detectChanges();

      // Bind to video element after Angular renders it
      setTimeout(() => {
        if (this.videoElement?.nativeElement) {
          this.videoElement.nativeElement.srcObject = stream;
          this.videoElement.nativeElement.play().catch(() => {});
        }
        this.cdr.detectChanges();

        if (this.autoCaptureEnabled) {
          this.startAutoCaptureCountdown();
        }
      }, 0);
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (
        error?.name === 'NotAllowedError' ||
        error?.name === 'PermissionDeniedError'
      ) {
        this.cameraPermission = 'denied';
      } else if (
        error?.name === 'NotFoundError' ||
        error?.name === 'DevicesNotFoundError'
      ) {
        this.cameraPermission = 'unavailable';
      } else {
        this.cameraPermission = 'denied';
      }
      this.cdr.detectChanges();
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  async flipCamera(): Promise<void> {
    this.stopCamera();
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    await this.initCamera();
  }

  async toggleFlash(): Promise<void> {
    if (!this.mediaStream) {
      return;
    }
    const track = this.mediaStream.getVideoTracks()[0];
    if (!track) {
      return;
    }
    this.flashEnabled = !this.flashEnabled;
    try {
      await track.applyConstraints({
        advanced: [{ torch: this.flashEnabled } as MediaTrackConstraintSet],
      });
    } catch {
      this.flashEnabled = !this.flashEnabled; // revert on failure
    }
  }

  // ─── Mode Switching ──────────────────────────────────────────────────────────
  setScanMode(mode: ScanMode): void {
    if (mode === 'manual') {
      void this.router.navigate(['/user/manual-entry']);
      return;
    }

    if (this.scanMode === mode) {
      return;
    }

    this.scanMode = mode;
    this.resetCaptureState();
  }

  toggleAutoCapture(): void {
    this.autoCaptureEnabled = !this.autoCaptureEnabled;
    if (this.autoCaptureEnabled) {
      if (this.cameraPermission === 'granted' && this.captureState === 'live') {
        this.startAutoCaptureCountdown();
      }
    } else {
      this.clearAutoCaptureTimer();
    }
  }

  startAutoCaptureCountdown(): void {
    this.clearAutoCaptureTimer();
    this.countdownSeconds = 3;
    this.cdr.detectChanges();

    this.autoCaptureInterval = setInterval(() => {
      this.countdownSeconds--;
      this.cdr.detectChanges();

      if (this.countdownSeconds <= 0) {
        this.clearAutoCaptureTimer();
        this.capturePhoto();
      }
    }, 1000);
  }

  private clearAutoCaptureTimer(): void {
    if (this.autoCaptureInterval) {
      clearInterval(this.autoCaptureInterval);
      this.autoCaptureInterval = null;
    }
    this.countdownSeconds = 0;
    this.cdr.detectChanges();
  }

  loadRecentScans(): void {
    this.transactionService.getTransactions().subscribe({
      next: (txs) => {
        this.recentScans = txs
          .filter((t) => t.source === 'receipt' || t.source === 'snap')
          .slice(0, 3);
        this.cdr.detectChanges();
      },
      error: () => {
        this.recentScans = [];
      }
    });
  }

  // ─── Capture ─────────────────────────────────────────────────────────────────
  @HostListener('window:nav-shutter-click')
  onNavShutterClick(): void {
    if (
      this.cameraPermission === 'granted' &&
      this.captureState === 'live' &&
      this.processingState === 'idle'
    ) {
      this.capturePhoto();
    }
  }
  capturePhoto(): void {
    if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      this.toast.error(this.lang.t('scan.toast.cameraLoading'));
      return;
    }

    const container = this.cameraContainer?.nativeElement;
    if (!container || container.clientWidth <= 0 || container.clientHeight <= 0) {
      this.toast.error(this.lang.t('scan.toast.captureError'));
      return;
    }

    // Match the exact visible camera viewport instead of using a fixed ratio.
    const targetWidth = container.clientWidth;
    const targetHeight = container.clientHeight;
    const targetRatio = targetWidth / targetHeight;
    const sourceRatio = video.videoWidth / video.videoHeight;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;

    if (sourceRatio > targetRatio) {
      sourceWidth = video.videoHeight * targetRatio;
      sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
      sourceHeight = video.videoWidth / targetRatio;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    canvas.width = Math.round(sourceWidth);
    canvas.height = Math.round(sourceHeight);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    canvas.toBlob(
      (blob) => {
        this.ngZone.run(() => {
          if (!blob) {
            this.toast.error(this.lang.t('scan.toast.captureError'));
            return;
          }
          const fileName = this.scanMode === 'receipt' ? 'receipt.jpg' : 'item.jpg';
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          this.stopCamera();
          this.setPreview(file, true, `${targetWidth} / ${targetHeight}`);
        });
      },
      'image/jpeg',
      0.8
    );
  }

  retakePhoto(): void {
    this.clearPreview();
    this.processingState = 'idle';
    this.errorMessage = null;
    this.receiptItems = [];
    void this.initCamera();
  }

  usePhoto(): void {
    if (!this.currentFile) {
      return;
    }
    this.processFile(this.currentFile);
  }

  // ─── File Upload ─────────────────────────────────────────────────────────────
  triggerUpload(): void {
    this.uploadInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file) {
      return;
    }

    this.stopCamera();
    this.setPreview(file);
  }

  // ─── Processing ──────────────────────────────────────────────────────────────
  retryScan(): void {
    if (this.currentFile) {
      this.processFile(this.currentFile);
    } else {
      this.retakePhoto();
    }
  }

  private processFile(file: File): void {
    if (this.scanMode === 'receipt') {
      this.processBillScan(file);
    } else if (this.scanMode === 'item') {
      this.processItemScan(file);
    }
  }

  private processBillScan(file: File): void {
    if (
      this.processingState === 'scanning' ||
      this.processingState === 'success' ||
      this.processingState === 'saving'
    ) {
      return;
    }

    if (this.scanSubscription) {
      this.scanSubscription.unsubscribe();
      this.scanSubscription = null;
    }

    this.currentFile = file;
    this.processingState = 'scanning';
    this.errorMessage = null;
    this.isLowConfidence = false;
    this.startMicrocopyTimer();

    this.scanSubscription = this.aiService
      .readBill(file)
      .pipe(
        timeout(20000),
        catchError((err: unknown) => {
          return of(null);
        }),
      )
      .subscribe((response: ReadBillResponseDto | null) => {
        this.clearMicrocopyTimer();

        if (!response) {
          this.errorMessage = this.lang.t('scan.errorNetwork');
          this.processingState = 'error';
          this.cdr.detectChanges();
          return;
        }

        if (!response.items || response.items.length === 0) {
          this.errorMessage = this.lang.t('scan.errorNoContent');
          this.processingState = 'error';
          this.cdr.detectChanges();
          return;
        }

        this.storeName = response.merchantName || this.lang.t('scan.unknownStore');
        this.receiptDate = response.transactionDate || new Date().toISOString();
        this.billImageKey = response.billImageKey || null;
        this.totalAmount = response.totalAmount || 0;

        let hasUnknownCategory = false;

        this.receiptItems = response.items.map((item, index) => {
          const matchedCategory = item.category
            ? this.categories.find(
                (cat) => cat.name.toLowerCase() === item.category!.toLowerCase(),
              )
            : undefined;
          const isUnknown = !matchedCategory;
          if (isUnknown) {
            hasUnknownCategory = true;
          }

          return {
            id: index + 1,
            name: item.itemName,
            categoryId: matchedCategory ? matchedCategory.id : null,
            categoryLabel: isUnknown ? 'Unknown' : matchedCategory.name,
            categoryClass: isUnknown
              ? 'category-pill--amber'
              : this.getCategoryClass(matchedCategory.name),
            unitPrice: item.price,
            price: item.totalPrice,
            quantity: item.quantity || 1,
            unit: item.unit || null,
          };
        });

        // Check for low confidence or incomplete data
        const missingStore = !response.merchantName || response.merchantName.trim().length === 0;
        const missingAmount = !response.totalAmount || response.totalAmount <= 0;
        this.isLowConfidence = missingStore || missingAmount || hasUnknownCategory;

        // Transition to success state first
        this.processingState = 'success';
        this.cdr.detectChanges();

        if (this.successTimeout) {
          clearTimeout(this.successTimeout);
        }

        // Wait 500ms before navigating to result screen
        this.successTimeout = setTimeout(() => {
          this.processingState = 'result';
          this.highlightFields = true;
          this.cdr.detectChanges();

          if (this.highlightTimeout) {
            clearTimeout(this.highlightTimeout);
          }
          this.highlightTimeout = setTimeout(() => {
            this.highlightFields = false;
            this.cdr.detectChanges();
          }, 2500);
        }, 500);
      });
  }

  private processItemScan(file: File): void {
    if (
      this.processingState === 'scanning' ||
      this.processingState === 'success' ||
      this.processingState === 'saving'
    ) {
      return;
    }

    if (this.scanSubscription) {
      this.scanSubscription.unsubscribe();
      this.scanSubscription = null;
    }

    this.currentFile = file;
    this.processingState = 'scanning';
    this.errorMessage = null;
    this.startMicrocopyTimer();

    this.scanSubscription = this.aiService
      .analyzeImage(file)
      .pipe(
        timeout(20000),
        map((response) => {
          const parsed = parseSnapItemAnalysis(response, this.categories);
          if (parsed) {
            return { extraction: parsed, source: 'ai' as const };
          }
          throw new Error('Failed to extract item details from image.');
        }),
        catchError(() => {
          const mock = buildMockSnapItemExtraction(file, this.categories);
          return of({ extraction: mock, source: 'mock' as const });
        }),
      )
      .subscribe((result) => {
        this.clearMicrocopyTimer();

        if (!result) {
          this.errorMessage = this.lang.t('scan.errorItemNoContent');
          this.processingState = 'error';
          this.cdr.detectChanges();
          return;
        }

        const { extraction } = result;

        this.manualForm.patchValue({
          title: extraction.itemName,
          amount: extraction.estimatedAmount,
          quantity: extraction.quantity || 1,
          category: extraction.category || '',
          date: extraction.date,
          note: extraction.note,
        });

        // Use success state briefly
        this.processingState = 'success';
        this.cdr.detectChanges();

        if (this.successTimeout) {
          clearTimeout(this.successTimeout);
        }
        
        this.successTimeout = setTimeout(() => {
          this.processingState = 'result';
          this.highlightFields = true;
          this.cdr.detectChanges();

          if (this.highlightTimeout) {
            clearTimeout(this.highlightTimeout);
          }
          this.highlightTimeout = setTimeout(() => {
            this.highlightFields = false;
            this.cdr.detectChanges();
          }, 2500);
        }, 500);
      });
  }

  confirmScan(): void {
    if (this.processingState !== 'result') return;

    // Validate that all items have a category
    const hasUnassigned = this.receiptItems.some(i => !i.categoryLabel || i.categoryLabel === 'Unknown' || i.categoryId == null);
    if (hasUnassigned) {
      this.toast.error(this.lang.currentLang() === 'vi' ? 'Vui lòng phân loại tất cả các sản phẩm' : 'Please assign a category to all items');
      return;
    }

    this.processingState = 'saving';
    this.errorMessage = null;
    this.cdr.detectChanges();

    const dto = {
      merchantName: this.storeName,
      transactionDate: this.receiptDate,
      totalAmount: this.totalAmount,
      billImageKey: this.billImageKey,
      note: this.billNote,
      budgetId: this.budgetId,
      items: this.receiptItems.map((item) => ({
        itemName: item.name,
        category: item.categoryLabel === 'Unknown' ? null : item.categoryLabel,
        unitPrice: item.unitPrice,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit
      }))
    };

    this.transactionService.createFromBill(dto as any, this.currentFile).subscribe({
      next: () => {
        this.toast.success(this.lang.t('scan.successSave'));
        this.resetAll();
      },
      error: (err: any) => {
        this.errorMessage = this.lang.t('scan.errorSave');
        this.processingState = 'result';
        this.cdr.detectChanges();
      }
    });
  }

  saveItemTransaction(): void {
    if (this.manualForm.invalid || this.isSaving) {
      this.manualForm.markAllAsTouched();
      return;
    }
    
    this.isSaving = true;
    this.errorMessage = null;
    this.cdr.detectChanges();

    const formValue = this.manualForm.getRawValue();
    const categoryName = formValue.category;

    const dto = {
      itemName: formValue.title,
      estimatedPriceVND: formValue.amount || 0,
      quantity: formValue.quantity || 1,
      category: categoryName,
      isExpense: formValue.isExpense,
      note: formValue.note,
      transactionDate: formValue.date,
      budgetId: formValue.budgetId
    };

    this.transactionService.createFromAnalyze(dto, this.currentFile).subscribe({
      next: () => {
        this.toast.success(this.lang.t('scan.successSave'));
        this.isSaving = false;
        this.resetAll();
      },
      error: (err: any) => {
        this.errorMessage = this.lang.t('scan.errorSave');
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateCategory(itemId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const item = this.receiptItems.find((i) => i.id === itemId);
    if (item) {
      const cat = this.categories.find(c => c.id === Number(select.value));
      item.categoryId = cat ? cat.id : null;
      item.categoryLabel = cat ? cat.name : 'Unknown';
      item.categoryClass = cat ? this.getCategoryClass(cat.name) : 'category-pill--amber';
      this.cdr.detectChanges();
    }
  }


  updatePrice(itemId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const item = this.receiptItems.find((i) => i.id === itemId);
    if (item) {
      const rawValue = input.value.replace(/\D/g, '');
      const val = parseInt(rawValue, 10);
      if (!isNaN(val)) {
        item.price = val;
      } else {
        item.price = 0;
      }
      this.updateOverallTotal();
      input.value = this.formatEditablePrice(item.price);
    }
  }

  updateItemName(itemId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const item = this.receiptItems.find((i) => i.id === itemId);
    if (item) {
      item.name = input.value;
    }
  }

  updateItemPriceRaw(itemId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const item = this.receiptItems.find((i) => i.id === itemId);
    if (item) {
      const val = parseFloat(input.value);
      item.unitPrice = isNaN(val) ? 0 : val;
      item.price = item.unitPrice * item.quantity;
      this.updateOverallTotal();
    }
  }

  updateItemQuantity(itemId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const item = this.receiptItems.find((i) => i.id === itemId);
    if (item) {
      const val = parseFloat(input.value);
      item.quantity = isNaN(val) ? 1 : val;
      item.price = item.unitPrice * item.quantity;
      this.updateOverallTotal();
    }
  }

  updateStoreName(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.storeName = input.value;
  }

  updateReceiptDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.receiptDate = input.value;
  }

  updateTotalAmount(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = parseFloat(input.value);
    this.totalAmount = isNaN(val) ? 0 : val;
  }

  updateBillNote(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.billNote = input.value;
  }

  private updateOverallTotal(): void {
    this.totalAmount = this.receiptItems.reduce((sum, item) => sum + (item.price || 0), 0);
  }

  resetCaptureState(): void {
    this.processingState = 'idle';
    this.errorMessage = null;
    this.isLowConfidence = false;
    
    this.clearPreview();
    
    const defaultBudget = this.budgets.find(b => b.isDefault) || this.budgets[0];
    const defaultBudgetId = defaultBudget ? defaultBudget.id : null;

    this.manualForm.reset({
      title: '',
      amount: null,
      quantity: 1,
      category: '',
      date: getTodayInputValue(),
      budgetId: defaultBudgetId,
      note: '',
      isExpense: true,
    });
    
    this.receiptItems = [];
    this.storeName = '';
    this.receiptDate = '';
    this.billImageKey = null;
    this.totalAmount = 0;
    this.billNote = '';
    this.budgetId = defaultBudgetId;
    
    if (this.scanMode !== 'manual') {
      void this.initCamera();
    }
  }

  resetAll(): void {
    this.resetCaptureState();
  }

  // ─── Formatting ──────────────────────────────────────────────────────────────
  formatCurrency(value: number): string {
    return `${new Intl.NumberFormat(this.lang.locale()).format(value)} VND`;
  }

  formatEditablePrice(value: number): string {
    return new Intl.NumberFormat(this.lang.locale()).format(value);
  }

  getCategoryName(name: string | undefined | null): string {
    if (!name || name.toLowerCase() === 'unknown') {
      return this.lang.t('scan.category.unassigned');
    }
    const normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const key = `dashboard.category.${normalizedName}`;
    const translated = this.lang.t(key);
    return translated === key ? name : translated;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────
  private setPreview(file: File, matchesCameraFrame = false, aspectRatio = 'auto'): void {
    this.clearPreview();
    this.currentFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.captureState = 'preview';
    this.previewMatchesCamera = matchesCameraFrame;
    this.previewAspectRatio = aspectRatio;
  }

  private clearPreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
    this.captureState = 'live';
    this.previewMatchesCamera = false;
    this.previewAspectRatio = 'auto';
  }

  private getCategoryClass(category: string): string {
    return CATEGORY_CLASSES[category] || 'category-pill--slate';
  }
}
