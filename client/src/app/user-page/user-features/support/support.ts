import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../../core/services/account-service';
import { LanguageService } from '../../../core/services/language-service';
import { ToastService } from '../../../core/services/toast-service';
import { SUPPORT_CONFIG } from './config/support.config';
import {
  CreateTicketDTO,
  FAQItem,
  SupportAttachment,
  SupportCategory,
  SupportTicket,
  TicketPriority,
  TicketStatus,
  categoryStringToEnum,
  statusStringToEnum,
} from './models/support.models';
import { SupportService } from './services/support.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './support.html',
  styleUrl: './support.css',
})
export class Support implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly supportService = inject(SupportService);
  readonly languageService = inject(LanguageService);
  readonly accountService = inject(AccountService);
  readonly toastService = inject(ToastService);
  readonly config = SUPPORT_CONFIG;

  // Filter States
  readonly searchQuery = signal<string>('');
  readonly activeStatusFilter = signal<string>('all'); // 'all', 'processing', 'awaiting_user', 'completed'
  readonly selectedCategoryFilter = signal<string>('all');
  readonly selectedPriorityFilter = signal<string>('all');
  readonly sortDirection = signal<'newest' | 'oldest'>('newest');

  // Pagination
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(5);

  // Modals & Drawers
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly selectedTicket = signal<SupportTicket | null>(null);
  readonly isDetailDrawerOpen = signal<boolean>(false);
  readonly isCloseConfirmModalOpen = signal<boolean>(false);
  readonly ticketToCloseId = signal<string | null>(null);
  readonly isFaqModalOpen = signal<boolean>(false);
  readonly isDetailLoading = signal<boolean>(false);

  // Attachment File objects for upload
  selectedCreateFiles: File[] = [];
  selectedReplyFiles: File[] = [];

  // Create Ticket Form Model & Validation
  ticketForm: FormGroup = this.fb.group({
    email: [{ value: '', disabled: true }],
    title: ['', [Validators.required, Validators.minLength(5)]],
    category: ['account', Validators.required],
    priority: ['normal', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20)]],
  });
  createAttachments: SupportAttachment[] = [];
  fileUploadError = signal<string | null>(null);
  isSubmittingTicket = signal<boolean>(false);

  // Reply Model
  replyText = signal<string>('');
  replyAttachments = signal<SupportAttachment[]>([]);
  isSendingReply = signal<boolean>(false);

  // Category labels map
  readonly categoryMap: Record<SupportCategory, { label: string; icon: string }> = {
    account: { label: 'Tài khoản & Đăng nhập', icon: 'manage_accounts' },
    wallet: { label: 'Ví cá nhân / Ví gia đình', icon: 'account_balance_wallet' },
    transaction: { label: 'Giao dịch thu chi', icon: 'receipt_long' },
    budget: { label: 'Ngân sách', icon: 'pie_chart' },
    ai: { label: 'Phân tích bằng AI', icon: 'psychology' },
    payment: { label: 'Thanh toán & Gói dịch vụ', icon: 'payments' },
    bug: { label: 'Báo lỗi hệ thống', icon: 'bug_report' },
    feedback: { label: 'Góp ý tính năng', icon: 'thumbs_up_down' },
    other: { label: 'Vấn đề khác', icon: 'help_outline' },
  };

  // Status labels & badges map
  readonly statusMap: Record<TicketStatus, { label: string; class: string; icon: string }> = {
    pending: { label: 'Chờ tiếp nhận', class: 'status-badge--pending', icon: 'schedule' },
    processing: { label: 'Đang xử lý', class: 'status-badge--processing', icon: 'sync' },
    awaiting_user: { label: 'Chờ phản hồi từ bạn', class: 'status-badge--awaiting', icon: 'mark_chat_unread' },
    resolved: { label: 'Đã giải quyết', class: 'status-badge--resolved', icon: 'check_circle' },
    closed: { label: 'Đã đóng', class: 'status-badge--closed', icon: 'lock' },
  };

  // Priority labels & badges map
  readonly priorityMap: Record<TicketPriority, { label: string; class: string; icon: string }> = {
    low: { label: 'Thấp', class: 'priority-badge--low', icon: 'arrow_downward' },
    normal: { label: 'Bình thường', class: 'priority-badge--normal', icon: 'remove' },
    high: { label: 'Cao', class: 'priority-badge--high', icon: 'arrow_upward' },
    urgent: { label: 'Khẩn cấp', class: 'priority-badge--urgent', icon: 'warning' },
  };

  // FAQ list
  faqs: FAQItem[] = [
    {
      id: 'faq_1',
      questionKey: 'Làm thế nào để tạo ví gia đình?',
      answerKey:
        'Để tạo ví gia đình, hãy vào trang "Quản lý ví" -> Nhấn "Tạo ví mới" -> Chọn loại "Ví gia đình/Chia sẻ". Bạn có thể đặt tên ví, chọn biểu tượng và phân quyền cho các thành viên.',
      category: 'wallet',
      isExpanded: false,
    },
    {
      id: 'faq_2',
      questionKey: 'Làm thế nào để mời thành viên vào ví?',
      answerKey:
        'Trong trang chi tiết Ví gia đình, chọn mục "Thành viên" -> Nhấn "Thêm thành viên" và nhập địa chỉ Email của thành viên bạn muốn mời. Lời mời sẽ được gửi qua email ngay lập tức.',
      category: 'wallet',
      isExpanded: false,
    },
    {
      id: 'faq_3',
      questionKey: 'Tôi có thể chỉnh sửa hoặc xóa giao dịch không?',
      answerKey:
        'Có. Bạn chỉ cần truy cập trang "Giao dịch", nhấp vào giao dịch cần thao tác và chọn "Chỉnh sửa" hoặc "Xóa". Tất cả thay đổi sẽ được cập nhật thời gian thực vào biểu đồ phân tích.',
      category: 'transaction',
      isExpanded: false,
    },
    {
      id: 'faq_4',
      questionKey: 'Vì sao số liệu phân tích chưa được cập nhật?',
      answerKey:
        'Hệ thống AI và bộ nhớ đệm tự động làm mới số liệu theo từng giao dịch mới. Trong một số trường hợp kết nối mạng chập chờn, bạn chỉ cần nhấn nút "Tải lại" trên trang Phân tích.',
      category: 'ai',
      isExpanded: false,
    },
    {
      id: 'faq_5',
      questionKey: 'Làm thế nào để thay đổi mật khẩu?',
      answerKey:
        'Bạn có thể đổi mật khẩu bằng cách nhấp vào Avatar góc trên phải -> chọn "Cài đặt" -> chọn tab "Bảo mật tài khoản" để tiến hành đổi mật khẩu mới.',
      category: 'account',
      isExpanded: false,
    },
    {
      id: 'faq_6',
      questionKey: 'Dữ liệu tài chính của tôi có được bảo mật không?',
      answerKey:
        'Tuyệt đối bảo mật. Snaptics áp dụng mã hóa đầu cuối chuẩn SSL/TLS 256-bit và không bao giờ chia sẻ dữ liệu chi tiêu cá nhân của bạn cho bên thứ ba.',
      category: 'account',
      isExpanded: false,
    },
  ];

  ngOnInit(): void {
    this.loadTicketsFromBackend();
  }

  loadTicketsFromBackend(): void {
    this.supportService.loadUserTickets();
  }

  // Computed Filtered List
  readonly filteredTickets = computed(() => {
    let list = this.supportService.tickets();
    const query = this.searchQuery().toLowerCase().trim();
    const statusF = this.activeStatusFilter();
    const catF = this.selectedCategoryFilter();
    const prioF = this.selectedPriorityFilter();
    const sortDir = this.sortDirection();

    // 1. Text Search Filter (by title, description, or code)
    if (query) {
      list = list.filter(
        (t) =>
          t.ticketCode.toLowerCase().includes(query) ||
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    // 2. Summary Card / Status Tab Filter
    if (statusF === 'processing') {
      list = list.filter((t) => t.status === 'processing' || t.status === 'pending');
    } else if (statusF === 'awaiting_user') {
      list = list.filter((t) => t.status === 'awaiting_user');
    } else if (statusF === 'completed') {
      list = list.filter((t) => t.status === 'resolved' || t.status === 'closed');
    } else if (statusF !== 'all') {
      list = list.filter((t) => t.status === statusF);
    }

    // 3. Category Filter
    if (catF !== 'all') {
      list = list.filter((t) => t.category === catF);
    }

    // 4. Priority Filter
    if (prioF !== 'all') {
      list = list.filter((t) => t.priority === prioF);
    }

    // 5. Sorting
    list = [...list].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortDir === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return list;
  });

  // Paginated View List
  readonly paginatedTickets = computed(() => {
    const list = this.filteredTickets();
    const page = this.currentPage();
    const size = this.pageSize();
    const startIndex = (page - 1) * size;
    return list.slice(0, startIndex + size);
  });

  readonly totalPages = computed(() => {
    return Math.ceil(this.filteredTickets().length / this.pageSize()) || 1;
  });

  readonly hasMoreTickets = computed(() => {
    return this.paginatedTickets().length < this.filteredTickets().length;
  });

  // Form Validation Getters
  get isTitleValid(): boolean {
    const title = this.ticketForm.get('title')?.value || '';
    return title.trim().length >= 5;
  }

  get isDescriptionValid(): boolean {
    const desc = this.ticketForm.get('description')?.value || '';
    return desc.trim().length >= 20;
  }

  get isFormValid(): boolean {
    return this.ticketForm.valid;
  }

  // --- Handlers ---

  setStatusFilter(filterKey: string): void {
    this.activeStatusFilter.set(filterKey);
    this.currentPage.set(1);
  }

  setCategoryFilter(cat: string): void {
    this.selectedCategoryFilter.set(cat);
    this.currentPage.set(1);
  }

  setPriorityFilter(prio: string): void {
    this.selectedPriorityFilter.set(prio);
    this.currentPage.set(1);
  }

  toggleSort(): void {
    this.sortDirection.set(this.sortDirection() === 'newest' ? 'oldest' : 'newest');
  }

  loadMore(): void {
    if (this.hasMoreTickets()) {
      this.pageSize.update((size) => size + 5);
    }
  }

  openCreateModal(): void {
    const user = this.accountService.currentUser();
    this.ticketForm.reset({
      email: user?.email || '',
      title: '',
      category: 'account',
      priority: 'normal',
      description: '',
    });
    this.createAttachments = [];
    this.selectedCreateFiles = [];
    this.fileUploadError.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit

    if (file.size > maxSizeBytes) {
      this.fileUploadError.set('Dung lượng tệp vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn.');
      input.value = '';
      return;
    }

    this.fileUploadError.set(null);
    this.selectedCreateFiles.push(file);

    const attachment: SupportAttachment = {
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
    };

    this.createAttachments.push(attachment);
    input.value = '';
  }

  removeAttachment(index: number): void {
    this.createAttachments.splice(index, 1);
    if (this.selectedCreateFiles[index]) {
      this.selectedCreateFiles.splice(index, 1);
    }
  }

  async submitCreateTicket(): Promise<void> {
    if (this.ticketForm.invalid || this.isSubmittingTicket()) return;

    this.isSubmittingTicket.set(true);
    try {
      const rawVal = this.ticketForm.getRawValue();
      const dto: CreateTicketDTO = {
        title: rawVal.title,
        category: rawVal.category,
        priority: rawVal.priority,
        description: rawVal.description,
        contactEmail: rawVal.email || this.accountService.currentUser()?.email || '',
        attachments: [...this.createAttachments],
      };

      const newTicket = await this.supportService.createTicket(dto);

      // Upload files if any were selected
      if (this.selectedCreateFiles.length > 0 && newTicket.id) {
        const ticketIdNum = parseInt(newTicket.id, 10);
        if (!isNaN(ticketIdNum)) {
          for (const file of this.selectedCreateFiles) {
            this.supportService.uploadAttachment(file, ticketIdNum).subscribe({
              error: (err) => console.error('Error uploading file:', err),
            });
          }
        }
      }

      this.closeCreateModal();
      this.openTicketDetail(newTicket);
    } catch (e) {
      console.error(e);
    } finally {
      this.isSubmittingTicket.set(false);
    }
  }

  openTicketDetail(ticket: SupportTicket): void {
    this.selectedTicket.set(ticket);
    this.replyText.set('');
    this.replyAttachments.set([]);
    this.selectedReplyFiles = [];
    this.isDetailDrawerOpen.set(true);

    // Fetch detail from Backend
    this.isDetailLoading.set(true);
    this.supportService.getTicketById(ticket.id).subscribe({
      next: (detailDto) => {
        const mapped = this.supportService.mapTicketDtoToModel(detailDto);
        this.selectedTicket.set(mapped);
        this.isDetailLoading.set(false);
      },
      error: () => {
        this.isDetailLoading.set(false);
      },
    });
  }

  closeTicketDetail(): void {
    this.isDetailDrawerOpen.set(false);
    this.selectedTicket.set(null);
  }

  onReplyFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.toastService.error('Tệp đính kèm không được quá 5MB');
      input.value = '';
      return;
    }

    this.selectedReplyFiles.push(file);

    const attachment: SupportAttachment = {
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
    };

    this.replyAttachments.update((list) => [...list, attachment]);
    input.value = '';
  }

  removeReplyAttachment(index: number): void {
    this.replyAttachments.update((list) => list.filter((_, i) => i !== index));
    if (this.selectedReplyFiles[index]) {
      this.selectedReplyFiles.splice(index, 1);
    }
  }

  sendReplyMessage(): void {
    const text = this.replyText().trim();
    const ticket = this.selectedTicket();

    if ((!text && this.replyAttachments().length === 0) || !ticket || this.isSendingReply()) return;

    this.isSendingReply.set(true);

    // Upload attachment if any
    if (this.selectedReplyFiles.length > 0) {
      const ticketIdNum = parseInt(ticket.id, 10);
      for (const file of this.selectedReplyFiles) {
        this.supportService.uploadAttachment(file, !isNaN(ticketIdNum) ? ticketIdNum : undefined).subscribe({
          error: (err) => console.error('Attachment upload error:', err),
        });
      }
    }

    this.supportService.sendMessage(ticket.id, text);
    this.replyText.set('');
    this.replyAttachments.set([]);
    this.selectedReplyFiles = [];

    setTimeout(() => {
      this.isSendingReply.set(false);
      // Reload ticket detail
      if (ticket) {
        this.supportService.getTicketById(ticket.id).subscribe({
          next: (detailDto) => {
            const mapped = this.supportService.mapTicketDtoToModel(detailDto);
            this.selectedTicket.set(mapped);
          },
        });
      }
    }, 800);
  }

  promptCloseTicket(ticketId: string): void {
    this.ticketToCloseId.set(ticketId);
    this.isCloseConfirmModalOpen.set(true);
  }

  confirmCloseTicket(): void {
    const id = this.ticketToCloseId();
    if (id) {
      this.supportService.closeTicket(id).subscribe({
        next: () => {
          this.toastService.info(`Đã đóng yêu cầu hỗ trợ #${id}`);
          this.supportService.loadUserTickets();
          if (this.selectedTicket()?.id === id) {
            this.openTicketDetail(this.selectedTicket()!);
          }
        },
        error: (err) => this.toastService.error('Lỗi khi đóng ticket: ' + err.message),
      });
    }
    this.isCloseConfirmModalOpen.set(false);
    this.ticketToCloseId.set(null);
  }

  cancelCloseTicket(): void {
    this.isCloseConfirmModalOpen.set(false);
    this.ticketToCloseId.set(null);
  }

  reopenCurrentTicket(): void {
    const ticket = this.selectedTicket();
    if (ticket) {
      this.supportService.reopenTicket(ticket.id).subscribe({
        next: () => {
          this.toastService.success(`Đã mở lại yêu cầu #${ticket.ticketCode}`);
          this.supportService.loadUserTickets();
          this.openTicketDetail(ticket);
        },
        error: (err) => this.toastService.error('Lỗi mở lại ticket: ' + err.message),
      });
    }
  }

  toggleFaq(faq: FAQItem): void {
    faq.isExpanded = !faq.isExpanded;
  }

  openFaqModal(): void {
    this.isFaqModalOpen.set(true);
  }

  closeFaqModal(): void {
    this.isFaqModalOpen.set(false);
  }

  startLiveChat(): void {
    this.toastService.info(
      'Đang kết nối tới tư vấn viên trực tiếp... (Vui lòng chờ trong giây lát)',
      4000
    );
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
