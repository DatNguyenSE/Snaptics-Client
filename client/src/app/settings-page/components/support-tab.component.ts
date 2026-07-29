import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../core/services/ticket.service';
import {
  SupportTicketDto,
  SupportTicketDetailDto,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketCategory,
  CATEGORY_LABELS,
  STATUS_BADGES,
  PRIORITY_BADGES,
} from '../../models/support-ticket.model';
import { ToastService } from '../../core/services/toast-service';

@Component({
  selector: 'app-support-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-tab.component.html',
  styleUrl: '../settings-page.css',
})
export class SupportTabComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly toast = inject(ToastService);

  tickets: SupportTicketDto[] = [];
  isLoading = false;

  // Pagination & Filtering
  page = 1;
  size = 10;
  totalCount = 0;
  search = '';
  selectedStatus: number = -1;
  selectedCategory: number = -1;

  // Create Ticket Modal State
  isCreateModalOpen = false;
  isSubmitting = false;

  createForm = {
    subject: '',
    category: SupportTicketCategory.General,
    priority: SupportTicketPriority.Normal,
    description: '',
  };

  // Ticket Detail Drawer State
  selectedTicket: SupportTicketDetailDto | null = null;
  isLoadingDetail = false;
  replyContent = '';
  isSendingReply = false;

  readonly statusOptions = [
    { value: -1, label: 'Tất cả trạng thái' },
    { value: SupportTicketStatus.Pending, label: 'Chờ tiếp nhận' },
    { value: SupportTicketStatus.InProgress, label: 'Đang xử lý' },
    { value: SupportTicketStatus.WaitingForUser, label: 'Chờ phản hồi' },
    { value: SupportTicketStatus.Resolved, label: 'Đã giải quyết' },
    { value: SupportTicketStatus.Closed, label: 'Đã đóng' },
  ];

  readonly categoryOptions = [
    { value: -1, label: 'Tất cả danh mục' },
    { value: SupportTicketCategory.General, label: 'Chung / Thanh toán' },
    { value: SupportTicketCategory.TransactionIssue, label: 'Sự cố Giao dịch' },
    { value: SupportTicketCategory.BudgetIssue, label: 'Sự cố Ngân sách' },
    { value: SupportTicketCategory.AiFeature, label: 'Tính năng AI' },
    { value: SupportTicketCategory.AccountIssue, label: 'Vấn đề Tài khoản' },
    { value: SupportTicketCategory.BugReport, label: 'Báo lỗi hệ thống' },
    { value: SupportTicketCategory.FeatureRequest, label: 'Yêu cầu tính năng' },
    { value: SupportTicketCategory.Other, label: 'Khác' },
  ];

  readonly priorityOptions = [
    { value: SupportTicketPriority.Low, label: 'Thấp' },
    { value: SupportTicketPriority.Normal, label: 'Bình thường' },
    { value: SupportTicketPriority.High, label: 'Cao' },
    { value: SupportTicketPriority.Urgent, label: 'Khẩn cấp' },
  ];

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.ticketService
      .getTickets(this.page, this.size, this.search, this.selectedStatus, this.selectedCategory)
      .subscribe({
        next: (res) => {
          this.tickets = res.items || [];
          this.totalCount = res.totalCount || 0;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.toast.error(err.message || 'Không thể tải danh sách yêu cầu hỗ trợ.');
        },
      });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadTickets();
  }

  // ─── Ticket Code Helper ────────────────────────────────────────────────────

  getTicketCode(ticket: SupportTicketDto | number): string {
    const id = typeof ticket === 'number' ? ticket : ticket.id;
    return `TCK-${String(id).padStart(6, '0')}`;
  }

  getCategoryLabel(category: number): string {
    return CATEGORY_LABELS[category]?.label || 'Khác';
  }

  getStatusBadge(status: number) {
    return (
      STATUS_BADGES[status] || {
        label: 'Không xác định',
        bgClass: 'bg-slate-500/10',
        textClass: 'text-slate-400',
        icon: 'help',
      }
    );
  }

  getPriorityBadge(priority: number) {
    return (
      PRIORITY_BADGES[priority] || {
        label: 'Bình thường',
        bgClass: 'bg-blue-500/10',
        textClass: 'text-blue-400',
      }
    );
  }

  // ─── Create Ticket Handlers ─────────────────────────────────────────────────

  openCreateModal(): void {
    this.createForm = {
      subject: '',
      category: SupportTicketCategory.General,
      priority: SupportTicketPriority.Normal,
      description: '',
    };
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  submitTicket(): void {
    if (!this.createForm.subject.trim() || !this.createForm.description.trim()) {
      this.toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung chi tiết.');
      return;
    }

    this.isSubmitting = true;
    this.ticketService
      .createTicket({
        title: this.createForm.subject.trim(),
        subject: this.createForm.subject.trim(),
        description: this.createForm.description.trim(),
        category: Number(this.createForm.category),
        priority: Number(this.createForm.priority),
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeCreateModal();
          this.toast.success('Đã gửi yêu cầu hỗ trợ thành công!');
          this.loadTickets();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.toast.error(err.message || 'Gửi yêu cầu hỗ trợ thất bại.');
        },
      });
  }

  // ─── Ticket Detail Handlers ─────────────────────────────────────────────────

  selectTicket(ticket: SupportTicketDto): void {
    this.isLoadingDetail = true;
    this.ticketService.getTicketDetail(ticket.id).subscribe({
      next: (detail) => {
        this.selectedTicket = detail;
        this.isLoadingDetail = false;
      },
      error: (err) => {
        this.isLoadingDetail = false;
        this.toast.error(err.message || 'Không thể xem chi tiết ticket.');
      },
    });
  }

  closeDetailDrawer(): void {
    this.selectedTicket = null;
    this.replyContent = '';
  }

  sendReply(): void {
    if (!this.selectedTicket || !this.replyContent.trim()) return;

    this.isSendingReply = true;
    this.ticketService
      .sendMessage(this.selectedTicket.id, { content: this.replyContent.trim() })
      .subscribe({
        next: (msg) => {
          this.isSendingReply = false;
          this.replyContent = '';
          if (this.selectedTicket) {
            this.selectedTicket.messages = [...(this.selectedTicket.messages || []), msg];
          }
          this.toast.success('Đã gửi phản hồi.');
        },
        error: (err) => {
          this.isSendingReply = false;
          this.toast.error(err.message || 'Không thể gửi phản hồi.');
        },
      });
  }

  closeTicket(): void {
    if (!this.selectedTicket) return;

    this.ticketService.closeTicket(this.selectedTicket.id).subscribe({
      next: () => {
        if (this.selectedTicket) {
          this.selectedTicket.status = SupportTicketStatus.Closed;
        }
        this.toast.success('Đã đóng ticket hỗ trợ.');
        this.loadTickets();
      },
      error: (err) => {
        this.toast.error(err.message || 'Không thể đóng ticket.');
      },
    });
  }
}
