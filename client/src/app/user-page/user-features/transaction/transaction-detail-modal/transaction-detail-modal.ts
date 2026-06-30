import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { LanguageService } from '../../../../core/services/language-service';
import { S3Service } from '../../../../core/services/s3.service';
import { TransactionDto } from '../../../../models/transaction.dto';

@Component({
  selector: 'app-transaction-detail-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './transaction-detail-modal.html',
  styleUrl: './transaction-detail-modal.css',
})
export class TransactionDetailModal implements OnChanges {
  @Input({ required: true }) transaction!: TransactionDto;
  @Output() closeModal = new EventEmitter<void>();

  protected readonly language = inject(LanguageService);
  private readonly s3Service = inject(S3Service);

  imageUrl: string | null = null;
  isLoadingImage = false;
  isImageExpanded = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['transaction']) {
      return;
    }

    this.isImageExpanded = false;
    this.isLoadingImage = false;
    this.imageUrl = this.transaction.imagePreviewUrl ?? null;
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

  onClose() {
    this.closeModal.emit();
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
}
