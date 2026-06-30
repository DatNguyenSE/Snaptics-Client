import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { AccountService } from '../../../core/services/account-service';
import { LanguageService } from '../../../core/services/language-service';
import { NotificationService } from '../../../core/services/notification-service';
import { UserNotificationPopover } from '../user-notification-popover/user-notification-popover';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [UserNotificationPopover],
  templateUrl: './user-header.html',
  styleUrl: './user-header.css',
})
export class UserHeader {
  private readonly accountService = inject(AccountService);
  private readonly notificationService = inject(NotificationService);
  protected readonly language = inject(LanguageService);
  protected readonly notifications = this.notificationService.notifications;
  protected readonly unreadNotificationCount = this.notificationService.unreadCount;
  protected readonly isNotificationOpen = signal(false);

  @ViewChild('notificationShell', { static: true })
  private notificationShell?: ElementRef<HTMLElement>;

  get userName(): string {
    return this.accountService.currentUser()?.displayName?.trim() || 'Minh';
  }

  get initials(): string {
    const parts = this.userName
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return 'M';
    }

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  get notificationLabel(): string {
    return this.language.currentLang() === 'vi' ? 'Thông báo' : 'Notifications';
  }

  protected toggleNotifications(): void {
    this.isNotificationOpen.update((isOpen) => !isOpen);
  }

  protected closeNotifications(): void {
    this.isNotificationOpen.set(false);
  }

  protected markNotificationAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  protected markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  @HostListener('document:click', ['$event'])
  protected handleDocumentClick(event: Event): void {
    if (!this.isNotificationOpen()) {
      return;
    }

    const target = event.target;

    if (
      target instanceof Node &&
      this.notificationShell &&
      !this.notificationShell.nativeElement.contains(target)
    ) {
      this.closeNotifications();
    }
  }

  @HostListener('document:keydown.escape')
  protected handleEscapeKey(): void {
    this.closeNotifications();
  }
}
