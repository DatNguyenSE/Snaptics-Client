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
  private readonly language = inject(LanguageService);
  protected readonly notifications = this.notificationService.notifications;
  protected readonly unreadNotificationCount = this.notificationService.unreadCount;
  protected readonly isNotificationOpen = signal(false);

  @ViewChild('notificationShell', { static: true })
  private notificationShell?: ElementRef<HTMLElement>;

  get userName(): string {
    return this.accountService.currentUser()?.displayName?.trim() || 'bạn';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
    if (hour >= 18 && hour < 22) return 'Chào buổi tối';
    return 'Chào buổi khuya';
  }

  get funnySlogan(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Dậy sớm để thành công... nhưng đừng quên ghi chép lại chầu cà phê sáng nhé! ☕';
    if (hour >= 12 && hour < 18) return 'Nắng chiều đã ngả về tây, hôm nay ví bạn đã vơi đi nhiều chưa? ☀️';
    if (hour >= 18 && hour < 22) return 'Lên đồ đi quẩy cũng đừng quên nhiệm vụ ghi chép chi tiêu đâu nha! 💃🕺';
    return 'Khuya rồi mà vẫn thức kiểm kê tài sản à? Cố lên, sắp giàu rồi! 🦉';
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
