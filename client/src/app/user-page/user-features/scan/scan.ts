import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { ToastService } from '../../../core/services/toast-service';
import { AiService } from '../../../core/services/ai.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { LanguageService } from '../../../core/services/language-service';
import { ReadBillResponseDto, CreateTransactionFromBillDto } from '../../../models/ai-bill.dto';
import { CategoryDto } from '../../../models/category.dto';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

type ScanState = 'upload' | 'camera' | 'scanning' | 'result' | 'saving' | 'error';

export interface ReceiptItem {
  id: number;
  name: string;
  categoryId: number | null;
  categoryLabel: string;
  categoryClass: string;
  unitPrice: number;
  price: number; // This acts as totalPrice for UI display
  quantity: number;
  unit: string | null;
}

const INITIAL_RECEIPT_ITEMS: ReceiptItem[] = [];

const CATEGORY_CLASSES: Record<string, string> = {
  'Drinks': 'category-pill--blue',
  'Food': 'category-pill--amber',
  'Other': 'category-pill--slate',
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
  public readonly lang = inject(LanguageService);

  readonly steps = ['Upload', 'AI Read', 'Confirm', 'Save'];
  
  // Data from AI
  storeName = 'Unknown Store';
  receiptDate: string | null = null;
  billImageKey: string | null = null;
  readonly supportedFormats = ['JPG', 'PNG', 'PDF'];
  
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
        // Lọc bỏ các category rác bị tạo nhầm trước đây
        this.categories = categories.filter(c => 
          c.name && 
          c.name.toLowerCase() !== 'unknown' && 
          c.name.toLowerCase() !== 'string'
        );
      },
      error: (err) => console.error('Failed to load categories', err)
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
        return 'Analyzing';
      case 'result':
        return 'Ready';
      case 'saving':
        return 'Saving';
      case 'error':
        return 'Error';
      default:
        return 'Waiting';
    }
  }

  get totalAmount(): number {
    return this.receiptItems.reduce((sum, item) => sum + item.price, 0);
  }

  async openCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      this.scanState = 'camera';
      
      setTimeout(() => {
        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
        }
      }, 0);
    } catch (err) {
      console.error('Error accessing camera', err);
      this.toast.error('Cannot access the camera. Please check permissions.');
    }
  }

  capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      this.stopCamera();
      // Set state to scanning immediately to trigger change detection in UI
      this.scanState = 'scanning';

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'captured_receipt.jpg', { type: 'image/jpeg' });
          this.startScan(file);
        } else {
          this.resetScan();
        }
      }, 'image/jpeg', 0.8);
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
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
    input.value = ''; // Reset for consecutive selections
  }

  startScan(file: File): void {
    this.scanState = 'scanning';
    this.currentFile = file;
    
    this.aiService.readBill(file)
      .pipe(finalize(() => {
        if (this.scanState === 'scanning') {
          // If state is still scanning, it means error happened, reset it.
          // Or we can handle it in the next step.
        }
      }))
      .subscribe({
        next: (response: ReadBillResponseDto) => {
          if (!response.items || response.items.length === 0) {
            this.errorMessage = this.lang.currentLang() === 'vi' 
              ? 'Không tìm thấy dữ liệu. Vui lòng chụp lại ảnh rõ nét hơn.' 
              : 'No receipt data found. Please try scanning again with a clearer image.';
            this.scanState = 'error';
            return;
          }

          this.storeName = response.merchantName || 'Unknown Store';
          this.receiptDate = response.transactionDate || new Date().toISOString();
          this.billImageKey = response.billImageKey || null;
          
          this.receiptItems = response.items.map((item, index) => {
            const matchedCategory = item.category ? this.categories.find(c => c.name.toLowerCase() === item.category.toLowerCase()) : undefined;
            const isUnknown = !matchedCategory;
            return {
              id: index + 1,
              name: item.itemName,
              categoryId: matchedCategory ? matchedCategory.id : null,
              categoryLabel: isUnknown ? 'Unknown' : matchedCategory.name,
              categoryClass: isUnknown ? 'category-pill--amber' : this.getCategoryClass(matchedCategory.name),
              unitPrice: item.price,
              price: item.totalPrice,
              quantity: item.quantity || 1,
              unit: item.unit || null
            };
          });
          
          this.scanState = 'result';
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = this.lang.currentLang() === 'vi'
            ? 'Đã xảy ra lỗi khi đọc hoá đơn. Vui lòng thử lại.'
            : 'Failed to read receipt. Please try again.';
          this.scanState = 'error';
        }
      });
  }

  resetScan(): void {
    this.stopCamera();
    this.scanState = 'upload';
    this.receiptItems = [];
    this.storeName = 'Unknown Store';
    this.receiptDate = null;
    this.billImageKey = null;
    this.errorMessage = null;
    this.currentFile = null;
  }

  confirmScan(): void {
    const hasUnknown = this.receiptItems.some(item => !item.categoryId);
    if (hasUnknown) {
      this.toast.error(this.lang.currentLang() === 'vi' 
        ? 'Vui lòng phân loại (chọn danh mục) cho tất cả các món đồ trước khi lưu.'
        : 'Please select a category for all items before saving.');
      return;
    }

    this.scanState = 'saving';
    
    const requestData: CreateTransactionFromBillDto = {
      merchantName: this.storeName,
      imageKey: this.billImageKey,
      totalAmount: this.totalAmount,
      transactionDate: this.receiptDate,
      items: this.receiptItems.map(item => ({
        itemName: item.name,
        category: item.categoryLabel,
        price: item.unitPrice,
        quantity: item.quantity,
        unit: item.unit
      }))
    };

    this.transactionService.createFromBill(requestData, this.currentFile).subscribe({
      next: () => {
        this.toast.success('Receipt saved to your transactions.');
        this.resetScan();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to save receipt.');
        this.scanState = 'result'; // Allow user to try again
      }
    });
  }

  updateCategory(itemId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newCategoryId = select.value === 'null' ? null : Number(select.value);
    
    if (newCategoryId === null) {
      this.receiptItems = this.receiptItems.map((item) =>
        item.id === itemId ? {
          ...item,
          categoryId: null,
          categoryLabel: 'Unknown',
          categoryClass: 'category-pill--amber'
        } : item
      );
    } else {
      const matchedCategory = this.categories.find(c => c.id === newCategoryId);
      if (matchedCategory) {
        this.receiptItems = this.receiptItems.map((item) =>
          item.id === itemId ? { 
            ...item, 
            categoryId: matchedCategory.id,
            categoryLabel: matchedCategory.name,
            categoryClass: this.getCategoryClass(matchedCategory.name)
          } : item
        );
      }
    }
  }

  updatePrice(itemId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = Number(input.value.replace(/[^\d]/g, '')) || 0;

    this.receiptItems = this.receiptItems.map((item) => {
      if (item.id === itemId) {
        // If user modifies total line price, we calculate new unit price to match
        const newUnitPrice = item.quantity > 0 ? numericValue / item.quantity : numericValue;
        return { ...item, price: numericValue, unitPrice: newUnitPrice };
      }
      return item;
    });
  }

  updateStoreName(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.storeName = input.value;
  }

  formatCurrency(value: number): string {
    return `${new Intl.NumberFormat('en-US').format(value)} VND`;
  }

  formatEditablePrice(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  getCategoryName(name: string | undefined | null): string {
    if (!name || name.toLowerCase() === 'unknown') {
      return this.lang.currentLang() === 'vi' ? 'Chưa phân loại' : 'Unknown';
    }
    const key = `dashboard.category.${name.toLowerCase()}`;
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
