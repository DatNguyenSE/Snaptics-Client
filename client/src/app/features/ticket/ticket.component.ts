import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../core/services/ticket.service';
import { ToastService } from '../../core/services/toast-service';
import {
  SupportTicketDto,
  SupportTicketDetailDto,
  SupportTicketStatisticsDto,
  SupportTicketStatus,
  SupportTicketCategory,
  SupportTicketPriority,
  CreateSupportTicketDto,
  SendMessageDto,
  STATUS_BADGES,
  CATEGORY_LABELS,
  PRIORITY_BADGES,
} from '../../models/support-ticket.model';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.css',
})
export class TicketComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly toastService = inject(ToastService);

  // Enums for template usage
  readonly TicketStatus = SupportTicketStatus;
  readonly TicketCategory = SupportTicketCategory;
  readonly TicketPriority = SupportTicketPriority;
  readonly statusBadges = STATUS_BADGES;
  readonly categoryLabels = CATEGORY_LABELS;
  readonly priorityBadges = PRIORITY_BADGES;

  // Category List for dropdowns
  readonly categories = [
    { value: SupportTicketCategory.General, label: 'Chung / Thanh toán' },
    { value: SupportTicketCategory.TransactionIssue, label: 'Giao dịch thu chi' },
    { value: SupportTicketCategory.BudgetIssue, label: 'Sự cố Ngân sách' },
    { value: SupportTicketCategory.AiFeature, label: 'Tính năng AI' },
    { value: SupportTicketCategory.AccountIssue, label: 'Vấn đề Tài khoản' },
    { value: SupportTicketCategory.BugReport, label: 'Báo lỗi hệ thống' },
    { value: SupportTicketCategory.FeatureRequest, label: 'Góp ý tính năng' },
    { value: SupportTicketCategory.Other, label: 'Vấn đề khác' },
  ];

  // Status List for dropdown filters
  readonly statusFilters = [
    { value: -1, label: 'Tất cả trạng thái' },
    { value: SupportTicketStatus.Pending, label: 'Chờ tiếp nhận' },
    { value: SupportTicketStatus.InProgress, label: 'Đang xử lý' },
    { value: SupportTicketStatus.WaitingForUser, label: 'Chờ phản hồi' },
    { value: SupportTicketStatus.Resolved, label: 'Đã giải quyết' },
    { value: SupportTicketStatus.Closed, label: 'Đã đóng' },
  ];

  // State Signals
  readonly statistics = signal<SupportTicketStatisticsDto | null>(null);
  readonly tickets = signal<SupportTicketDto[]>([]);
  readonly selectedTicketDetail = signal<SupportTicketDetailDto | null>(null);
  readonly totalCount = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // Filters
  readonly searchQuery = signal<string>('');
  readonly selectedStatusFilter = signal<number>(-1);
  readonly selectedCategoryFilter = signal<number>(-1);

  // UI Control Signals
  readonly isLoading = signal<boolean>(false);
  readonly isDetailLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly isSendingMessage = signal<boolean>(false);
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isDetailPanelOpen = signal<boolean>(false);

  // Create Form State
  createModel: {
    subject: string;
    description: string;
    category: number;
  } = {
    subject: '',
    description: '',
    category: SupportTicketCategory.General,
  };
  createSelectedFiles: File[] = [];

  // Message Reply State
  replyContent = '';
  replySelectedFiles: File[] = [];

  // Computed Values
  readonly totalPages = computed(() => {
    return Math.ceil(this.totalCount() / this.pageSize()) || 1;
  });

  ngOnInit(): void {
    this.loadStatistics();
    this.loadTickets();
  }

  /**
   * [GET] Tải dữ liệu thống kê
   */
  loadStatistics(): void {
    this.ticketService.getStatistics().subscribe({
      next: (stats) => this.statistics.set(stats),
      error: (err) => console.error('Failed to load ticket statistics:', err),
    });
  }

  /**
   * [GET] Tải danh sách Ticket theo phân trang & bộ lọc
   */
  loadTickets(): void {
    this.isLoading.set(true);
    this.ticketService
      .getTickets(
        this.currentPage(),
        this.pageSize(),
        this.searchQuery(),
        this.selectedStatusFilter(),
        this.selectedCategoryFilter()
      )
      .subscribe({
        next: (res) => {
          this.tickets.set(res.items || []);
          this.totalCount.set(res.totalCount || 0);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastService.error('Không thể tải danh sách Ticket: ' + err.message);
        },
      });
  }

  /**
   * Tim kiếm từ khóa
   */
  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadTickets();
  }

  /**
   * Thay đổi bộ lọc Status
   */
  onStatusFilterChange(status: number): void {
    this.selectedStatusFilter.set(status);
    this.currentPage.set(1);
    this.loadTickets();
  }

  /**
   * Thay đổi bộ lọc Category
   */
  onCategoryFilterChange(category: number): void {
    this.selectedCategoryFilter.set(category);
    this.currentPage.set(1);
    this.loadTickets();
  }

  /**
   * Chuyển trang
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadTickets();
  }

  /**
   * Mở Modal Tạo Ticket
   */
  openCreateModal(): void {
    this.createModel = {
      subject: '',
      description: '',
      category: SupportTicketCategory.General,
    };
    this.createSelectedFiles = [];
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  /**
   * Chọn file đính kèm khi Tạo Ticket
   */
  onCreateFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.error(`Tệp "${file.name}" quá 10MB.`);
        continue;
      }
      this.createSelectedFiles.push(file);
    }
    input.value = '';
  }

  removeCreateFile(index: number): void {
    this.createSelectedFiles.splice(index, 1);
  }

  /**
   * [POST] Submit Tạo Ticket mới
   */
  submitCreateTicket(): void {
    if (!this.createModel.subject.trim()) {
      this.toastService.warning('Vui lòng nhập tiêu đề yêu cầu!');
      return;
    }
    if (!this.createModel.description.trim()) {
      this.toastService.warning('Vui lòng nhập nội dung chi tiết!');
      return;
    }

    this.isSubmitting.set(true);
    const dto: CreateSupportTicketDto = {
      subject: this.createModel.subject.trim(),
      description: this.createModel.description.trim(),
      category: Number(this.createModel.category),
    };

    this.ticketService.createTicket(dto).subscribe({
      next: (ticket) => {
        // Upload tệp đính kèm nếu có
        if (this.createSelectedFiles.length > 0 && ticket.id) {
          this.uploadMultipleFiles(this.createSelectedFiles, ticket.id).then(() => {
            this.finishTicketCreation(ticket.id);
          });
        } else {
          this.finishTicketCreation(ticket.id);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.error('Tạo ticket thất bại: ' + err.message);
      },
    });
  }

  private finishTicketCreation(ticketId: number): void {
    this.isSubmitting.set(false);
    this.toastService.success(`Đã tạo yêu cầu hỗ trợ #${ticketId} thành công!`);
    this.closeCreateModal();
    this.loadStatistics();
    this.loadTickets();
    this.openTicketDetail(ticketId);
  }

  /**
   * [GET] Xem Chi tiết Ticket & Trò chuyện
   */
  openTicketDetail(ticketId: number): void {
    this.isDetailPanelOpen.set(true);
    this.isDetailLoading.set(true);
    this.selectedTicketDetail.set(null);
    this.replyContent = '';
    this.replySelectedFiles = [];

    this.ticketService.getTicketDetail(ticketId).subscribe({
      next: (detail) => {
        this.selectedTicketDetail.set(detail);
        this.isDetailLoading.set(false);
      },
      error: (err) => {
        this.isDetailLoading.set(false);
        this.toastService.error('Không thể tải chi tiết Ticket: ' + err.message);
      },
    });
  }

  closeDetailPanel(): void {
    this.isDetailPanelOpen.set(false);
    this.selectedTicketDetail.set(null);
  }

  /**
   * Chọn file đính kèm trong tin nhắn phản hồi
   */
  onReplyFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.error(`Tệp "${file.name}" quá 10MB.`);
        continue;
      }
      this.replySelectedFiles.push(file);
    }
    input.value = '';
  }

  removeReplyFile(index: number): void {
    this.replySelectedFiles.splice(index, 1);
  }

  /**
   * [POST] Gửi phản hồi tin nhắn
   */
  submitReply(): void {
    const detail = this.selectedTicketDetail();
    if (!detail) return;

    if (!this.replyContent.trim() && this.replySelectedFiles.length === 0) {
      this.toastService.warning('Vui lòng nhập nội dung tin nhắn hoặc chọn tệp đính kèm.');
      return;
    }

    this.isSendingMessage.set(true);
    const dto: SendMessageDto = {
      content: this.replyContent.trim(),
    };

    this.ticketService.sendMessage(detail.id, dto).subscribe({
      next: (messageRes) => {
        if (this.replySelectedFiles.length > 0 && messageRes.id) {
          this.uploadMultipleFiles(this.replySelectedFiles, detail.id, messageRes.id).then(() => {
            this.finishReplySending(detail.id);
          });
        } else {
          this.finishReplySending(detail.id);
        }
      },
      error: (err) => {
        this.isSendingMessage.set(false);
        this.toastService.error('Không thể gửi phản hồi: ' + err.message);
      },
    });
  }

  private finishReplySending(ticketId: number): void {
    this.isSendingMessage.set(false);
    this.replyContent = '';
    this.replySelectedFiles = [];
    this.toastService.success('Đã gửi phản hồi thành công!');
    this.refreshTicketDetail(ticketId);
    this.loadTickets();
  }

  private refreshTicketDetail(ticketId: number): void {
    this.ticketService.getTicketDetail(ticketId).subscribe({
      next: (detail) => this.selectedTicketDetail.set(detail),
    });
  }

  /**
   * [PATCH] Đóng Ticket
   */
  closeTicket(ticketId: number): void {
    if (!confirm(`Bạn có chắc chắn muốn đóng yêu cầu hỗ trợ #${ticketId}?`)) return;

    this.ticketService.closeTicket(ticketId).subscribe({
      next: () => {
        this.toastService.info(`Đã đóng yêu cầu hỗ trợ #${ticketId}.`);
        this.loadStatistics();
        this.loadTickets();
        if (this.selectedTicketDetail()?.id === ticketId) {
          this.refreshTicketDetail(ticketId);
        }
      },
      error: (err) => this.toastService.error('Đóng ticket thất bại: ' + err.message),
    });
  }

  /**
   * [PATCH] Mở lại Ticket
   */
  reopenTicket(ticketId: number): void {
    this.ticketService.reopenTicket(ticketId).subscribe({
      next: () => {
        this.toastService.success(`Đã mở lại yêu cầu hỗ trợ #${ticketId}.`);
        this.loadStatistics();
        this.loadTickets();
        if (this.selectedTicketDetail()?.id === ticketId) {
          this.refreshTicketDetail(ticketId);
        }
      },
      error: (err) => this.toastService.error('Mở lại ticket thất bại: ' + err.message),
    });
  }

  /**
   * Helper upload nhiều file đính kèm
   */
  private async uploadMultipleFiles(
    files: File[],
    ticketId: number,
    messageId?: number
  ): Promise<void> {
    for (const file of files) {
      try {
        await this.ticketService.uploadAttachment(file, ticketId, messageId).toPromise();
      } catch (e) {
        console.error('File upload error:', e);
      }
    }
  }

  /**
   * Format thời gian tiếng Việt thân thiện (ví dụ: vừa xong, 5 phút trước)
   */
  formatRelativeTime(dateStr?: string): string {
    if (!dateStr) return '---';
    const now = new Date().getTime();
    const past = new Date(dateStr).getTime();
    if (isNaN(past)) return '---';

    const diffSec = Math.floor((now - past) / 1000);
    if (diffSec < 30) return 'Vừa xong';
    if (diffSec < 60) return `${diffSec} giây trước`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;

    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay} ngày trước`;

    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return `${diffMonth} tháng trước`;

    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format dung lượng file
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
