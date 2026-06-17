import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TransactionDto } from '../../../../models/transaction.dto';
import { LanguageService } from '../../../../core/services/language-service';

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
