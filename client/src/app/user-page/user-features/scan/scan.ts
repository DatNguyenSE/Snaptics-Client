import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AiService } from '../../../core/services/ai.service';
import { CategoryService } from '../../../core/services/category.service';
import { LanguageService } from '../../../core/services/language-service';
import { ToastService } from '../../../core/services/toast-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { CreateTransactionFromBillDto, ReadBillResponseDto } from '../../../models/ai-bill.dto';
import { CategoryDto } from '../../../models/category.dto';

type ScanState = 'upload' | 'camera' | 'scanning' | 'result' | 'saving' | 'error';

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
}

const CATEGORY_CLASSES: Record<string, string> = {
  Drinks: 'category-pill--blue',
  Food: 'category-pill--amber',
  Other: 'category-pill--slate',
};

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scan.html',
  styleUrl: './scan.css',
})
export class Scan implements OnInit, OnDestroy {
  private readonly toast = inject(ToastService);
  private readonly aiService = inject(AiService);
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  readonly lang = inject(LanguageService);

  readonly steps = [
    'scan.steps.upload',
    'scan.steps.aiRead',
    'scan.steps.confirm',
    'scan.steps.save',
  ];
  readonly supportedFormats = ['JPG', 'PNG', 'PDF'];

  storeName = this.lang.t('scan.unknownStore');
  receiptDate: string | null = null;
  billImageKey: string | null = null;
  categories: CategoryDto[] = [];

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;

  mediaStream: MediaStream | null = null;
  scanState: ScanState = 'upload';
  receiptItems: ReceiptItem[] = [];
  errorMessage: string | null = null;
  currentFile: File | null = null;

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter(
          (category) =>
            !!category.name &&
            category.name.toLowerCase() !== 'unknown' &&
            category.name.toLowerCase() !== 'string',
        );
      },
      error: (error) => console.error('Failed to load categories', error),
    });
  }

  get stepIndex(): number {
    if (this.scanState === 'scanning' || this.scanState === 'error') {
      return 1;
    }

    if (this.scanState === 'result') {
      return 2;
    }

    if (this.scanState === 'saving') {
      return 3;
    }

    return 0;
  }

  get stateLabel(): string {
    switch (this.scanState) {
      case 'scanning':
        return this.lang.t('scan.state.analyzing');
      case 'result':
        return this.lang.t('scan.state.ready');
      case 'saving':
        return this.lang.t('scan.state.saving');
      case 'error':
        return this.lang.t('scan.state.error');
      default:
        return this.lang.t('scan.state.waiting');
    }
  }

  get totalAmount(): number {
    return this.receiptItems.reduce((sum, item) => sum + item.price, 0);
  }

  async openCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      this.scanState = 'camera';

      setTimeout(() => {
        if (this.videoElement?.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
        }
      }, 0);
    } catch (error) {
      console.error('Error accessing camera', error);
      this.toast.error(this.lang.t('scan.toast.cameraError'));
    }
  }

  capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth <= 0 || video.videoHeight <= 0) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    this.stopCamera();
    this.scanState = 'scanning';

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'captured_receipt.jpg', { type: 'image/jpeg' });
        this.startScan(file);
        return;
      }

      this.resetScan();
    }, 'image/jpeg', 0.8);
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.scanState === 'camera') {
      this.scanState = 'upload';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.startScan(input.files[0]);
    }

    input.value = '';
  }

  startScan(file: File): void {
    this.scanState = 'scanning';
    this.currentFile = file;

    this.aiService
      .readBill(file)
      .pipe(
        finalize(() => {
          if (this.scanState === 'scanning') {
            this.scanState = 'error';
          }
        }),
      )
      .subscribe({
        next: (response: ReadBillResponseDto) => {
          if (!response.items || response.items.length === 0) {
            this.errorMessage = this.lang.t('scan.error.noData');
            this.scanState = 'error';
            return;
          }

          this.storeName = response.merchantName || this.lang.t('scan.unknownStore');
          this.receiptDate = response.transactionDate || new Date().toISOString();
          this.billImageKey = response.billImageKey || null;

          this.receiptItems = response.items.map((item, index) => {
            const matchedCategory = item.category
              ? this.categories.find(
                  (category) =>
                    category.name.toLowerCase() === item.category!.toLowerCase(),
                )
              : undefined;
            const isUnknown = !matchedCategory;

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

          this.scanState = 'result';
        },
        error: (error) => {
          console.error(error);
          this.errorMessage = this.lang.t('scan.error.readFailed');
          this.scanState = 'error';
        },
      });
  }

  resetScan(): void {
    this.stopCamera();
    this.scanState = 'upload';
    this.receiptItems = [];
    this.storeName = this.lang.t('scan.unknownStore');
    this.receiptDate = null;
    this.billImageKey = null;
    this.errorMessage = null;
    this.currentFile = null;
  }

  confirmScan(): void {
    const hasUnknownCategory = this.receiptItems.some((item) => !item.categoryId);

    if (hasUnknownCategory) {
      this.toast.error(this.lang.t('scan.toast.selectCategory'));
      return;
    }

    this.scanState = 'saving';

    const requestData: CreateTransactionFromBillDto = {
      merchantName: this.storeName,
      imageKey: this.billImageKey,
      totalAmount: this.totalAmount,
      transactionDate: this.receiptDate,
      items: this.receiptItems.map((item) => ({
        itemName: item.name,
        category: item.categoryLabel,
        price: item.unitPrice,
        quantity: item.quantity,
        unit: item.unit,
      })),
    };

    this.transactionService.createFromBill(requestData, this.currentFile).subscribe({
      next: () => {
        this.toast.success(this.lang.t('scan.toast.saved'));
        this.resetScan();
      },
      error: (error) => {
        console.error(error);
        this.toast.error(this.lang.t('scan.toast.saveFailed'));
        this.scanState = 'result';
      },
    });
  }

  updateCategory(itemId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newCategoryId = select.value === 'null' ? null : Number(select.value);

    if (newCategoryId === null) {
      this.receiptItems = this.receiptItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              categoryId: null,
              categoryLabel: 'Unknown',
              categoryClass: 'category-pill--amber',
            }
          : item,
      );
      return;
    }

    const matchedCategory = this.categories.find((category) => category.id === newCategoryId);

    if (!matchedCategory) {
      return;
    }

    this.receiptItems = this.receiptItems.map((item) =>
      item.id === itemId
        ? {
            ...item,
            categoryId: matchedCategory.id,
            categoryLabel: matchedCategory.name,
            categoryClass: this.getCategoryClass(matchedCategory.name),
          }
        : item,
    );
  }

  updatePrice(itemId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = Number(input.value.replace(/[^\d]/g, '')) || 0;

    this.receiptItems = this.receiptItems.map((item) => {
      if (item.id !== itemId) {
        return item;
      }

      const newUnitPrice = item.quantity > 0 ? numericValue / item.quantity : numericValue;
      return { ...item, price: numericValue, unitPrice: newUnitPrice };
    });
  }

  updateStoreName(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.storeName = input.value;
  }

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

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private getCategoryClass(category: string): string {
    return CATEGORY_CLASSES[category] || 'category-pill--slate';
  }
}
