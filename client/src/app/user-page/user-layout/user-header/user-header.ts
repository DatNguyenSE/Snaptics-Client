import { Component, ElementRef, HostListener, ViewChild, inject, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
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

  @Input() aiResponse: { title: string, subtitle: string } | null = null;
  displayTitle = '';
  displaySubtitle = '';
  isFading = false;
  isTyping = false;
  private typingTimeout: any;

  @Output() avatarClick = new EventEmitter<void>();

  onAvatarClick(): void {
    this.avatarClick.emit();
  }

  ngOnInit(): void {
    this.displayTitle = `${this.greeting}, ${this.userName}!`;
    this.displaySubtitle = this.funnySlogan;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aiResponse']) {
      const response = changes['aiResponse'].currentValue;
      if (!changes['aiResponse'].firstChange) {
        this.isFading = true;
        setTimeout(() => {
          this.applyContent(response);
          this.isFading = false;
        }, 150);
      } else {
        this.applyContent(response);
      }
    }
  }

  private applyContent(response: { title: string, subtitle: string } | null): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    if (response) {
      this.displayTitle = response.title;
      this.displaySubtitle = '';
      this.isTyping = true;
      this.typeText(this.formatAiResponse(response.subtitle), 0);
    } else {
      this.isTyping = false;
      this.displayTitle = `${this.greeting}, ${this.userName}!`;
      this.displaySubtitle = this.funnySlogan;
    }
  }

  private formatAiResponse(text: string): string {
    return text
      .replace(/\s+(?=\d+\.\s)/g, '\n')
      .replace(/:\s+-\s+/g, ':\n• ')
      .replace(/\s+-\s+(?=[A-ZÀ-Ỹ])/g, '\n• ')
      .trim();
  }

  private typeText(text: string, index: number): void {
    if (index < text.length) {
      this.displaySubtitle += text.charAt(index);
      this.typingTimeout = setTimeout(() => {
        this.typeText(text, index + 1);
      }, 15); // Faster 15ms per character
    } else {
      this.isTyping = false;
    }
  }

  get userName(): string {
    return this.accountService.currentUser()?.displayName?.trim() || 'bạn';
  }

  get greeting(): string {
    const isEn = this.language.currentLang() === 'en';
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return isEn ? 'Good morning' : 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) return isEn ? 'Good afternoon' : 'Chào buổi chiều';
    if (hour >= 18 && hour < 22) return isEn ? 'Good evening' : 'Chào buổi tối';
    return isEn ? 'Good night' : 'Chào buổi khuya';
  }

  get funnySlogan(): string {
    const isEn = this.language.currentLang() === 'en';
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return isEn
        ? "Early bird gets the worm... but don't forget to track your morning coffee! ☕"
        : 'Dậy sớm để thành công... nhưng đừng quên ghi chép lại chầu cà phê sáng nhé! ☕';
    }
    if (hour >= 12 && hour < 18) {
      return isEn
        ? 'The afternoon sun is setting, has your wallet emptied much today? ☀️'
        : 'Nắng chiều đã ngả về tây, hôm nay ví bạn đã vơi đi nhiều chưa? ☀️';
    }
    if (hour >= 18 && hour < 22) {
      return isEn
        ? "Dressing up for a night out? Don't forget to record your spending! 💃🕺"
        : 'Lên đồ đi quẩy cũng đừng quên nhiệm vụ ghi chép chi tiêu đâu nha! 💃🕺';
    }
    return isEn
      ? "Still awake counting your assets? Keep it up, you're getting rich! 🦉"
      : 'Khuya rồi mà vẫn thức kiểm kê tài sản à? Cố lên, sắp giàu rồi! 🦉';
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
