import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../../../user-page/user-features/support/services/support.service';
import { ToastService } from '../../../core/services/toast-service';
import { AdminDrawerComponent } from '../../components/admin-drawer/admin-drawer.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { StatusBadgeComponent, BadgeVariant } from '../../components/status-badge/status-badge.component';
import {
  AdminTicketQueryParams,
  SupportMessageDto,
  SupportTicketDetailDto,
  SupportTicketDto,
  TicketCategoryEnum,
  TicketPriorityEnum,
  TicketStatusEnum,
  categoryEnumToString,
  priorityEnumToString,
  statusEnumToString,
} from '../../../user-page/user-features/support/models/support.models';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminDrawerComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    PaginationComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.css',
})
export class AdminTicketsComponent implements OnInit {
  private readonly supportService = inject(SupportService);
  private readonly toastService = inject(ToastService);

  // Lists & State
  tickets = signal<SupportTicketDto[]>([]);
  totalCount = signal<number>(0);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Selected Detail Modal/Drawer
  selectedTicket = signal<SupportTicketDetailDto | null>(null);
  isDrawerOpen = signal<boolean>(false);
  isDetailLoading = signal<boolean>(false);

  // Admin Response Model
  replyContent = signal<string>('');
  selectedReplyFile: File | null = null;

  // Assign Model
  assignedToInput = signal<string>('');

  // Filters & Pagination
  searchQuery = signal<string>('');
  selectedStatus = signal<number | null>(null);
  selectedPriority = signal<number | null>(null);
  selectedCategory = signal<number | null>(null);
  assignedToFilter = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Enum Options
  readonly statusOptions = [
    { value: null, label: 'Tất cả trạng thái' },
    { value: TicketStatusEnum.Pending, label: 'Chờ xử lý' },
    { value: TicketStatusEnum.InProgress, label: 'Đang xử lý' },
    { value: TicketStatusEnum.WaitingForUser, label: 'Chờ phản hồi' },
    { value: TicketStatusEnum.Resolved, label: 'Đã giải quyết' },
    { value: TicketStatusEnum.Closed, label: 'Đã đóng' },
  ];

  readonly priorityOptions = [
    { value: null, label: 'Tất cả mức ưu tiên' },
    { value: TicketPriorityEnum.Low, label: 'Thấp' },
    { value: TicketPriorityEnum.Normal, label: 'Bình thường' },
    { value: TicketPriorityEnum.High, label: 'Cao' },
    { value: TicketPriorityEnum.Urgent, label: 'Khẩn cấp' },
  ];

  readonly categoryOptions = [
    { value: null, label: 'Tất cả phân loại' },
    { value: TicketCategoryEnum.General, label: 'Chung' },
    { value: TicketCategoryEnum.TransactionIssue, label: 'Giao dịch' },
    { value: TicketCategoryEnum.BudgetIssue, label: 'Ngân sách' },
    { value: TicketCategoryEnum.AiFeature, label: 'Tính năng AI' },
    { value: TicketCategoryEnum.AccountIssue, label: 'Tài khoản' },
    { value: TicketCategoryEnum.BugReport, label: 'Báo lỗi' },
    { value: TicketCategoryEnum.FeatureRequest, label: 'Yêu cầu tính năng' },
    { value: TicketCategoryEnum.Other, label: 'Khác' },
  ];

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading.set(true);

    const params: AdminTicketQueryParams = {
      search: this.searchQuery() || undefined,
      status: this.selectedStatus() !== null ? this.selectedStatus()! : undefined,
      priority: this.selectedPriority() !== null ? this.selectedPriority()! : undefined,
      category: this.selectedCategory() !== null ? this.selectedCategory()! : undefined,
      assignedToId: this.assignedToFilter() || undefined,
      page: this.currentPage(),
      size: this.pageSize(),
    };

    this.supportService.getAdminTickets(params).subscribe({
      next: (res) => {
        this.tickets.set(res?.items || []);
        this.totalCount.set(res?.totalCount || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error('Lỗi tải danh sách Ticket (Admin): ' + err.message);
      },
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadTickets();
  }

  onPageChange(newPage: number): void {
    this.currentPage.set(newPage);
    this.loadTickets();
  }

  viewDetail(ticketId: number | string): void {
    this.isDrawerOpen.set(true);
    this.isDetailLoading.set(true);
    this.replyContent.set('');
    this.selectedReplyFile = null;

    this.supportService.getAdminTicketById(ticketId).subscribe({
      next: (detail) => {
        this.selectedTicket.set(detail);
        this.assignedToInput.set(detail.assignedToId || '');
        this.isDetailLoading.set(false);
      },
      error: (err) => {
        this.isDetailLoading.set(false);
        this.toastService.error('Lỗi xem chi tiết Ticket: ' + err.message);
      },
    });
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.selectedTicket.set(null);
  }

  // ─── ADMIN ACTIONS ─────────────────────────────────────────────────────────

  /** [PATCH] /api/admin/support/tickets/{id}/assign */
  assignTicket(): void {
    const ticket = this.selectedTicket();
    const assignedToId = this.assignedToInput().trim();
    if (!ticket) return;

    this.isSubmitting.set(true);
    this.supportService.assignTicket(ticket.id, { assignedToId }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.success(`Đã phân công Ticket #${ticket.id} thành công`);
        this.viewDetail(ticket.id);
        this.loadTickets();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.error('Lỗi phân công Ticket: ' + err.message);
      },
    });
  }

  /** [PATCH] /api/admin/support/tickets/{id}/status */
  changeStatus(statusValue: number): void {
    const ticket = this.selectedTicket();
    if (!ticket) return;

    this.isSubmitting.set(true);
    this.supportService.updateTicketStatus(ticket.id, { status: statusValue }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.success(`Cập nhật trạng thái Ticket #${ticket.id} thành công`);
        this.viewDetail(ticket.id);
        this.loadTickets();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.error('Lỗi cập nhật trạng thái: ' + err.message);
      },
    });
  }

  /** [PATCH] /api/admin/support/tickets/{id}/priority */
  changePriority(priorityValue: number): void {
    const ticket = this.selectedTicket();
    if (!ticket) return;

    this.isSubmitting.set(true);
    this.supportService.updateTicketPriority(ticket.id, { priority: priorityValue }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.success(`Cập nhật mức ưu tiên Ticket #${ticket.id} thành công`);
        this.viewDetail(ticket.id);
        this.loadTickets();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.error('Lỗi cập nhật mức ưu tiên: ' + err.message);
      },
    });
  }

  onReplyFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedReplyFile = input.files[0];
    }
  }

  /** [POST] /api/admin/support/tickets/{id}/messages */
  sendAdminReply(): void {
    const ticket = this.selectedTicket();
    const content = this.replyContent().trim();
    if (!ticket || (!content && !this.selectedReplyFile)) return;

    this.isSubmitting.set(true);
    this.supportService.sendAdminMessage(ticket.id, content, this.selectedReplyFile || undefined).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.success('Đã gửi tin nhắn phản hồi thành công');
        this.replyContent.set('');
        this.selectedReplyFile = null;
        this.viewDetail(ticket.id);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.error('Không thể gửi phản hồi: ' + err.message);
      },
    });
  }

  // ─── UTILS & BADGES ────────────────────────────────────────────────────────

  getStatusVariant(status: number): BadgeVariant {
    switch (status) {
      case TicketStatusEnum.Pending: return 'pending';
      case TicketStatusEnum.InProgress: return 'processing';
      case TicketStatusEnum.WaitingForUser: return 'awaiting_user';
      case TicketStatusEnum.Resolved: return 'resolved';
      case TicketStatusEnum.Closed: return 'closed';
      default: return 'pending';
    }
  }

  getStatusDisplay(status: number): string {
    switch (status) {
      case TicketStatusEnum.Pending: return 'Chờ tiếp nhận';
      case TicketStatusEnum.InProgress: return 'Đang xử lý';
      case TicketStatusEnum.WaitingForUser: return 'Chờ phản hồi';
      case TicketStatusEnum.Resolved: return 'Đã giải quyết';
      case TicketStatusEnum.Closed: return 'Đã đóng';
      default: return 'Chờ xử lý';
    }
  }

  getPriorityVariant(priority?: number): BadgeVariant {
    switch (priority) {
      case TicketPriorityEnum.Low: return 'low';
      case TicketPriorityEnum.Normal: return 'normal';
      case TicketPriorityEnum.High: return 'medium';
      case TicketPriorityEnum.Urgent: return 'urgent';
      default: return 'normal';
    }
  }

  getPriorityDisplay(priority?: number): string {
    switch (priority) {
      case TicketPriorityEnum.Low: return 'Thấp';
      case TicketPriorityEnum.Normal: return 'Bình thường';
      case TicketPriorityEnum.High: return 'Cao';
      case TicketPriorityEnum.Urgent: return 'Khẩn cấp';
      default: return 'Bình thường';
    }
  }

  getCategoryLabel(category: number): string {
    switch (category) {
      case TicketCategoryEnum.General: return 'Chung';
      case TicketCategoryEnum.TransactionIssue: return 'Giao dịch';
      case TicketCategoryEnum.BudgetIssue: return 'Ngân sách';
      case TicketCategoryEnum.AiFeature: return 'Tính năng AI';
      case TicketCategoryEnum.AccountIssue: return 'Tài khoản';
      case TicketCategoryEnum.BugReport: return 'Báo lỗi';
      case TicketCategoryEnum.FeatureRequest: return 'Góp ý';
      case TicketCategoryEnum.Other: default: return 'Khác';
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
