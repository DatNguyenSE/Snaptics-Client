import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-dashboard-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-dashboard-preview.html',
  styleUrl: './landing-dashboard-preview.css'
})
export class LandingDashboardPreviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('avatarVideo', { static: false })
  private avatarVideo?: ElementRef<HTMLVideoElement>;

  @ViewChild('avatarCanvas', { static: false })
  private avatarCanvas?: ElementRef<HTMLCanvasElement>;

  private animationFrame?: number;
  private avatarRenderingStarted = false;

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
  }

  private startAvatarRendering(): void {
    if (this.avatarRenderingStarted) return;

    const video = this.avatarVideo?.nativeElement;
    const canvas = this.avatarCanvas?.nativeElement;
    const context = canvas?.getContext('2d', { willReadFrequently: true });
    if (!video || !canvas || !context) return;

    this.avatarRenderingStarted = true;

    canvas.width = 176;
    canvas.height = 176;
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
  protected readonly navItems = [
    { id: 'overview', label: 'Tổng quan', icon: 'space_dashboard', active: true },
    { id: 'wallet', label: 'Quản lý ví', icon: 'account_balance_wallet' },
    { id: 'transaction', label: 'Giao dịch', icon: 'receipt_long' },
    { id: 'analysis', label: 'Phân tích', icon: 'analytics' },
    { id: 'scan', label: 'Scan', icon: 'document_scanner', isScanItem: true },
    { id: 'notification', label: 'Thông báo', icon: 'notifications', badge: 4 },
    { id: 'frequency', label: 'Tần suất', icon: 'schedule' },
    { id: 'category', label: 'Loại danh mục', icon: 'category' },
    { id: 'support', label: 'Hỗ trợ', icon: 'support_agent' }
  ];

  protected readonly suggestions = [
    'Tháng này tôi chi bao nhiêu?',
    'Ăn uống tháng này hơn 500k',
    'Gợi ý tiết kiệm'
  ];

  protected readonly quickActions = [
    { label: 'Tài nguyên', icon: 'folder', color: '#8b5cf6' },
    { label: 'Phân tích', icon: 'analytics', color: '#a855f7' },
    { label: 'Đánh giá', icon: 'reviews', color: '#f59e0b' },
    { label: 'Quản lý', icon: 'account_balance_wallet', color: '#10b981' }
  ];

  protected readonly kpiCards = [
    {
      label: 'TỔNG CHI TIÊU',
      value: '0đ',
      subLabel: 'Tháng này',
      icon: 'pie_chart',
      colorClass: 'kpi-card--purple'
    },
    {
      label: 'GIAO DỊCH',
      value: '0',
      subLabel: 'Tháng này',
      icon: 'receipt_long',
      colorClass: 'kpi-card--blue'
    },
    {
      label: 'TOP DANH MỤC',
      value: '-',
      subLabel: 'Chi nhiều nhất',
      icon: 'category',
      colorClass: 'kpi-card--amber'
    },
    {
      label: 'NGÂN SÁCH',
      value: 'NaN%',
      subLabel: 'Đã sử dụng',
      icon: 'account_balance_wallet',
      colorClass: 'kpi-card--green'
    }
  ];
}
