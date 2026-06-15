import { Component, inject } from '@angular/core';
import { AccountService } from '../../../core/services/account-service';
import { LanguageService } from '../../../core/services/language-service';
import {
  TRANSACTION_HISTORY,
  TransactionHistoryItem,
} from './transaction-history';

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [],
  templateUrl: './transaction.html',
  styleUrl: './transaction.css',
})
export class Transaction {
  private readonly accountService = inject(AccountService);
  protected readonly language = inject(LanguageService);

  readonly transactionHistory: TransactionHistoryItem[] = TRANSACTION_HISTORY;

  get initials(): string {
    const fullName = this.accountService.currentUser()?.displayName?.trim() || 'Minh Nguyen';
    const parts = fullName
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return 'M';
    }

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  formatCurrency(value: number): string {
    return `${new Intl.NumberFormat(this.language.locale()).format(value)}\u0111`;
  }
}
