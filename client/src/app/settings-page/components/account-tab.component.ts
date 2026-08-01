import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../core/services/account-service';
import { UserProfileDto } from '../../models/user-profile.dto';
import { LanguageService } from '../../core/services/language-service';
import { ToastService } from '../../core/services/toast-service';
import { S3Service } from '../../core/services/s3.service';


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
  private readonly s3Service = inject(S3Service);

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
    const name = this.profile?.displayName || this.currentUser?.displayName || 'User';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts.slice(0, 2).map((p: string) => p[0].toUpperCase()).join('');
  }

  get fullImageUrl(): string | null {
    const imgUrl = this.profile?.imageUrl;
    if (!imgUrl) return null;
    if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) return imgUrl;
    return this.s3Service.getDirectImageUrl(imgUrl);
  }

  goToTab(tabName: string): void {
    this.navigateTab.emit(tabName);
  }
}
