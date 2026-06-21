import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TransactionDto } from '../../../../models/transaction.dto';
import { LanguageService } from '../../../../core/services/language-service';
import { S3Service } from '../../../../core/services/s3.service';

@Component({
  selector: 'app-transaction-detail-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './transaction-detail-modal.html',
  styleUrl: './transaction-detail-modal.css'
})
export class TransactionDetailModal {
  @Input({ required: true }) transaction!: TransactionDto;
  @Output() closeModal = new EventEmitter<void>();

  protected readonly language = inject(LanguageService);
  private readonly s3Service = inject(S3Service);

  imageUrl: string | null = null;
  isLoadingImage = false;
  isImageExpanded = false;

  toggleImage(): void {
    if (this.isImageExpanded) {
      this.isImageExpanded = false;
      return;
    }

    if (this.imageUrl) {
      this.isImageExpanded = true;
      return;
    }

    if (this.transaction.imageKey) {
      this.isLoadingImage = true;
      this.isImageExpanded = true;
      this.s3Service.viewImage(this.transaction.imageKey).subscribe({
        next: (response) => {
          this.imageUrl = response.url;
          this.isLoadingImage = false;
        },
        error: (err) => {
          console.error('Failed to load image', err);
          this.isLoadingImage = false;
        }
      });
    }
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
}
