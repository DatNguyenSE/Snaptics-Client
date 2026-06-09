import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface AccountSummary {
  fullName: string;
  username: string;
  initials: string;
}

@Component({
  selector: 'app-nav',
  imports: [],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);

  readonly activeId = 'dashboard';
  readonly navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'scan', label: 'Scan', icon: 'photo_camera' },
    { id: 'transactions', label: 'Transactions', icon: 'receipt_long' },
    { id: 'reminder', label: 'Reminders', icon: 'notifications' },
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
