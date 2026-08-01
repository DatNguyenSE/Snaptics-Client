import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LanguageService } from '../../../core/services/language-service';
import { ThemeService } from '../../../core/services/theme.service';
import { ItemInventoryService, ItemInventoryDto, UsageStatusType } from '../../../core/services/item-inventory.service';

interface UsageGroup {
  status: UsageStatusType;
  labelVi: string;
  labelEn: string;
  icon: string;
  colorClass: string;
  items: ItemInventoryDto[];
}

function getStatusString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '')) {
    const num = Number(val);
    if (num === 0) return 'frequent';
    if (num === 1) return 'occasionally';
    if (num === 2) return 'seldom';
    if (num === 3) return 'unused';
    if (num === 4) return 'notevaluated';
  }
  return String(val).trim().toLowerCase();
}

@Component({
  selector: 'app-frequency',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './frequency.html',
  styleUrl: './frequency.css',
})
export class Frequency implements OnInit {
  protected readonly language = inject(LanguageService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly itemInventoryService = inject(ItemInventoryService);
  private readonly destroyRef = inject(DestroyRef);

  // ─── Page state ────────────────────────────────────────────────────────────
  isLoading = true;
  hasError = false;
  
  // Raw items
  allItems = signal<ItemInventoryDto[]>([]);
  
  // Search
  searchQuery = signal<string>('');

  // ─── Derived state (Groups) ────────────────────────────────────────────────
  
  readonly groups = computed<UsageGroup[]>(() => {
    const items = this.allItems();
    const query = this.searchQuery().toLowerCase().trim();
    
    // Filter by search
    const filtered = query
      ? items.filter(item => 
          (item.itemName?.toLowerCase().includes(query)) ||
          (item.categoryName?.toLowerCase().includes(query))
        )
      : items;

    // Filter out NotEvaluated
    const evaluatedItems = filtered.filter(item => {
        const k = getStatusString(item.usageStatus);
        return k && k !== 'notevaluated';
    });

    // Define base groups
    type BaseStatus = 'Frequent' | 'Occasionally' | 'Seldom' | 'Unused';
    const baseGroups: Record<BaseStatus, UsageGroup> = {
      Frequent: {
        status: 'Frequent',
        labelVi: 'Dùng thường xuyên',
        labelEn: 'Frequent',
        icon: 'rocket_launch',
        colorClass: 'emerald',
        items: []
      },
      Occasionally: {
        status: 'Occasionally',
        labelVi: 'Dùng thỉnh thoảng',
        labelEn: 'Occasionally',
        icon: 'refresh',
        colorClass: 'blue',
        items: []
      },
      Seldom: {
        status: 'Seldom',
        labelVi: 'Ít dùng',
        labelEn: 'Seldom',
        icon: 'schedule',
        colorClass: 'amber',
        items: []
      },
      Unused: {
        status: 'Unused',
        labelVi: 'Không dùng nữa',
        labelEn: 'Unused',
        icon: 'block',
        colorClass: 'rose',
        items: []
      }
    };

    // Helper to normalize status key
    const normalizeKey = (key: any) => {
      const k = getStatusString(key);
      if (!k) return 'Occasionally';
      if (k === 'frequent') return 'Frequent';
      if (k === 'seldom') return 'Seldom';
      if (k === 'unused') return 'Unused';
      return 'Occasionally';
    };

    // Distribute items
    for (const item of evaluatedItems) {
      const normalizedStatus = normalizeKey(item.usageStatus) as UsageStatusType;
      const group = baseGroups[normalizedStatus as keyof typeof baseGroups];
      if (group) {
        group.items.push(item);
      } else {
        baseGroups['Occasionally'].items.push(item);
      }
    }
    
    // Sort items inside groups by PurchaseDate desc
    for (const key of Object.keys(baseGroups)) {
      baseGroups[key as BaseStatus].items.sort((a, b) => {
        const dA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
        const dB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
        return dB - dA;
      });
    }

    return [
      baseGroups['Frequent'],
      baseGroups['Occasionally'],
      baseGroups['Seldom'],
      baseGroups['Unused']
    ];
  });
  
  readonly notEvaluatedItems = computed<ItemInventoryDto[]>(() => {
    const items = this.allItems();
    const query = this.searchQuery().toLowerCase().trim();
    
    return items.filter(item => {
      const matchSearch = !query || 
                          item.itemName?.toLowerCase().includes(query) || 
                          item.categoryName?.toLowerCase().includes(query);
      const isNotEvaluated = item.usageStatus === undefined || item.usageStatus === null || getStatusString(item.usageStatus) === 'notevaluated';
      return matchSearch && isNotEvaluated;
    }).sort((a, b) => {
      const dA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
      const dB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
      return dB - dA;
    });
  });

  readonly totalItems = computed(() => this.allItems().length);
  readonly reviewedCount = computed(() => this.allItems().filter(x => x.isReviewed).length);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.itemInventoryService
      .getUserItemInventories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.allItems.set(items || []);
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.allItems.set([]);
          this.isLoading = false;
        },
      });
  }

  formatCurrency(amount?: number | null): string {
    if (amount == null) return '0';
    return new Intl.NumberFormat(this.language.locale()).format(Math.round(amount));
  }

  formatDate(iso?: string | null): string {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString(this.language.locale());
  }

  // ─── Chart calculation for template ────────────────────────────────────────

  getUsagePercentage(status: UsageStatusType): number {
    const total = this.allItems().length;
    if (total === 0) return 0;
    const count = this.allItems().filter(i => i.usageStatus === status).length;
    return Math.round((count / total) * 100);
  }

  evaluateItem(item: ItemInventoryDto, status: UsageStatusType): void {
    const originalStatus = item.usageStatus;
    
    // Optimistic update
    this.allItems.update(items => items.map(i => 
      i.id === item.id ? { ...i, usageStatus: status, isReviewed: true } : i
    ));

    this.itemInventoryService.reviewItem(item.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          // Revert on error
          this.allItems.update(items => items.map(i => 
            i.id === item.id ? { ...i, usageStatus: originalStatus, isReviewed: item.isReviewed } : i
          ));
          this.hasError = true;
        }
      });
  }
}
