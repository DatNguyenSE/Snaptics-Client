import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';
import { AppLanguage, LanguageService } from '../../../core/services/language-service';
import { ThemeService } from '../../../core/services/theme.service';

interface AppNavItem {
  id: string;
  labelKey: string;
  icon: string;
  route?: string;
  isActionMenu?: boolean;
  children?: AppNavItem[];
}

interface AccountSummary {
  fullName: string;
  username: string;
  initials: string;
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
export class Nav {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);

  protected readonly language = inject(LanguageService);
  protected readonly theme = inject(ThemeService);
  readonly navItems: AppNavItem[] = [
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
      id: 'camera',
      labelKey: 'nav.scan', // We can use nav.scan or a general label
      icon: 'add_circle',
      isActionMenu: true,
      children: [
        {
          id: 'scan',
          labelKey: 'nav.scan',
          icon: 'receipt_long',
          route: '/user/scan',
        },
        {
          id: 'snap-item',
          labelKey: 'nav.snapItem',
          icon: 'image_search',
          route: '/user/snap-item',
        },
      ],
    },
    {
      id: 'manual-entry',
      labelKey: 'nav.manualEntry',
      icon: 'edit_square',
      route: '/user/manual-entry',
    },
    {
      id: 'reminders',
      labelKey: 'nav.reminders',
      icon: 'notifications',
      route: '/user/reminders',
    },
    {
      id: 'settings',
      labelKey: 'nav.settings',
      icon: 'settings',
      route: '/settings',
    },
  ];
  readonly languages: LanguageOption[] = [
    { code: 'vi', label: 'VI' },
    { code: 'en', label: 'EN' },
  ];

  get account(): AccountSummary {
    const currentUser = this.accountService.currentUser();
    const fullName = currentUser?.displayName?.trim() || 'Minh Nguyen';
    const email = currentUser?.email?.trim() || 'minh@gmail.com';

    return {
      fullName,
      username: this.extractUsername(email, fullName),
      initials: this.buildInitials(fullName),
    };
  }

  isAccountMenuOpen = false;
  isCameraMenuOpen = false;
  cameraMenuLeft = 0;
  accountMenuRight = 0;

  toggleAccountMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
    this.isCameraMenuOpen = false;

    if (this.isAccountMenuOpen) {
      const target = event.currentTarget as HTMLElement;
      if (target) {
        const rect = target.getBoundingClientRect();
        this.accountMenuRight = document.documentElement.clientWidth - rect.right;
      }
    }
  }

  toggleCameraMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isCameraMenuOpen = !this.isCameraMenuOpen;
    this.isAccountMenuOpen = false;
    
    if (this.isCameraMenuOpen) {
      const target = event.currentTarget as HTMLElement;
      if (target) {
        const rect = target.getBoundingClientRect();
        this.cameraMenuLeft = rect.left + rect.width / 2;
      }
    }
  }

  closeMenus(): void {
    this.isAccountMenuOpen = false;
    this.isCameraMenuOpen = false;
  }

  setLanguage(lang: AppLanguage): void {
    this.language.setLanguage(lang);
  }

  openSettings(): void {
    this.closeMenus();
    void this.router.navigateByUrl('/settings');
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
