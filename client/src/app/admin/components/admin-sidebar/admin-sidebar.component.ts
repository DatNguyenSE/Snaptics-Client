import { Component, Input, Output, EventEmitter, inject, ElementRef, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';
import { AppLanguage, LanguageService } from '../../../core/services/language-service';
import { ThemeService } from '../../../core/services/theme.service';

interface SidebarNavItem {
  id: string;
  labelKey: string;
  icon: string;
  route: string;
  section?: 'main' | 'system';
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css',
})
export class AdminSidebarComponent {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() closeMobile = new EventEmitter<void>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);

  protected readonly language = inject(LanguageService);
  protected readonly theme = inject(ThemeService);

  isAccountMenuOpen = false;

  readonly languages: { code: AppLanguage; label: string }[] = [
    { code: 'vi', label: 'VI' },
    { code: 'en', label: 'EN' },
  ];

  readonly mainNavItems: SidebarNavItem[] = [
    { id: 'overview', labelKey: 'admin.nav.overview', icon: 'dashboard', route: '/admin/overview' },
    { id: 'users', labelKey: 'admin.nav.users', icon: 'group', route: '/admin/users' },
    { id: 'tickets', labelKey: 'admin.nav.tickets', icon: 'confirmation_number', route: '/admin/tickets' },
    { id: 'categories', labelKey: 'admin.nav.categories', icon: 'category', route: '/admin/categories' },
    { id: 'ai-operations', labelKey: 'admin.nav.aiOperations', icon: 'smart_toy', route: '/admin/ai-operations' },
    { id: 'audit-logs', labelKey: 'admin.nav.auditLogs', icon: 'fact_check', route: '/admin/audit-logs' },
  ];

  readonly systemNavItems: SidebarNavItem[] = [
    { id: 'notifications', labelKey: 'admin.nav.notifications', icon: 'notifications', route: '/admin/notifications' },
    { id: 'settings', labelKey: 'admin.nav.systemSettings', icon: 'settings', route: '/admin/settings' },
  ];

  get account() {
    const user = this.accountService.currentUser();
    const fullName = user?.displayName?.trim() || 'Mock Admin';
    const email = user?.email?.trim() || 'admin@mock.local';
    const username = email.includes('@') ? email.split('@')[0] : fullName.toLowerCase().replace(/\s+/g, '');
    const roles = user?.roles ?? [];
    const role = roles.includes('SUPER_ADMIN') ? 'Super Admin' : 'Admin';
    const initials = fullName
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .filter(Boolean)
      .slice(0, 2)
      .join('') || 'MA';

    return { fullName, email, username, role, initials };
  }

  get isSuperAdmin(): boolean {
    return (this.accountService.currentUser()?.roles ?? []).includes('SUPER_ADMIN');
  }

  toggleAccountMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  closeMenus(): void {
    this.isAccountMenuOpen = false;
  }

  setLanguage(lang: AppLanguage): void {
    this.language.setLanguage(lang);
  }

  openSettings(): void {
    this.closeMenus();
    void this.router.navigateByUrl('/admin/settings');
  }

  openUserApp(): void {
    this.closeMenus();
    void this.router.navigateByUrl('/user/dashboard');
  }

  onNavClick(): void {
    if (this.mobileOpen) {
      this.closeMobile.emit();
    }
  }

  logout(): void {
    this.closeMenus();
    this.accountService.logout('/landing');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.closeMenus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeMenus();
  }
}
