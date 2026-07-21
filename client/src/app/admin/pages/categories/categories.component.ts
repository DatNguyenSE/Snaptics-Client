import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminCategoryService } from '../../services/admin-category.service';
import { AdminCategory, CategoryType } from '../../models/admin.models';
import { StatusBadgeComponent, BadgeVariant } from '../../components/status-badge/status-badge.component';
import { ConfirmationModalComponent, ConfirmModalConfig } from '../../components/confirmation-modal/confirmation-modal.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';
import { AdminDrawerComponent } from '../../components/admin-drawer/admin-drawer.component';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, ConfirmationModalComponent, EmptyStateComponent, LoadingSkeletonComponent, AdminDrawerComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private readonly categoryService = inject(AdminCategoryService);
  private readonly toast = inject(ToastService);
  private subs: Subscription[] = [];

  loading = true;
  categories: AdminCategory[] = [];
  searchQuery = '';
  typeFilter: CategoryType | '' = '';

  drawerOpen = false;
  editingCategory: AdminCategory | null = null;
  formData: Partial<AdminCategory> = {};

  confirmModal: { open: boolean; config: ConfirmModalConfig; action?: () => void; loading: boolean } = {
    open: false, config: { title: '', description: '' }, loading: false,
  };

  readonly typeOptions: { value: CategoryType | ''; label: string }[] = [
    { value: '', label: 'All Types' },
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
    { value: 'both', label: 'Both' },
  ];

  readonly iconOptions = [
    'restaurant', 'directions_car', 'shopping_bag', 'sports_esports',
    'receipt', 'local_hospital', 'school', 'home', 'account_balance_wallet',
    'work', 'savings', 'trending_up', 'more_horiz', 'fitness_center',
    'flight', 'devices', 'pets', 'coffee', 'music_note',
  ];

  get filtered(): AdminCategory[] {
    let data = this.categories;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      data = data.filter((c) => c.nameVi.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q));
    }
    if (this.typeFilter) data = data.filter((c) => c.type === this.typeFilter);
    return data;
  }

  get totalCats(): number { return this.categories.length; }
  get expenseCats(): number { return this.categories.filter((c) => c.type === 'expense').length; }
  get incomeCats(): number { return this.categories.filter((c) => c.type === 'income').length; }
  get inactiveCats(): number { return this.categories.filter((c) => !c.isActive).length; }

  ngOnInit(): void {
    const sub = this.categoryService.getCategories().subscribe((cats) => {
      this.categories = cats;
      this.loading = false;
    });
    this.subs.push(sub);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  openAddDrawer(): void {
    this.editingCategory = null;
    this.formData = {
      nameVi: '', nameEn: '', type: 'expense', icon: 'more_horiz',
      description: '', displayOrder: this.categories.length + 1,
      isDefault: false, isActive: true,
    };
    this.drawerOpen = true;
  }

  openEditDrawer(cat: AdminCategory): void {
    this.editingCategory = cat;
    this.formData = { ...cat };
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.editingCategory = null;
  }

  saveCategory(): void {
    if (!this.formData.nameVi || !this.formData.nameEn) {
      this.toast.error('Please fill in all required fields.');
      return;
    }
    if (this.editingCategory) {
      this.categoryService.updateCategory(this.editingCategory.id, this.formData, 'Admin edited category');
      this.toast.success('Category updated.');
    } else {
      this.categoryService.createCategory(this.formData as Omit<AdminCategory, 'id' | 'usageCount' | 'updatedAt'>);
      this.toast.success('Category created.');
    }
    const sub = this.categoryService.getCategories().subscribe((cats) => { this.categories = cats; });
    this.subs.push(sub);
    this.closeDrawer();
  }

  openToggleConfirm(cat: AdminCategory): void {
    this.confirmModal = {
      open: true, loading: false,
      config: {
        title: cat.isActive ? 'Disable Category' : 'Enable Category',
        description: cat.isActive ? 'Users will no longer see this category.' : 'This category will be visible to users.',
        targetName: cat.nameVi,
        confirmLabel: cat.isActive ? 'Disable' : 'Enable',
        isDangerous: cat.isActive,
        requireReason: true,
      },
      action: () => {
        this.categoryService.toggleStatus(cat.id);
        const sub = this.categoryService.getCategories().subscribe((cats) => { this.categories = cats; });
        this.subs.push(sub);
        this.toast.success(`Category ${cat.isActive ? 'disabled' : 'enabled'}.`);
      },
    };
  }

  onModalConfirm(event: { reason: string }): void {
    this.confirmModal.loading = true;
    setTimeout(() => {
      if (this.confirmModal.action) this.confirmModal.action();
      this.confirmModal = { ...this.confirmModal, open: false, loading: false };
    }, 600);
  }

  onModalCancel(): void {
    this.confirmModal = { ...this.confirmModal, open: false };
  }

  getStatusVariant(active: boolean): BadgeVariant {
    return active ? 'active' : 'deleted';
  }

  getTypeVariant(type: CategoryType): BadgeVariant {
    if (type === 'expense') return 'failed';
    if (type === 'income') return 'success';
    return 'pending';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN');
  }

  trackById(_: number, item: AdminCategory): string {
    return item.id;
  }
}
