import { Component, inject } from '@angular/core';
import { AccountService } from '../../../core/services/account-service';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [],
  templateUrl: './user-header.html',
  styleUrl: './user-header.css',
})
export class UserHeader {
  private readonly accountService = inject(AccountService);

  get userName(): string {
    return this.accountService.currentUser()?.displayName?.trim() || 'bạn';
  }
}
