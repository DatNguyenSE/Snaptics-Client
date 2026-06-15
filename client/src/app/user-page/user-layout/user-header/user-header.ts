import { Component, inject } from '@angular/core';
import { AccountService } from '../../../core/services/account-service';
import { LanguageService } from '../../../core/services/language-service';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [],
  templateUrl: './user-header.html',
  styleUrl: './user-header.css',
})
export class UserHeader {
  private readonly accountService = inject(AccountService);
  protected readonly language = inject(LanguageService);

  get userName(): string {
    return this.accountService.currentUser()?.displayName?.trim() || 'Minh';
  }

  get initials(): string {
    const parts = this.userName
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
}
