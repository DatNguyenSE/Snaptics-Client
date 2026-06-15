import { Component, OnDestroy, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast-service';

type ScanState = 'upload' | 'scanning' | 'result' | 'saving';

interface ReceiptItem {
  id: number;
  name: string;
  categoryLabel: string;
  categoryClass: string;
  price: number;
}

const INITIAL_RECEIPT_ITEMS: ReceiptItem[] = [
  {
    id: 1,
    name: 'Aquafina Water 500ml',
    categoryLabel: 'Drinks',
    categoryClass: 'category-pill--blue',
    price: 12000,
  },
  {
    id: 2,
    name: 'Kinh Do Snack Cake',
    categoryLabel: 'Food',
    categoryClass: 'category-pill--amber',
    price: 18000,
  },
  {
    id: 3,
    name: 'Doublemint Gum',
    categoryLabel: 'Other',
    categoryClass: 'category-pill--slate',
    price: 5000,
  },
];

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [],
  templateUrl: './scan.html',
  styleUrl: './scan.css',
})
export class Scan implements OnDestroy {
  private readonly toast = inject(ToastService);

  readonly steps = ['Upload', 'AI Read', 'Confirm', 'Save'];
  readonly storeName = 'Circle K - 200 Nguyen Thi Minh Khai';
  readonly receiptDate = 'June 5, 2026';
  readonly supportedFormats = ['JPG', 'PNG', 'PDF'];

  scanState: ScanState = 'upload';
  receiptItems = this.cloneItems();

  private scanTimer: number | null = null;

  get stepIndex(): number {
    if (this.scanState === 'scanning') {
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
      default:
        return 'Waiting';
    }
  }

  get totalAmount(): number {
    return this.receiptItems.reduce((sum, item) => sum + item.price, 0);
  }

  startScan(): void {
    this.clearTimer();
    this.scanState = 'scanning';
    this.scanTimer = window.setTimeout(() => {
      this.scanState = 'result';
      this.scanTimer = null;
    }, 2200);
  }

  resetScan(): void {
    this.clearTimer();
    this.scanState = 'upload';
    this.receiptItems = this.cloneItems();
  }

  confirmScan(): void {
    this.clearTimer();
    this.scanState = 'saving';
    this.scanTimer = window.setTimeout(() => {
      this.toast.success('Receipt saved to your transactions.');
      this.resetScan();
    }, 1200);
  }

  updatePrice(itemId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = Number(input.value.replace(/[^\d]/g, '')) || 0;

    this.receiptItems = this.receiptItems.map((item) =>
      item.id === itemId ? { ...item, price: numericValue } : item,
    );
  }

  formatCurrency(value: number): string {
    return `${new Intl.NumberFormat('en-US').format(value)} VND`;
  }

  formatEditablePrice(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private cloneItems(): ReceiptItem[] {
    return INITIAL_RECEIPT_ITEMS.map((item) => ({ ...item }));
  }

  private clearTimer(): void {
    if (this.scanTimer !== null) {
      window.clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }
}
