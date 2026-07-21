import { Component, Output, EventEmitter, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';
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
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);

  searchQuery = '';
  avatarMenuOpen = false;

  get breadcrumb(): string {
    const url = this.router.url;
    if (url.includes('/overview')) return 'Overview';
    if (url.match(/\/users\/[^/]+/)) return 'User Detail';
    if (url.includes('/users')) return 'Users';
    if (url.includes('/categories')) return 'Categories';
    if (url.includes('/ai-operations')) return 'AI & Scan';
    if (url.includes('/audit-logs')) return 'Audit Logs';
    if (url.includes('/notifications')) return 'Notifications';
    if (url.includes('/settings')) return 'System Settings';
    return 'Admin';
  }

  get account() {
    const user = this.accountService.currentUser();
    const name = user?.displayName ?? 'Admin';
    const initials = name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
    const role = (user?.roles ?? []).includes('SUPER_ADMIN') ? 'Super Admin' : 'Admin';
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
