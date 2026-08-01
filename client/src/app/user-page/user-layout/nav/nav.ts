import { Component, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';
import { AppLanguage, LanguageService } from '../../../core/services/language-service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification-service';
import { S3Service } from '../../../core/services/s3.service';
import { UserProfileService } from '../../../core/services/user-profile.service';

interface AppNavItem {
  id: string;
  labelKey: string;
  icon: string;
  route: string;
  isScanItem?: boolean;
}

interface AccountSummary {
  fullName: string;
  username: string;
  initials: string;
  avatarUrl?: string | null;
}

interface LanguageOption {
  code: AppLanguage;
  label: string;
}

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav implements OnInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly notificationService = inject(NotificationService);
  private readonly s3Service = inject(S3Service);
  private readonly userProfileService = inject(UserProfileService);
  private readonly userProfileImageUrl = signal<string | null>(null);

  ngOnInit(): void {
    if (this.accountService.currentUser()) {
      this.userProfileService.getProfile().subscribe({
        next: (profile) => {
          if (profile && profile.imageUrl) {
            this.userProfileImageUrl.set(profile.imageUrl);
          }
        },
        error: (err) => console.error('Error fetching profile in nav:', err)
      });
    }
  }

  protected readonly language = inject(LanguageService);
  protected readonly theme = inject(ThemeService);
  protected readonly unreadNotificationCount = this.notificationService.unreadCount;

  readonly navItems: AppNavItem[] = [
    {
      id: 'dashboard',
      labelKey: 'nav.dashboard',
      icon: 'dashboard',
      route: '/user/dashboard',
    },
    {
      id: 'budget',
      labelKey: 'nav.budget',
      icon: 'account_balance_wallet',
      route: '/user/budget',
    },
    {
      id: 'transactions',
      labelKey: 'nav.transactions',
      icon: 'receipt_long',
      route: '/user/transactions',
    },
    {
      id: 'category',
      labelKey: 'nav.category',
      icon: 'category',
      route: '/user/category',
    },
    {
      id: 'analysis',
      labelKey: 'nav.analysis',
      icon: 'analytics',
      route: '/user/analysis',
    },
    {
      id: 'scan',
      labelKey: 'nav.scan',
      icon: 'qr_code_scanner',
      route: '/user/scan',
      isScanItem: true,
    },
    {
      id: 'notification',
      labelKey: 'nav.notifications',
      icon: 'notifications',
      route: '/user/notification',
    },
    {
      id: 'frequency',
      labelKey: 'nav.frequency',
      icon: 'speed',
      route: '/user/frequency',
    },
    {
      id: 'support',
      labelKey: 'nav.support',
      icon: 'headset_mic',
      route: '/user/support',
    },
  ];

  // Mobile bottom navigation: chỉ 5 mục, không cuộn ngang
  readonly mobileNavItems: AppNavItem[] = [
    {
      id: 'dashboard',
      labelKey: 'nav.dashboard',
      icon: 'dashboard',
      route: '/user/dashboard',
    },
    {
      id: 'transactions',
      labelKey: 'nav.transactions',
      icon: 'receipt_long',
      route: '/user/transactions',
    },
    {
      id: 'scan',
      labelKey: 'nav.scan',
      icon: 'qr_code_scanner',
      route: '/user/scan',
      isScanItem: true,
    },
    {
      id: 'notification',
      labelKey: 'nav.notifications',
      icon: 'notifications',
      route: '/user/notification',
    },
    {
      id: 'settings',
      labelKey: 'nav.account',
      icon: 'account_circle',
      route: '/user/settings',
    },
  ];

  readonly languages: LanguageOption[] = [
    { code: 'vi', label: 'VI' },
    { code: 'en', label: 'EN' },
  ];

  get account(): AccountSummary {
    const currentUser = this.accountService.currentUser();
    const fullName = currentUser?.displayName?.trim() || 'Người dùng mới';
    const email = currentUser?.email?.trim() || 'nguoidungmoi@gmail.com';
    let avatarUrl = this.userProfileImageUrl() || currentUser?.imageUrl || null;
    
    if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
      avatarUrl = this.s3Service.getDirectImageUrl(avatarUrl);
    }

    return {
      fullName,
      username: this.extractUsername(email, fullName),
      initials: this.buildInitials(fullName),
      avatarUrl
    };
  }

  isAccountMenuOpen = false;
  accountMenuRight = 0;

  toggleAccountMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isAccountMenuOpen = !this.isAccountMenuOpen;

    if (this.isAccountMenuOpen) {
      const target = event.currentTarget as HTMLElement;
      if (target) {
        const rect = target.getBoundingClientRect();
        this.accountMenuRight = document.documentElement.clientWidth - rect.right;
      }
    }
  }

  closeMenus(): void {
    this.isAccountMenuOpen = false;
  }

  get isAdmin(): boolean {
    const roles = this.accountService.currentUser()?.roles ?? [];
    return roles.includes('ADMIN');
  }

  openAdminConsole(): void {
    this.closeMenus();
    void this.router.navigateByUrl('/admin');
  }

  setLanguage(lang: AppLanguage): void {
    this.language.setLanguage(lang);
  }

  openSettings(): void {
    this.closeMenus();
    void this.router.navigateByUrl('/user/settings');
  }

  handleMobileAccountClick(event: MouseEvent): void {
    event.stopPropagation();
    // Account button now opens the account menu (language, theme, logout)
    // Navigation to settings is handled by the dedicated settings link
    this.toggleAccountMenu(event);
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

  private buildInitials(fullName: string): string {
    const parts = fullName
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return 'U';
    }

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private extractUsername(email: string, fullName: string): string {
    if (email.includes('@')) {
      return email.split('@')[0];
    }

    return fullName.toLowerCase().replace(/\s+/g, '');
  }

}
