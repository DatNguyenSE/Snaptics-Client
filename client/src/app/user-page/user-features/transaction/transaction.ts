import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language-service';
import {
  TRANSACTION_HISTORY,
  TransactionHistoryItem,
} from './transaction-history';
import { UserHeader } from '../../user-layout/user-header/user-header';

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [UserHeader],
  templateUrl: './transaction.html',
  styleUrl: './transaction.css',
})
export class Transaction {
  protected readonly language = inject(LanguageService);

  readonly transactionHistory: TransactionHistoryItem[] = TRANSACTION_HISTORY;

  formatCurrency(value: number): string {
    return `${new Intl.NumberFormat(this.language.locale()).format(value)}\u0111`;
  }
}
