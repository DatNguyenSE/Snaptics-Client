import { Component, OnInit, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language-service';
import { ToastService } from '../../../core/services/toast-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { environment } from '../../../environments/environment.development';
import { TransactionDto } from '../../../models/transaction.dto';

interface ReminderItem {
  id: number;
  name: string;
  categoryLabel: string;
  categoryClass: string;
  mediaClass: string;
  icon: string;
  imageUrl?: string | null;
}

function mapTransactionToReminderItem(transaction: TransactionDto): ReminderItem {
  const firstDetail = transaction.transactionDetails?.[0];
  const categoryName = firstDetail?.categoryName || null;
  const itemName =
    transaction.name ||
    firstDetail?.itemName ||
    'Unknown item';

  return {
    id: transaction.id,
    name: itemName,
    categoryLabel: categoryName || 'Other',
    categoryClass: resolveCategoryClass(categoryName),
    mediaClass: resolveMediaClass(categoryName),
    icon: resolveIcon(categoryName),
    imageUrl: transaction.imagePreviewUrl
      ? transaction.imagePreviewUrl
      : transaction.imageKey
        ? `${environment.apiUrl}s3/image?key=${encodeURIComponent(transaction.imageKey)}`
        : null,
  };
}

function resolveCategoryClass(category: string | null | undefined): string {
  const name = (category || '').toLowerCase();
  if (name.includes('drink') || name.includes('beverage')) return 'category-pill--blue';
  if (name.includes('food') || name.includes('meal')) return 'category-pill--amber';
  if (name.includes('travel') || name.includes('transport')) return 'category-pill--emerald';
  if (name.includes('electronic')) return 'category-pill--violet';
  return 'category-pill--slate';
}

function resolveMediaClass(category: string | null | undefined): string {
  const name = (category || '').toLowerCase();
  if (name.includes('drink') || name.includes('beverage')) return 'reminder-media--blue';
  if (name.includes('food') || name.includes('meal')) return 'reminder-media--amber';
  if (name.includes('travel') || name.includes('transport')) return 'reminder-media--emerald';
  if (name.includes('electronic')) return 'reminder-media--violet';
  return 'reminder-media--slate';
}

function resolveIcon(category: string | null | undefined): string {
  const name = (category || '').toLowerCase();
  if (name.includes('drink') || name.includes('beverage')) return 'local_cafe';
  if (name.includes('food') || name.includes('meal')) return 'lunch_dining';
  if (name.includes('travel') || name.includes('transport')) return 'directions_car';
  if (name.includes('electronic')) return 'devices';
  return 'local_mall';
}

@Component({
  selector: 'app-reminder',
  standalone: true,
  imports: [],
  templateUrl: './reminder.html',
  styleUrl: './reminder.css',
})
export class Reminder implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly transactionService = inject(TransactionService);
  readonly language = inject(LanguageService);

  reminderItems: ReminderItem[] = [];
  priceInputs: Record<number, string> = {};
  updatedItems: Record<number, boolean> = {};
  isLoading = true;
  hasError = false;

  ngOnInit(): void {
    this.loadReminderItems();
  }

  private loadReminderItems(): void {
    this.isLoading = true;
    this.hasError = false;

    this.transactionService.getTransactions().subscribe({
      next: (transactions) => {
        this.reminderItems = transactions
          .filter((t) => t.isAiEstimated === true)
          .map(mapTransactionToReminderItem);
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  get allUpdated(): boolean {
    return this.reminderItems.length > 0 && this.reminderItems.every((item) => this.updatedItems[item.id]);
  }

  get pendingCount(): number {
    return this.reminderItems.filter((item) => !this.updatedItems[item.id]).length;
  }

  updatePrice(itemId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = input.value.replace(/[^\d]/g, '');

    this.priceInputs = {
      ...this.priceInputs,
      [itemId]:
        numericValue.length > 0
          ? new Intl.NumberFormat(this.language.locale()).format(Number(numericValue))
          : '',
    };
  }

  submitUpdates(): void {
    const nextUpdatedState: Record<number, boolean> = {};

    for (const item of this.reminderItems) {
      nextUpdatedState[item.id] = true;
    }

    this.updatedItems = nextUpdatedState;
    this.toast.success(this.language.t('reminder.toast.updated'));
  }

  isUpdated(itemId: number): boolean {
    return !!this.updatedItems[itemId];
  }

  getCategoryLabel(name: string): string {
    const normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const key = `dashboard.category.${normalizedName}`;
    const translated = this.language.t(key);

    return translated === key ? name : translated;
  }
}
