import { Component, Output, EventEmitter, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';
import { LanguageService } from '../../../core/services/language-service';
import { ThemeService } from '../../../core/services/theme.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css',
})
export class AdminHeaderComponent {
  @Output() openMobileMenu = new EventEmitter<void>();

  protected readonly theme = inject(ThemeService);
  protected readonly language = inject(LanguageService);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);

  searchQuery = '';
  avatarMenuOpen = false;

  get breadcrumb(): string {
    const url = this.router.url;
    if (url.includes('/overview')) return this.language.t('admin.nav.overview');
    if (url.match(/\/users\/[^/]+/)) return this.language.currentLang() === 'vi' ? 'Chi tiết người dùng' : 'User Detail';
    if (url.includes('/users')) return this.language.t('admin.nav.users');
    if (url.includes('/categories')) return this.language.t('admin.nav.categories');
    if (url.includes('/ai-operations')) return this.language.t('admin.nav.aiOperations');
    if (url.includes('/audit-logs')) return this.language.t('admin.nav.auditLogs');
    if (url.includes('/notifications')) return this.language.t('admin.nav.notifications');
    if (url.includes('/settings')) return this.language.t('admin.nav.systemSettings');
    return 'Admin';
  }

  get account() {
    const user = this.accountService.currentUser();
    const name = user?.displayName ?? 'Admin';
    const initials = name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
    const role = 'Admin';
    return { name, initials, role };
  }

  toggleAvatarMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.avatarMenuOpen = !this.avatarMenuOpen;
  }

  closeAvatarMenu(): void {
    this.avatarMenuOpen = false;
  }

  logout(): void {
    this.closeAvatarMenu();
    this.accountService.logout('/landing');
  }

  goToUserDashboard(): void {
    this.closeAvatarMenu();
    void this.router.navigateByUrl('/user/dashboard');
  }
}
