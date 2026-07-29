import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../../core/services/language-service';
import { S3Service } from '../../../../core/services/s3.service';
import { TransactionDto } from '../../../../models/transaction.dto';
import { CategoryDto } from '../../../../models/category.dto';
import { BudgetDto } from '../../../../core/services/budget.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { ToastService } from '../../../../core/services/toast-service';

@Component({
  selector: 'app-transaction-detail-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './transaction-detail-modal.html',
  styleUrl: './transaction-detail-modal.css',
})
export class TransactionDetailModal implements OnChanges {
  @Input({ required: true }) transaction!: TransactionDto;
  @Input() categories: CategoryDto[] = [];
  @Input() budgets: BudgetDto[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() editTransaction = new EventEmitter<TransactionDto>();
  @Output() deleteTransaction = new EventEmitter<TransactionDto>();
  @Output() transactionUpdated = new EventEmitter<TransactionDto>();

  protected readonly language = inject(LanguageService);
  private readonly s3Service = inject(S3Service);
  private readonly transactionService = inject(TransactionService);
  private readonly toast = inject(ToastService);

  imageUrl: string | null = null;
  isLoadingImage = false;
  isImageExpanded = false;
  isEditing = false;
  isSaving = false;
  draftTransaction: TransactionDto | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['transaction']) {
      return;
    }

    this.isImageExpanded = false;
    this.isLoadingImage = false;
    this.imageUrl = this.transaction.imagePreviewUrl ?? null;

    if (this.hasImage() && typeof window !== 'undefined' && window.innerWidth >= 768) {
      this.toggleImage();
    }
  }

  toggleImage(): void {
    if (this.isImageExpanded) {
      this.isImageExpanded = false;
      return;
    }

    if (this.imageUrl) {
      this.isImageExpanded = true;
      return;
    }

    if (!this.transaction.imageKey) {
      return;
    }

    this.isLoadingImage = true;
    this.isImageExpanded = true;

    this.s3Service.viewImage(this.transaction.imageKey).subscribe({
      next: (response) => {
        this.imageUrl = response.url;
        this.isLoadingImage = false;
      },
      error: () => {
        this.isLoadingImage = false;
      },
    });
  }

  hasImage(): boolean {
    return !!(this.transaction.imagePreviewUrl || this.transaction.imageKey);
  }

  get imageToggleLabel(): string {
    return this.isImageExpanded
      ? this.language.t('transaction.hideImage')
      : this.language.t('transaction.viewImage');
  }

  formatCurrency(value: number): string {
    return `${new Intl.NumberFormat(this.language.locale()).format(value)}\u0111`;
  }

  formatDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(this.language.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }

  onClose() {
    this.closeModal.emit();
  }

  onEdit() {
    this.draftTransaction = JSON.parse(JSON.stringify(this.transaction)) as TransactionDto;
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.draftTransaction = null;
  }

  recalculateTotal(): void {
    if (this.draftTransaction && this.draftTransaction.transactionDetails && this.draftTransaction.transactionDetails.length > 0) {
      let total = 0;
      for (const item of this.draftTransaction.transactionDetails) {
        if (!item.isDeleted) {
          total += (item.price || 0) * (item.quantity || 1);
        }
      }
      this.draftTransaction.totalAmount = total;
    }
  }

  saveEdit(): void {
    if (!this.draftTransaction || !this.draftTransaction.name?.trim()) return;

    this.isSaving = true;
    this.transactionService.updateTransaction(this.transaction.id, this.draftTransaction).subscribe({
      next: (updatedTransaction) => {
        this.transaction = updatedTransaction;
        this.isEditing = false;
        this.draftTransaction = null;
        this.isSaving = false;
        this.transactionUpdated.emit(updatedTransaction);
        this.toast.success('Đã cập nhật giao dịch');
      },
      error: () => {
        this.isSaving = false;
        this.toast.error('Không thể cập nhật giao dịch');
      },
    });
  }

  onDelete() {
    if (confirm(this.language.t('transaction.confirmDelete') || 'Bạn có chắc chắn muốn xóa giao dịch này?')) {
      this.transactionService.deleteTransaction(this.transaction.id).subscribe({
        next: () => {
          this.toast.success(this.language.t('Đã xóa giao dịch') || 'Đã xóa giao dịch');
          this.closeModal.emit();
        },
        error: () => {
          this.toast.error(this.language.t('Không thể xóa giao dịch') || 'Không thể xóa giao dịch');
        }
      });
    }
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  getCategoryLabel(name: string | null | undefined): string {
    if (!name) {
      return this.language.t('dashboard.category.other');
    }

    const normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const key = `dashboard.category.${normalizedName}`;
    const translated = this.language.t(key);

    return translated === key ? name : translated;
  }

  getPaymentMethodLabel(name: string | null | undefined): string {
    if (!name) {
      return '';
    }

    const normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const key = `entryForm.paymentMethod.${normalizedName}`;
    const translated = this.language.t(key);

    return translated === key ? name : translated;
  }

  getCategoryLabelForItem(categoryId: number, categoryName?: string | null): string {
    if (categoryName) return this.getCategoryLabel(categoryName);
    const category = this.categories.find((item) => item.id === Number(categoryId));
    return category ? this.getCategoryLabel(category.name) : this.language.t('dashboard.category.other');
  }

  getBudgetName(budgetId?: number | null): string {
    if (!budgetId) return 'Ví cá nhân';
    return this.budgets.find((budget) => budget.id === budgetId)?.name || 'Ví dùng chung';
  }

  getStatusLabel(status: number): string {
    if (status === 0) return this.language.t('transaction.statusPending');
    if (status === 2) return this.language.t('transaction.statusFailed');
    if (status === 3) return this.language.t('transaction.statusCancelled');
    return this.language.t('transaction.statusCompleted');
  }

  getStatusClass(status: number): string {
    if (status === 0) return 'modal-status-badge--pending';
    if (status === 2) return 'modal-status-badge--failed';
    if (status === 3) return 'modal-status-badge--cancelled';
    return 'modal-status-badge--completed';
  }

  getDatetimeLocal(isoDate?: string | null): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    // Format to YYYY-MM-DDThh:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  onDatetimeChange(localString: string): void {
    if (!this.draftTransaction) return;
    if (!localString) return;
    const date = new Date(localString);
    if (!isNaN(date.getTime())) {
      this.draftTransaction.transactionDate = date.toISOString();
    }
  }
}
