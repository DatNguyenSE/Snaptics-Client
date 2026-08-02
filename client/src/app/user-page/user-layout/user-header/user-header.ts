import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild, inject, signal, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
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
export class UserHeader implements AfterViewInit, OnDestroy {
  private readonly accountService = inject(AccountService);
  private readonly notificationService = inject(NotificationService);
  private readonly language = inject(LanguageService);
  protected readonly notifications = this.notificationService.notifications;
  protected readonly unreadNotificationCount = this.notificationService.unreadCount;
  protected readonly isNotificationOpen = signal(false);

  @ViewChild('notificationShell', { static: true })
  private notificationShell?: ElementRef<HTMLElement>;

  @ViewChild('avatarVideo', { static: true })
  private avatarVideo?: ElementRef<HTMLVideoElement>;

  @ViewChild('avatarCanvas', { static: true })
  private avatarCanvas?: ElementRef<HTMLCanvasElement>;

  @Input() aiResponse: { title: string, subtitle: string } | null = null;
  displayTitle = '';
  displaySubtitle = '';
  isFading = false;
  isTyping = false;
  private typingTimeout: any;
  private animationFrame?: number;
  private avatarRenderingStarted = false;

  @Output() avatarClick = new EventEmitter<void>();

  onAvatarClick(): void {
    this.avatarClick.emit();
  }

  ngAfterViewInit(): void {
    const video = this.avatarVideo?.nativeElement;
    if (!video) return;

    video.muted = true;
    video.addEventListener('loadeddata', () => this.startAvatarRendering(), { once: true });
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.startAvatarRendering();
    }
    void video.play().catch(() => undefined);
  }

  ngOnDestroy(): void {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  private startAvatarRendering(): void {
    if (this.avatarRenderingStarted) return;

    const video = this.avatarVideo?.nativeElement;
    const canvas = this.avatarCanvas?.nativeElement;
    const context = canvas?.getContext('2d', { willReadFrequently: true });
    if (!video || !canvas || !context) return;

    this.avatarRenderingStarted = true;

    // Render at 4x CSS resolution so the circular crop stays smooth on mobile screens.
    canvas.width = 360;
    canvas.height = 360;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    const renderFrame = (): void => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const sourceRatio = video.videoWidth / video.videoHeight;
        const targetRatio = canvas.width / canvas.height;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = video.videoWidth;
        let sourceHeight = video.videoHeight;

        if (sourceRatio > targetRatio) {
          sourceWidth = video.videoHeight * targetRatio;
          sourceX = (video.videoWidth - sourceWidth) / 2;
        } else {
          sourceHeight = video.videoWidth / targetRatio;
          sourceY = (video.videoHeight - sourceHeight) / 2;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

        const frame = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let index = 0; index < frame.data.length; index += 4) {
          const red = frame.data[index];
          const green = frame.data[index + 1];
          const blue = frame.data[index + 2];
           const otherChannel = Math.max(red, blue);
           const greenDominance = green - otherChannel;

           // Remove the green-screen spill around the silhouette, including soft edge pixels.
           if (green > 60 && greenDominance > 3) {
             frame.data[index + 1] = Math.min(green, otherChannel + 2);
             frame.data[index + 3] = Math.max(0, 255 - (greenDominance - 3) * 85);
           }
        }
        context.putImageData(frame, 0, 0);
      }

      this.animationFrame = requestAnimationFrame(renderFrame);
    };

    renderFrame();
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
    const wasOpen = this.isNotificationOpen();
    this.isNotificationOpen.update((isOpen) => !isOpen);
    // Khi mở chuông, refresh để lấy thông báo mới nhất (bao gồm AI insight vừa tạo).
    // SignalR đã xử lý push realtime; đây là fallback đảm bảo dữ liệu đồng bộ.
    if (!wasOpen) {
      this.notificationService.loadNotifications();
    }
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
