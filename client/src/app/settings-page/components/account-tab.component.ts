import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../core/services/account-service';
import { UserProfileDto } from '../../models/user-profile.dto';
import { LanguageService } from '../../core/services/language-service';
import { ToastService } from '../../core/services/toast-service';

@Component({
  selector: 'app-account-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-tab.component.html',
  styleUrl: '../settings-page.css',
})
export class AccountTabComponent {
  @Input() profile: UserProfileDto | null = null;
  @Input() isLoading = false;

  @Output() navigateTab = new EventEmitter<string>();

  private readonly accountService = inject(AccountService);
  private readonly toast = inject(ToastService);
  protected readonly language = inject(LanguageService);

  isResendingEmail = false;

  get currentUser() {
    return this.accountService.currentUser();
  }

  get userRole(): string {
    const roles = this.currentUser?.roles || [];
    if (roles.includes('ADMIN')) {
      return 'ADMIN';
    }
    return 'USER';
  }

  get userInitials(): string {
    const name = this.profile?.fullName || this.currentUser?.displayName || 'User';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  resendVerificationEmail(): void {
    const email = this.profile?.email || this.currentUser?.email;
    if (!email) {
      this.toast.error('Email không hợp lệ.');
      return;
    }

    this.isResendingEmail = true;
    this.accountService.resendOtp(email).subscribe({
      next: () => {
        this.isResendingEmail = false;
        this.toast.success('Đã gửi email xác thực thành công. Vui lòng kiểm tra hộp thư!');
      },
      error: (err) => {
        this.isResendingEmail = false;
        this.toast.error(err.message || 'Không thể gửi email xác thực. Vui lòng thử lại sau.');
      },
    });
  }

  goToTab(tabName: string): void {
    this.navigateTab.emit(tabName);
  }
}
