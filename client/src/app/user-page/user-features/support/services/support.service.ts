import { Injectable, computed, signal, inject } from '@angular/core';
import { AccountService } from '../../../../core/services/account-service';
import { ToastService } from '../../../../core/services/toast-service';
import {
  CreateTicketDTO,
  SupportAttachment,
  SupportMessage,
  SupportStats,
  SupportTicket,
  TicketPriority,
  TicketStatus,
} from '../models/support.models';

const STORAGE_KEY = 'snaptics_support_tickets_v1';

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private readonly accountService = inject(AccountService);
  private readonly toastService = inject(ToastService);

  readonly tickets = signal<SupportTicket[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly stats = computed<SupportStats>(() => {
    const list = this.tickets();
    return {
      total: list.length,
      processing: list.filter((t) => t.status === 'processing' || t.status === 'pending').length,
      awaitingUser: list.filter((t) => t.status === 'awaiting_user').length,
      completed: list.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
    };
  });

  constructor() {
    this.initData();
  }

  /**
   * Khởi tạo dữ liệu ticket từ localStorage hoặc tạo dữ liệu mẫu nếu chưa có.
   * NOTE FOR BACKEND INTEGRATION:
   * Thay thế hàm này bằng `http.get<SupportTicket[]>(`${baseUrl}/support/tickets`)`
   */
  initData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData) as SupportTicket[];
        this.tickets.set(parsed);
      } else {
        const initialMockTickets = this.generateMockTickets();
        this.tickets.set(initialMockTickets);
        this.saveToStorage(initialMockTickets);
      }
    } catch (e) {
      console.error('Error loading support tickets:', e);
      this.error.set('Không thể tải danh sách ticket. Vui lòng thử lại.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Thêm ticket mới
   * NOTE FOR BACKEND INTEGRATION:
   * REST endpoint: `POST /api/support/tickets`
   */
  createTicket(dto: CreateTicketDTO): Promise<SupportTicket> {
    return new Promise((resolve, reject) => {
      this.isLoading.set(true);

      setTimeout(() => {
        try {
          const currentUser = this.accountService.currentUser();
          const nextIndex = this.tickets().length + 1024;
          const ticketCode = `#SP-${nextIndex}`;
          const now = new Date().toISOString();

          const newTicket: SupportTicket = {
            id: `ticket_${Date.now()}`,
            ticketCode,
            userId: currentUser?.id || 'guest_user',
            userEmail: dto.contactEmail,
            userName: currentUser?.displayName || 'Người dùng',
            title: dto.title.trim(),
            description: dto.description.trim(),
            category: dto.category,
            priority: dto.priority,
            status: 'pending',
            attachments: dto.attachments || [],
            messages: [
              {
                id: `msg_${Date.now()}_init`,
                ticketId: `ticket_${Date.now()}`,
                senderId: currentUser?.id || 'guest_user',
                senderName: currentUser?.displayName || 'Bạn',
                senderAvatar: currentUser?.imageUrl,
                senderType: 'user',
                message: dto.description.trim(),
                attachments: dto.attachments || [],
                createdAt: now,
              },
            ],
            createdAt: now,
            updatedAt: now,
          };

          const updatedList = [newTicket, ...this.tickets()];
          this.tickets.set(updatedList);
          this.saveToStorage(updatedList);

          // Phản hồi giả lập từ bot hỗ trợ tự động sau 1.5s
          this.scheduleAutoSupportReply(newTicket.id);

          this.toastService.success(`Đã tạo yêu cầu hỗ trợ mã ${ticketCode} thành công!`);
          resolve(newTicket);
        } catch (err) {
          this.toastService.error('Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.');
          reject(err);
        } finally {
          this.isLoading.set(false);
        }
      }, 600);
    });
  }

  /**
   * Gửi tin nhắn phản hồi trong ticket
   * NOTE FOR BACKEND INTEGRATION:
   * REST endpoint: `POST /api/support/tickets/{id}/messages`
   */
  sendMessage(ticketId: string, messageText: string, attachments?: SupportAttachment[]): void {
    const list = this.tickets();
    const index = list.findIndex((t) => t.id === ticketId);
    if (index === -1) return;

    const ticket = list[index];
    if (ticket.status === 'closed') {
      this.toastService.warning('Yêu cầu này đã đóng. Hãy mở lại để tiếp tục nhắn tin.');
      return;
    }

    const currentUser = this.accountService.currentUser();
    const now = new Date().toISOString();

    const newMessage: SupportMessage = {
      id: `msg_${Date.now()}`,
      ticketId,
      senderId: currentUser?.id || 'guest_user',
      senderName: currentUser?.displayName || 'Bạn',
      senderAvatar: currentUser?.imageUrl,
      senderType: 'user',
      message: messageText.trim(),
      attachments,
      createdAt: now,
    };

    const updatedTicket: SupportTicket = {
      ...ticket,
      status: ticket.status === 'awaiting_user' ? 'processing' : ticket.status,
      updatedAt: now,
      messages: [...ticket.messages, newMessage],
    };

    const updatedList = [...list];
    updatedList[index] = updatedTicket;
    this.tickets.set(updatedList);
    this.saveToStorage(updatedList);

    // Giả lập bot phản hồi tin nhắn tự động
    this.scheduleAutoSupportMessageReply(ticketId);
  }

  /**
   * Cập nhật trạng thái ticket (Chuyển sang Đã giải quyết / Đã đóng)
   * NOTE FOR BACKEND INTEGRATION:
   * REST endpoint: `PATCH /api/support/tickets/{id}/status`
   */
  updateStatus(ticketId: string, status: TicketStatus): void {
    const list = this.tickets();
    const index = list.findIndex((t) => t.id === ticketId);
    if (index === -1) return;

    const ticket = list[index];
    const now = new Date().toISOString();
    const updatedTicket: SupportTicket = {
      ...ticket,
      status,
      updatedAt: now,
      resolvedAt: status === 'resolved' || status === 'closed' ? now : ticket.resolvedAt,
    };

    const updatedList = [...list];
    updatedList[index] = updatedTicket;
    this.tickets.set(updatedList);
    this.saveToStorage(updatedList);

    if (status === 'closed') {
      this.toastService.info(`Đã đóng yêu cầu hỗ trợ ${ticket.ticketCode}`);
    } else if (status === 'resolved') {
      this.toastService.success(`Đã đánh dấu giải quyết yêu cầu ${ticket.ticketCode}`);
    }
  }

  /**
   * Mở lại ticket đã đóng
   */
  reopenTicket(ticketId: string): void {
    const list = this.tickets();
    const index = list.findIndex((t) => t.id === ticketId);
    if (index === -1) return;

    const ticket = list[index];
    const now = new Date().toISOString();
    const updatedTicket: SupportTicket = {
      ...ticket,
      status: 'processing',
      updatedAt: now,
    };

    const updatedList = [...list];
    updatedList[index] = updatedTicket;
    this.tickets.set(updatedList);
    this.saveToStorage(updatedList);

    this.toastService.success(`Đã mở lại yêu cầu ${ticket.ticketCode}`);
  }

  private saveToStorage(list: SupportTicket[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save support tickets to storage:', e);
    }
  }

  private generateMockTickets(): SupportTicket[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'ticket_1024',
        ticketCode: '#SP-1024',
        userId: 'user_1',
        userEmail: 'minhtran@gmail.com',
        userName: 'Minh Trần',
        title: 'Chờ xác thực giao dịch chuyển khoản vào ví gia đình',
        description:
          'Tôi đã thực hiện giao dịch nạp 1.500.000đ vào ví gia đình từ sáng nay nhưng số dư ví vẫn chưa được cập nhật. Nhờ bộ phận kỹ thuật kiểm tra lại giúp tôi.',
        category: 'wallet',
        priority: 'high',
        status: 'awaiting_user',
        createdAt: threeDaysAgo.toISOString(),
        updatedAt: yesterday.toISOString(),
        messages: [
          {
            id: 'msg_1',
            ticketId: 'ticket_1024',
            senderId: 'user_1',
            senderName: 'Minh Trần',
            senderType: 'user',
            message:
              'Tôi đã thực hiện giao dịch nạp 1.500.000đ vào ví gia đình từ sáng nay nhưng số dư ví vẫn chưa được cập nhật. Nhờ bộ phận kỹ thuật kiểm tra lại giúp tôi.',
            createdAt: threeDaysAgo.toISOString(),
          },
          {
            id: 'msg_2',
            ticketId: 'ticket_1024',
            senderId: 'supp_101',
            senderName: 'Chăm sóc khách hàng Snaptics',
            senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SnapticsSupport',
            senderType: 'support',
            message:
              'Chào bạn Minh, Snaptics đã nhận được phản hồi. Vui lòng cung cấp mã tham chiếu giao dịch bank transfer hoặc ảnh chụp màn hình chuyển khoản thành công để hệ thống đối soát giúp bạn nhé!',
            createdAt: yesterday.toISOString(),
          },
        ],
      },
      {
        id: 'ticket_1025',
        ticketCode: '#SP-1025',
        userId: 'user_1',
        userEmail: 'minhtran@gmail.com',
        userName: 'Minh Trần',
        title: 'Lỗi nhận diện hóa đơn quét AI bị sai số tiền',
        description:
          'Khi tôi quét hóa đơn từ siêu thị Co.opmart, tổng số tiền là 450.000đ nhưng AI hiển thị thành 4.500.000đ. Nhờ team hỗ trợ tinh chỉnh mô hình OCR.',
        category: 'ai',
        priority: 'normal',
        status: 'processing',
        createdAt: yesterday.toISOString(),
        updatedAt: now.toISOString(),
        messages: [
          {
            id: 'msg_3',
            ticketId: 'ticket_1025',
            senderId: 'user_1',
            senderName: 'Minh Trần',
            senderType: 'user',
            message:
              'Khi tôi quét hóa đơn từ siêu thị Co.opmart, tổng số tiền là 450.000đ nhưng AI hiển thị thành 4.500.000đ. Nhờ team hỗ trợ tinh chỉnh mô hình OCR.',
            createdAt: yesterday.toISOString(),
          },
          {
            id: 'msg_4',
            ticketId: 'ticket_1025',
            senderId: 'supp_102',
            senderName: 'Kỹ sư AI Snaptics',
            senderType: 'support',
            message:
              'Cảm ơn bạn đã phản hồi! Đội ngũ AI đã ghi nhận mẫu hóa đơn bị lỗi dấu phân cách chữ số hàng nghìn và đang tối ưu lại thuật toán bóc tách dữ liệu.',
            createdAt: now.toISOString(),
          },
        ],
      },
      {
        id: 'ticket_1026',
        ticketCode: '#SP-1026',
        userId: 'user_1',
        userEmail: 'minhtran@gmail.com',
        userName: 'Minh Trần',
        title: 'Góp ý thêm tính năng xuất báo cáo định dạng Excel/PDF',
        description:
          'Ứng dụng đang hỗ trợ xem báo cáo rất trực quan, nhưng nếu có thêm nút bấm xuất báo cáo chi tiêu thành tệp `.xlsx` hàng tháng sẽ rất tuyệt vời cho quản lý tài chính cá nhân.',
        category: 'feedback',
        priority: 'low',
        status: 'resolved',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: threeDaysAgo.toISOString(),
        resolvedAt: threeDaysAgo.toISOString(),
        messages: [
          {
            id: 'msg_5',
            ticketId: 'ticket_1026',
            senderId: 'user_1',
            senderName: 'Minh Trần',
            senderType: 'user',
            message:
              'Ứng dụng đang hỗ trợ xem báo cáo rất trực quan, nhưng nếu có thêm nút bấm xuất báo cáo chi tiêu thành tệp `.xlsx` hàng tháng sẽ rất tuyệt vời cho quản lý tài chính cá nhân.',
            createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'msg_6',
            ticketId: 'ticket_1026',
            senderId: 'supp_101',
            senderName: 'Chăm sóc khách hàng Snaptics',
            senderType: 'support',
            message:
              'Góp ý tuyệt vời! Tính năng xuất báo cáo Excel/PDF đã được chuyển tới Product Roadmap phiên bản tiếp theo. Cảm ơn bạn đã đồng hành cùng Snaptics!',
            createdAt: threeDaysAgo.toISOString(),
          },
        ],
      },
    ];
  }

  private scheduleAutoSupportReply(ticketId: string): void {
    setTimeout(() => {
      const list = this.tickets();
      const index = list.findIndex((t) => t.id === ticketId);
      if (index === -1) return;

      const ticket = list[index];
      const botMsg: SupportMessage = {
        id: `msg_bot_${Date.now()}`,
        ticketId,
        senderId: 'supp_auto',
        senderName: 'Hệ thống hỗ trợ tự động',
        senderType: 'support',
        message:
          'Hệ thống Snaptics đã nhận được yêu cầu của bạn. Nhân viên hỗ trợ sẽ xử lý và phản hồi trong thời gian sớm nhất. Cảm ơn bạn!',
        createdAt: new Date().toISOString(),
      };

      const updatedTicket: SupportTicket = {
        ...ticket,
        status: 'processing',
        updatedAt: new Date().toISOString(),
        messages: [...ticket.messages, botMsg],
      };

      const updatedList = [...list];
      updatedList[index] = updatedTicket;
      this.tickets.set(updatedList);
      this.saveToStorage(updatedList);
    }, 2000);
  }

  private scheduleAutoSupportMessageReply(ticketId: string): void {
    setTimeout(() => {
      const list = this.tickets();
      const index = list.findIndex((t) => t.id === ticketId);
      if (index === -1) return;

      const ticket = list[index];
      if (ticket.status === 'closed') return;

      const botReply: SupportMessage = {
        id: `msg_reply_${Date.now()}`,
        ticketId,
        senderId: 'supp_101',
        senderName: 'Chăm sóc khách hàng Snaptics',
        senderType: 'support',
        message:
          'Cảm ơn bạn đã gửi thêm thông tin! Chuyên viên hỗ trợ đang kiểm tra và sẽ phản hồi chi tiết cho bạn ngay khi có thông tin mới nhất.',
        createdAt: new Date().toISOString(),
      };

      const updatedTicket: SupportTicket = {
        ...ticket,
        status: 'awaiting_user',
        updatedAt: new Date().toISOString(),
        messages: [...ticket.messages, botReply],
      };

      const updatedList = [...list];
      updatedList[index] = updatedTicket;
      this.tickets.set(updatedList);
      this.saveToStorage(updatedList);
    }, 3000);
  }
}
