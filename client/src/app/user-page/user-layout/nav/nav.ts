import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';
import { AppLanguage, LanguageService } from '../../../core/services/language-service';

interface AppNavItem {
  id: string;
  labelKey: string;
  icon: string;
  route?: string;
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

  readonly navItems: AppNavItem[] = [
    {
      id: 'dashboard',
      labelKey: 'nav.dashboard',
      icon: 'dashboard',
      route: '/user/dashboard',
    },
    {
      id: 'scan',
      labelKey: 'nav.scan',
      icon: 'photo_camera',
    },
    {
      id: 'transactions',
      labelKey: 'nav.transactions',
      icon: 'receipt_long',
      route: '/user/transactions',
    },
    {
      id: 'reminders',
      labelKey: 'nav.reminders',
      icon: 'notifications',
    },
  ];
  readonly languages: LanguageOption[] = [
    { code: 'vi', label: 'VI' },
    { code: 'en', label: 'EN' },
  ];
  readonly account: AccountSummary = {
    fullName: 'Minh Truong Tran Anh',
    username: 'minhtruong',
    initials: 'MT',
  };

  isAccountMenuOpen = false;

  toggleAccountMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  closeAccountMenu(): void {
    this.isAccountMenuOpen = false;
  }

  setLanguage(lang: AppLanguage): void {
    this.language.setLanguage(lang);
  }

  openSettings(): void {
    this.closeAccountMenu();
    void this.router.navigateByUrl('/settings');
  }

  logout(): void {
    this.closeAccountMenu();
    this.accountService.logout('/dang-nhap');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;

    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.closeAccountMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeAccountMenu();
  }
}
