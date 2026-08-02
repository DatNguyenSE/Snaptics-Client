import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LanguageService } from '../../../core/services/language-service';
import { NotificationService } from '../../../core/services/notification-service';
import { ToastService } from '../../../core/services/toast-service';
import { NotificationItem, NotificationType } from '../../../models/notification-item';
import { UserHeader } from '../../user-layout/user-header/user-header';
import { BudgetMemberService } from '../../../core/services/budgetMember.service';
import { ItemInventoryService, UsageStatusType } from '../../../core/services/item-inventory.service';
import { take } from 'rxjs';
import { TransactionService } from '../../../core/services/transaction.service';
import { AiService } from '../../../core/services/ai.service';
import { environment } from '../../../environments/environment';

export type NotificationFilterTab =
  | 'all'
  | 'unread'
  | 'wallet_invitation'
  | 'product_review'
  | 'wallet_activity'
  | 'system';

export type TimeFilter = 'all' | 'today' | '7days' | '30days';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, FormsModule, UserHeader],
  templateUrl: './notification.html',
  styleUrl: './notification.css',
})
export class Notification {
  protected readonly language = inject(LanguageService);
  protected readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly budgetMemberService = inject(BudgetMemberService);
  private readonly itemInventoryService = inject(ItemInventoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly aiService = inject(AiService);
  private _insightPending = false;

  // States
  readonly activeTab = signal<NotificationFilterTab>('unread');
  readonly timeFilter = signal<TimeFilter>('all');
  readonly isLoading = this.notificationService.isLoading;
  readonly hasError = this.notificationService.hasError;
  readonly isInfiniteLoading = signal<boolean>(false);
  readonly openMenuId = signal<string | null>(null);

  // Modals state
  readonly isSettingsOpen = signal<boolean>(false);
  readonly itemToDelete = signal<NotificationItem | null>(null);
  readonly itemToReview = signal<NotificationItem | null>(null);
  readonly reviewRating = signal<number>(5);
  readonly reviewComment = signal<string>('');
  readonly selectedUsageStatus = signal<UsageStatusType>('Occasionally');
  readonly isSubmittingReview = signal<boolean>(false);
  readonly transactionImage = signal<string | null>(null);

  // Settings form values
  settingsForm = {
    emailNotif: true,
    pushNotif: true,
    walletInviteNotif: true,
    walletActivityNotif: true,
    reviewNotif: true,
    systemNotif: true,
    soundEnabled: true,
  };

  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;

  // Filtered Notifications list based on tab & time
  readonly filteredNotifications = computed(() => {
    let items = this.notifications();
    const tab = this.activeTab();
    const time = this.timeFilter();

    // 1. Filter by Tab
    if (tab === 'unread') {
      items = items.filter((n) => !n.isRead);
    } else if (tab !== 'all') {
      items = items.filter((n) => n.type === tab);
    }

    // 2. Filter by Time Range
    if (time !== 'all') {
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      items = items.filter((n) => {
        if (!n.createdAt) return true;
        const itemTime = new Date(n.createdAt).getTime();
        const diffDays = (now - itemTime) / oneDay;
        if (time === 'today') return diffDays <= 1;
        if (time === '7days') return diffDays <= 7;
        if (time === '30days') return diffDays <= 30;
        return true;
      });
    }

    return items;
  });

  // Tab Item Counts for badges
  getTabCount(tab: NotificationFilterTab): number {
    const items = this.notifications();
    if (tab === 'all') return items.length;
    if (tab === 'unread') return items.filter((n) => !n.isRead).length;
    return items.filter((n) => n.type === tab).length;
  }

  setTab(tab: NotificationFilterTab): void {
    this.activeTab.set(tab);
    this.closeAllMenus();
  }

  setTimeFilter(time: TimeFilter): void {
    this.timeFilter.set(time);
    this.closeAllMenus();
  }

  // Item Options Menu (3 Dots)
  toggleMenu(id: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.openMenuId() === id) {
      this.openMenuId.set(null);
    } else {
      this.openMenuId.set(id);
    }
  }

  closeAllMenus(): void {
    this.openMenuId.set(null);
  }

  // Card click handler
  onItemClick(item: NotificationItem): void {
    if (!item.isRead) {
      this.notificationService.markAsRead(item.id);
    }
    this.closeAllMenus();

    // Navigation depending on type & entity
    if (item.relatedEntityType === 'wallet') {
      void this.router.navigateByUrl('/user/budget');
    } else if (item.relatedEntityType === 'transaction') {
      void this.router.navigateByUrl('/user/transactions');
    }
  }

  // Mark single item read / unread
  markAsRead(item: NotificationItem, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.notificationService.markAsRead(item.id);
    this.closeAllMenus();
    this.toast.info(this.language.currentLang() === 'vi' ? 'Đã đánh dấu là đã đọc' : 'Marked as read');
  }

  markAsUnread(item: NotificationItem, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAsUnread(item.id);
    this.closeAllMenus();
    this.toast.info(this.language.currentLang() === 'vi' ? 'Đã đánh dấu là chưa đọc' : 'Marked as unread');
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
    this.toast.success(
      this.language.currentLang() === 'vi'
        ? 'Đã đánh dấu tất cả thông báo là đã đọc'
        : 'All notifications marked as read',
    );
  }

  // Delete notification flow
  promptDelete(item: NotificationItem, event: MouseEvent): void {
    event.stopPropagation();
    this.itemToDelete.set(item);
    this.closeAllMenus();
  }

  confirmDelete(): void {
    const item = this.itemToDelete();
    if (item) {
      this.notificationService.deleteNotification(item.id);
      this.toast.success(
        this.language.currentLang() === 'vi' ? 'Đã xóa thông báo' : 'Notification deleted',
      );
      this.itemToDelete.set(null);
    }
  }

  cancelDelete(): void {
    this.itemToDelete.set(null);
  }

  // Actions: Wallet Invitation
  acceptInvitation(item: NotificationItem, event: MouseEvent): void {
    event.stopPropagation();
    const invitationId = Number(item.metadata?.['relatedId']);
    if (invitationId && !isNaN(invitationId)) {
      this.budgetMemberService.respondToInvitation(invitationId, { status: 1 }).subscribe({
        next: () => {
          this.notificationService.respondToInvitation(item.id, true);
          const walletName = item.metadata?.walletName || 'Ví';
          this.toast.success(
            this.language.currentLang() === 'vi'
              ? `Bạn đã chấp nhận lời mời tham gia ${walletName}`
              : `Accepted invitation to join ${walletName}`,
          );
        },
        error: () => {
          this.toast.error(
            this.language.currentLang() === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'
          );
        }
      });
    } else {
      this.toast.error(
        this.language.currentLang() === 'vi' 
          ? 'Không tìm thấy ID thư mời. Vui lòng tạo thư mời mới.' 
          : 'Invitation ID not found. Please create a new invitation.'
      );
    }
  }

  rejectInvitation(item: NotificationItem, event: MouseEvent): void {
    event.stopPropagation();
    const invitationId = Number(item.metadata?.['relatedId']);
    if (invitationId && !isNaN(invitationId)) {
      this.budgetMemberService.respondToInvitation(invitationId, { status: 2 }).subscribe({
        next: () => {
          this.notificationService.respondToInvitation(item.id, false);
          const walletName = item.metadata?.walletName || 'Ví';
          this.toast.info(
            this.language.currentLang() === 'vi'
              ? `Bạn đã từ chối lời mời tham gia ${walletName}`
              : `Declined invitation to join ${walletName}`,
          );
        },
        error: () => {
          this.toast.error(
            this.language.currentLang() === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'
          );
        }
      });
    } else {
      this.toast.error(
        this.language.currentLang() === 'vi' 
          ? 'Không tìm thấy ID thư mời. Vui lòng tạo thư mời mới.' 
          : 'Invitation ID not found. Please create a new invitation.'
      );
    }
  }

  // Actions: Product Review Modal
  openReviewModal(item: NotificationItem, event: MouseEvent): void {
    event.stopPropagation();
    this.itemToReview.set(item);
    this.reviewRating.set(5);
    this.reviewComment.set('');
    this.selectedUsageStatus.set('Occasionally');
    this.transactionImage.set(null);
    this.closeAllMenus();

    const transactionDetailId = item.metadata?.['transactionDetailId'];
    const itemInventoryId = item.metadata?.['itemInventoryId'];

    if (transactionDetailId) {
      this.fetchTransactionImage(transactionDetailId);
    } else if (itemInventoryId) {
      this.itemInventoryService.getUserItemInventories().pipe(take(1)).subscribe(inventories => {
        const inv = inventories.find(i => i.id == itemInventoryId);
        if (inv && inv.transactionDetailId) {
          this.fetchTransactionImage(inv.transactionDetailId);
        }
      });
    }
  }

  private fetchTransactionImage(transactionDetailId: number | string): void {
    const detailIdNum = Number(transactionDetailId);
    this.transactionService.getTransactions().pipe(take(1)).subscribe(transactions => {
      const tx = transactions.find(t => 
        t.transactionDetails && t.transactionDetails.some(td => td.id === detailIdNum)
      );
      if (tx && tx.imagePreviewUrl) {
        this.transactionImage.set(tx.imagePreviewUrl);
      }
    });
  }

  setRating(star: number): void {
    this.reviewRating.set(star);
  }

  setUsageStatus(status: UsageStatusType): void {
    this.selectedUsageStatus.set(status);
  }

  getUsageStatusOptions(): { value: UsageStatusType; labelVi: string; labelEn: string; icon: string; color: string }[] {
    return [
      { value: 'Frequent',     labelVi: 'Dùng thường xuyên', labelEn: 'Use Frequently',  icon: 'rocket_launch', color: 'emerald' },
      { value: 'Occasionally', labelVi: 'Dùng thỉnh thoảng', labelEn: 'Use Occasionally', icon: 'refresh',       color: 'blue'    },
      { value: 'Seldom',       labelVi: 'Ít dùng',           labelEn: 'Seldom Used',      icon: 'schedule',      color: 'amber'   },
      { value: 'Unused',       labelVi: 'Không dùng nữa',   labelEn: 'No Longer Used',   icon: 'block',         color: 'rose'    },
    ];
  }

  getReviewStatusClass(item: NotificationItem): string {
    const status = this.getReviewStatus(item);
    return status ? `review-status--${status.toLowerCase()}` : '';
  }

  getReviewStatusIcon(item: NotificationItem): string {
    switch (this.getReviewStatus(item)) {
      case 'Frequent': return 'rocket_launch';
      case 'Occasionally': return 'refresh';
      case 'Seldom': return 'schedule';
      case 'Unused': return 'block';
      default: return 'verified';
    }
  }

  private getReviewStatus(item: NotificationItem): UsageStatusType | null {
    const rawStatus = String(item.metadata?.['usageStatus'] || item.metadata?.['usageStatusLabel'] || '').toLowerCase();
    if (rawStatus.includes('frequent') || rawStatus.includes('thường xuyên')) return 'Frequent';
    if (rawStatus.includes('occasionally') || rawStatus.includes('thỉnh thoảng')) return 'Occasionally';
    if (rawStatus.includes('seldom') || rawStatus.includes('ít dùng')) return 'Seldom';
    if (rawStatus.includes('unused') || rawStatus.includes('không dùng')) return 'Unused';
    return null;
  }

  submitReview(): void {
    const item = this.itemToReview();
    if (!item) return;

    const itemInventoryId = item.metadata?.['itemInventoryId'];
    if (!itemInventoryId) {
      this.toast.error(
        this.language.currentLang() === 'vi'
          ? 'Không tìm thấy ID sản phẩm. Vui lòng thử lại.'
          : 'Product ID not found. Please try again.',
      );
      return;
    }

    this.isSubmittingReview.set(true);
    const usageStatus = this.selectedUsageStatus();

    this.itemInventoryService.reviewItem(Number(itemInventoryId), usageStatus).subscribe({
      next: () => {
        this.isSubmittingReview.set(false);
        const statusLabels: Record<UsageStatusType, { vi: string; en: string }> = {
          NotEvaluated: { vi: 'Chưa đánh giá',     en: 'Not Evaluated' },
          Frequent:     { vi: 'Dùng thường xuyên', en: 'Frequent' },
          Occasionally: { vi: 'Dùng thỉnh thoảng', en: 'Occasionally' },
          Seldom:       { vi: 'Ít dùng',           en: 'Seldom' },
          Unused:       { vi: 'Không dùng nữa',   en: 'Unused' },
        };
        const label = statusLabels[usageStatus];
        const localizedLabel = this.language.currentLang() === 'vi' ? label.vi : label.en;
        this.notificationService.submitProductReview(item.id, this.reviewRating(), this.reviewComment(), localizedLabel);
        this.toast.success(
          this.language.currentLang() === 'vi'
            ? `Đã ghi nhận: ${label.vi}`
            : `Review submitted: ${label.en}`,
        );
        this.itemToReview.set(null);

        // Fire-and-forget: gọi AI insight sau khi lưu đánh giá thành công.
        // Không await, không chặn UI, không hiển thị toast lỗi cho người dùng.
        // Dùng guard để tránh gọi trùng khi double-click hoặc re-render.
        if (!this._insightPending) {
          this._insightPending = true;
          void this.aiService
            .generateInsights()
            .pipe(take(1))
            .toPromise()
            .catch((error: unknown) => {
              if (!environment.production) {
                console.warn('[Notification] Generate AI insight failed after review:', error);
              }
            })
            .finally(() => {
              this._insightPending = false;
            });
        }
      },
      error: () => {
        this.isSubmittingReview.set(false);
        this.toast.error(
          this.language.currentLang() === 'vi'
            ? 'Gửi đánh giá thất bại. Vui lòng thử lại.'
            : 'Failed to submit review. Please try again.',
        );
      },
    });
  }

  closeReviewModal(): void {
    this.itemToReview.set(null);
  }

  // Settings Modal
  openSettings(): void {
    const currentSettings = this.notificationService.notificationSettings();
    this.settingsForm = { ...currentSettings };
    this.isSettingsOpen.set(true);
  }

  closeSettings(): void {
    this.isSettingsOpen.set(false);
  }

  saveSettings(): void {
    this.notificationService.updateSettings(this.settingsForm);
    this.toast.success(
      this.language.currentLang() === 'vi'
        ? 'Đã lưu cài đặt thông báo'
        : 'Notification settings saved',
    );
    this.isSettingsOpen.set(false);
  }

  loadMore(): void {
    this.toast.info(
      this.language.currentLang() === 'vi'
        ? 'Đã tải xong toàn bộ thông báo.'
        : 'All notifications loaded.',
    );
  }

  retryLoad(): void {
    this.notificationService.loadNotifications();
  }

  // Helpers for Icons, Badges, Formatting
  getIconForNotification(item: NotificationItem): string {
    switch (item.type) {
      case 'wallet_invitation':
        return 'group_add';
      case 'product_review':
        return 'rate_review';
      case 'wallet_activity':
        return 'account_balance_wallet';
      case 'system':
        if (item.metadata?.severity === 'critical') return 'warning';
        if (item.metadata?.severity === 'warning') return 'error_outline';
        return 'info';
      case 'receipt':
        return 'receipt_long';
      case 'transaction':
        return 'payments';
      case 'manual-entry':
        return 'edit_note';
      case 'insight':
        return 'auto_awesome';
      case 'budget':
        return 'wallet';
      case 'category':
        return 'category';
      case 'report':
        return 'bar_chart';
      default:
        return 'notifications';
    }
  }

  getToneForNotification(item: NotificationItem): string {
    if (item.type === 'system') {
      if (item.metadata?.severity === 'critical') return 'rose';
      if (item.metadata?.severity === 'warning') return 'amber';
      return 'blue';
    }
    if (item.type === 'wallet_invitation') return 'violet';
    if (item.type === 'product_review') return 'amber';
    if (item.type === 'wallet_activity') return 'emerald';
    return 'blue';
  }

  getBadgeLabel(item: NotificationItem): string {
    const isVi = this.language.currentLang() === 'vi';
    if (item.type === 'wallet_invitation') return isVi ? 'Lời mời vào ví' : 'Wallet Invitation';
    if (item.type === 'product_review') return isVi ? 'Đánh giá sản phẩm' : 'Product Review';
    if (item.type === 'wallet_activity') return isVi ? 'Hoạt động ví' : 'Wallet Activity';
    if (item.type === 'system') {
      const sev = item.metadata?.severity;
      if (sev === 'critical') return isVi ? 'Quan trọng' : 'Critical';
      if (sev === 'warning') return isVi ? 'Cảnh báo' : 'Warning';
      return isVi ? 'Thông tin' : 'System Info';
    }
    return isVi ? 'Thông báo' : 'Notification';
  }

  getTabLabel(tab: NotificationFilterTab): string {
    const isVi = this.language.currentLang() === 'vi';
    switch (tab) {
      case 'all':
        return isVi ? 'Tất cả' : 'All';
      case 'unread':
        return isVi ? 'Chưa đọc' : 'Unread';
      case 'wallet_invitation':
        return isVi ? 'Lời mời vào ví' : 'Wallet Invitations';
      case 'product_review':
        return isVi ? 'Review sản phẩm' : 'Product Reviews';
      case 'wallet_activity':
        return isVi ? 'Hoạt động ví' : 'Wallet Activity';
      case 'system':
        return isVi ? 'Hệ thống' : 'System';
      default:
        return tab;
    }
  }

  formatAmount(amount?: number): string {
    if (!amount && amount !== 0) return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
}

