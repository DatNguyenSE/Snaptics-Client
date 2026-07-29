import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { CategoryDto } from '../../models/category.dto';
import { ToastService } from '../../core/services/toast-service';

@Component({
  selector: 'app-categories-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-tab.component.html',
  styleUrl: '../settings-page.css',
})
export class CategoriesTabComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);

  categories: CategoryDto[] = [];
  isLoading = false;

  // Search & Filter State
  searchQuery = '';
  typeFilter: 'ALL' | 'INCOME' | 'EXPENSE' = 'ALL';

  // Modal State for Add / Edit
  isModalOpen = false;
  isEditMode = false;
  isSaving = false;
  currentCategoryId: number | null = null;

  categoryForm = {
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    icon: 'category',
    color: '#3B82F6',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  };

  // Delete Modal State
  isDeleteModalOpen = false;
  categoryToDelete: CategoryDto | null = null;
  isDeleting = false;

  readonly availableIcons = [
    'category',
    'shopping_cart',
    'restaurant',
    'directions_car',
    'home',
    'payments',
    'flight',
    'movie',
    'medical_services',
    'school',
    'fitness_center',
    'work',
    'savings',
    'pets',
    'build',
  ];

  readonly availableColors = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#64748B', // Slate
  ];

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error(err.message || 'Không thể tải danh sách danh mục.');
      },
    });
  }

  get filteredCategories(): CategoryDto[] {
    return this.categories.filter((cat) => {
      // Filter by type
      const catStatus = (cat.status || 'EXPENSE').toUpperCase();
      if (this.typeFilter === 'INCOME' && !catStatus.includes('INCOME') && cat.name.toLowerCase().includes('thu')) {
        // Simple type matching logic
      } else if (this.typeFilter === 'EXPENSE' && cat.name.toLowerCase().includes('thu')) {
        // filter logic
      }

      // Filter search
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim();
        return cat.name.toLowerCase().includes(query);
      }
      return true;
    });
  }

  // ─── Modal Handlers ────────────────────────────────────────────────────────

  openAddModal(): void {
    this.isEditMode = false;
    this.currentCategoryId = null;
    this.categoryForm = {
      name: '',
      type: 'EXPENSE',
      icon: 'category',
      color: '#3B82F6',
      status: 'ACTIVE',
    };
    this.isModalOpen = true;
  }

  openEditModal(category: CategoryDto): void {
    this.isEditMode = true;
    this.currentCategoryId = category.id;
    this.categoryForm = {
      name: category.name,
      type: category.name.toLowerCase().includes('thu') ? 'INCOME' : 'EXPENSE',
      icon: category.icon || 'category',
      color: category.color || '#3B82F6',
      status: (category.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveCategory(): void {
    if (!this.categoryForm.name.trim()) {
      this.toast.error('Tên danh mục không được để trống.');
      return;
    }

    this.isSaving = true;

    const payload: Partial<CategoryDto> = {
      name: this.categoryForm.name.trim(),
      icon: this.categoryForm.icon,
      color: this.categoryForm.color,
      status: this.categoryForm.status,
    };

    if (this.isEditMode && this.currentCategoryId) {
      this.categoryService.updateCategory(this.currentCategoryId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeModal();
          this.toast.success('Đã cập nhật danh mục thành công!');
          this.loadCategories();
        },
        error: (err) => {
          this.isSaving = false;
          this.toast.error(err.message || 'Cập nhật danh mục thất bại.');
        },
      });
    } else {
      this.categoryService.createCategory(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeModal();
          this.toast.success('Đã thêm danh mục mới thành công!');
          this.loadCategories();
        },
        error: (err) => {
          this.isSaving = false;
          this.toast.error(err.message || 'Tạo danh mục thất bại.');
        },
      });
    }
  }

  // ─── Status Toggle Handler ──────────────────────────────────────────────────

  toggleCategoryStatus(category: CategoryDto): void {
    const newStatus = category.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    this.categoryService.updateCategory(category.id, { status: newStatus }).subscribe({
      next: () => {
        category.status = newStatus;
        this.toast.success(`Đã ${newStatus === 'ACTIVE' ? 'bật' : 'tắt'} trạng thái danh mục "${category.name}".`);
      },
      error: (err) => {
        this.toast.error(err.message || 'Không thể thay đổi trạng thái.');
      },
    });
  }

  // ─── Delete Modal Handlers ──────────────────────────────────────────────────

  openDeleteModal(category: CategoryDto, event: MouseEvent): void {
    event.stopPropagation();

    if (category.isDefault) {
      this.toast.warning('Không thể xóa danh mục mặc định của hệ thống!');
      return;
    }

    this.categoryToDelete = category;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.categoryToDelete = null;
  }

  confirmDeleteCategory(): void {
    if (!this.categoryToDelete) return;

    this.isDeleting = true;
    this.categoryService.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.toast.success(`Đã xóa danh mục "${this.categoryToDelete?.name}".`);
        this.closeDeleteModal();
        this.loadCategories();
      },
      error: (err) => {
        this.isDeleting = false;
        this.toast.error(err.message || 'Không thể xóa danh mục.');
      },
    });
  }
}
