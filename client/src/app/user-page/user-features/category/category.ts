import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryDto } from '../../../models/category.dto';
import { LanguageService } from '../../../core/services/language-service';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class Category implements OnInit {
  public language = inject(LanguageService);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);

  categories: CategoryDto[] = [];
  isLoading = true;
  hasError = false;

  showModal = false;
  isEditing = false;
  isSaving = false;
  deletingCategoryId: number | null = null;
  currentCategory: Partial<CategoryDto> = {};

  readonly iconOptions = [
    { label: 'Ăn uống', value: 'ti ti-tools-kitchen-2' },
    { label: 'Nhà ở', value: 'ti ti-home' },
    { label: 'Di chuyển', value: 'ti ti-car' },
    { label: 'Hóa đơn', value: 'ti ti-bolt' },
    { label: 'Sức khỏe', value: 'ti ti-heartbeat' },
    { label: 'Giáo dục', value: 'ti ti-school' },
    { label: 'Mua sắm', value: 'ti ti-shopping-bag' },
    { label: 'Giải trí', value: 'ti ti-movie' },
    { label: 'Cá nhân', value: 'ti ti-spa' },
    { label: 'Du lịch', value: 'ti ti-plane' },
    { label: 'Quà tặng', value: 'ti ti-gift' },
    { label: 'Lương', value: 'ti ti-cash' },
    { label: 'Ví tiền', value: 'ti ti-wallet' },
    { label: 'Công việc', value: 'ti ti-briefcase' },
    { label: 'Khác', value: 'ti ti-help-circle' },
  ];

  readonly colorOptions = [
    '#FF5733', '#335BFF', '#33FF5B', '#FFC300', '#FF3333', '#33A8FF', '#FF33A8',
    '#A833FF', '#FF8F33', '#33FFE3', '#FF3380', '#28B463', '#9E9E9E', '#000000',
  ];

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.hasError = false;
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
        this.toastService.error(this.language.t('common.loadError') || 'Lỗi khi tải danh mục');
      }
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentCategory = {
      name: '',
      icon: 'ti ti-category',
      color: '#335BFF',
      isTrackableInventory: false,
    };
    this.showModal = true;
  }

  openEditModal(category: CategoryDto): void {
    this.isEditing = true;
    this.currentCategory = { ...category };
    this.showModal = true;
  }

  handleCardKeydown(event: KeyboardEvent, category: CategoryDto): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.openEditModal(category);
  }

  closeModal(): void {
    this.showModal = false;
    this.currentCategory = {};
  }

  saveCategory(): void {
    if (!this.currentCategory.name) {
      this.toastService.warning('Vui lòng nhập tên danh mục');
      return;
    }

    if (this.isEditing && this.currentCategory.id) {
      const id = this.currentCategory.id;
      const changes: Partial<CategoryDto> = {
        name: this.currentCategory.name,
        icon: this.currentCategory.icon,
        color: this.currentCategory.color,
        isTrackableInventory: this.currentCategory.isTrackableInventory ?? false,
      };
      this.isSaving = true;
      this.categoryService.updateCategory(id, changes).subscribe({
        next: (updatedCategory) => {
          this.toastService.success('Cập nhật danh mục thành công');
          this.closeModal();
          this.isSaving = false;
          this.categories = this.categories.map(category =>
            category.id === id ? { ...category, ...changes, ...updatedCategory } : category
          );
        },
        error: () => {
          this.isSaving = false;
          this.toastService.error('Lỗi khi cập nhật danh mục');
        }
      });
    } else {
      this.isSaving = true;
      this.categoryService.createCategory(this.currentCategory).subscribe({
        next: () => {
          this.toastService.success('Tạo danh mục thành công');
          this.closeModal();
          this.isSaving = false;
          this.loadCategories();
        },
        error: () => {
          this.isSaving = false;
          this.toastService.error('Lỗi khi tạo danh mục');
        }
      });
    }
  }

  deleteCategory(id: number, isDefault: boolean | undefined): void {
    if (isDefault) return;
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      this.deletingCategoryId = id;
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.toastService.success('Xóa danh mục thành công');
          this.deletingCategoryId = null;
          this.categories = this.categories.filter(category => category.id !== id);
        },
        error: () => {
          this.deletingCategoryId = null;
          this.toastService.error('Lỗi khi xóa danh mục');
        }
      });
    }
  }
}
