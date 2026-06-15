import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast-service';

interface ReminderItem {
  id: number;
  name: string;
  categoryLabel: string;
  categoryClass: string;
  mediaClass: string;
  icon: string;
  imageUrl?: string | null;
}

const REMINDER_ITEMS: ReminderItem[] = [
  {
    id: 1,
    name: 'Aquafina Water',
    categoryLabel: 'Drinks',
    categoryClass: 'category-pill--blue',
    mediaClass: 'reminder-media--blue',
    icon: 'water_drop',
    imageUrl:
      'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=80&h=80&fit=crop&auto=format',
  },
  {
    id: 2,
    name: 'Ham Sandwich',
    categoryLabel: 'Food',
    categoryClass: 'category-pill--amber',
    mediaClass: 'reminder-media--amber',
    icon: 'lunch_dining',
    imageUrl:
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=80&h=80&fit=crop&auto=format',
  },
  {
    id: 3,
    name: 'Mentos Gum',
    categoryLabel: 'Other',
    categoryClass: 'category-pill--slate',
    mediaClass: 'reminder-media--slate',
    icon: 'local_mall',
    imageUrl: null,
  },
];

@Component({
  selector: 'app-reminder',
  standalone: true,
  imports: [],
  templateUrl: './reminder.html',
  styleUrl: './reminder.css',
})
export class Reminder {
  private readonly toast = inject(ToastService);

  readonly reminderItems = REMINDER_ITEMS;
  priceInputs: Record<number, string> = {};
  updatedItems: Record<number, boolean> = {};

  get allUpdated(): boolean {
    return this.reminderItems.every((item) => this.updatedItems[item.id]);
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
          ? new Intl.NumberFormat('en-US').format(Number(numericValue))
          : '',
    };
  }

  submitUpdates(): void {
    const nextUpdatedState: Record<number, boolean> = {};

    for (const item of this.reminderItems) {
      nextUpdatedState[item.id] = true;
    }

    this.updatedItems = nextUpdatedState;
    this.toast.success('Reminder prices updated successfully.');
  }

  isUpdated(itemId: number): boolean {
    return !!this.updatedItems[itemId];
  }
}
