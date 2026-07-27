import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { ToastService } from '../../../../core/services/toast-service';
import {
  AdminTicketQueryParams,
  AssignTicketRequest,
  CreateTicketDTO,
  CreateTicketRequest,
  PaginatedResultDto,
  SendMessageDto,
  SendTicketMessageRequest,
  SupportAttachment,
  SupportAttachmentDto,
  SupportMessage,
  SupportMessageDto,
  SupportStats,
  SupportStatsDto,
  SupportTicket,
  SupportTicketDetailDto,
  SupportTicketDto,
  TicketQueryParams,
  UpdateTicketPriorityRequest,
  UpdateTicketStatusRequest,
  categoryEnumToString,
  categoryStringToEnum,
  priorityEnumToString,
  priorityStringToEnum,
  statusEnumToString,
  statusStringToEnum,
} from '../models/support.models';

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly userApiUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/support`;
  private readonly adminApiUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/support`;

  readonly tickets = signal<SupportTicket[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly stats = computed<SupportStats>(() => {
    const list = this.tickets();
    return {
      total: this.totalCount() || list.length,
      processing: list.filter((t) => t.status === 'processing' || t.status === 'pending').length,
      awaitingUser: list.filter((t) => t.status === 'awaiting_user').length,
      completed: list.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
    };
  });

  // ─── USER APIS ─────────────────────────────────────────────────────────────

  /**
   * [POST] /api/support/tickets - Tạo ticket mới
   */
  createTicketApi(payload: CreateTicketRequest): Observable<SupportTicketDto> {
    return this.http.post<SupportTicketDto>(`${this.userApiUrl}/tickets`, payload).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Wrapper hỗ trợ DTO frontend
   */
  createTicket(dto: CreateTicketDTO): Promise<SupportTicket> {
    this.isLoading.set(true);
    const requestPayload: CreateTicketRequest = {
      subject: dto.title.trim(),
      description: dto.description.trim(),
      category: categoryStringToEnum(dto.category),
    };

    return new Promise((resolve, reject) => {
      this.createTicketApi(requestPayload).subscribe({
        next: (res) => {
          const mappedTicket = this.mapTicketDtoToModel(res);
          this.toastService.success(`Đã tạo yêu cầu hỗ trợ #${res.id} thành công!`);
          this.isLoading.set(false);
          this.loadUserTickets(); // Refresh list
          resolve(mappedTicket);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastService.error('Không thể tạo ticket: ' + (err.message || 'Lỗi server'));
          reject(err);
        },
      });
    });
  }

  /**
   * [GET] /api/support/tickets - Lấy danh sách ticket người dùng
   */
  getTickets(params?: TicketQueryParams): Observable<PaginatedResultDto<SupportTicketDto> | SupportTicketDto[]> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.status !== undefined && params.status !== null) httpParams = httpParams.set('status', params.status);
      if (params.category !== undefined && params.category !== null) httpParams = httpParams.set('category', params.category);
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.size) httpParams = httpParams.set('size', params.size);
    }

    return this.http.get<PaginatedResultDto<SupportTicketDto> | SupportTicketDto[]>(`${this.userApiUrl}/tickets`, { params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Tải danh sách ticket của User vào Signal state
   */
  loadUserTickets(params?: TicketQueryParams): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.getTickets(params).subscribe({
      next: (res) => {
        let items: SupportTicketDto[] = [];
        let total = 0;

        if (Array.isArray(res)) {
          items = res;
          total = res.length;
        } else if (res && Array.isArray(res.items)) {
          items = res.items;
          total = res.totalCount;
        }

        const mappedList = items.map((item) => this.mapTicketDtoToModel(item));
        this.tickets.set(mappedList);
        this.totalCount.set(total);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Không thể tải danh sách ticket');
        this.toastService.error('Lỗi tải danh sách ticket: ' + err.message);
      },
    });
  }

  /**
   * [GET] /api/support/tickets/{id} - Lấy chi tiết ticket
   */
  getTicketById(id: number | string): Observable<SupportTicketDetailDto> {
    return this.http.get<SupportTicketDetailDto>(`${this.userApiUrl}/tickets/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [POST] /api/support/tickets/{id}/messages - Gửi tin nhắn phản hồi
   */
  sendMessageApi(id: number | string, payload: SendTicketMessageRequest): Observable<SupportMessageDto> {
    return this.http.post<SupportMessageDto>(`${this.userApiUrl}/tickets/${id}/messages`, payload).pipe(
      catchError(this.handleError)
    );
  }

  sendMessage(ticketId: string, messageText: string, attachments?: SupportAttachment[]): void {
    if (!messageText.trim()) return;

    this.isLoading.set(true);
    const payload: SendTicketMessageRequest = { content: messageText.trim() };

    this.sendMessageApi(ticketId, payload).subscribe({
      next: () => {
        this.toastService.success('Đã gửi phản hồi thành công');
        this.loadUserTickets();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error('Không thể gửi phản hồi: ' + err.message);
      },
    });
  }

  /**
   * [PATCH] /api/support/tickets/{id}/close - Đóng ticket
   */
  closeTicket(id: number | string): Observable<SupportTicketDto> {
    return this.http.patch<SupportTicketDto>(`${this.userApiUrl}/tickets/${id}/close`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [PATCH] /api/support/tickets/{id}/reopen - Mở lại ticket
   */
  reopenTicket(id: number | string): Observable<SupportTicketDto> {
    return this.http.patch<SupportTicketDto>(`${this.userApiUrl}/tickets/${id}/reopen`, {}).pipe(
      catchError(this.handleError)
    );
  }

  updateStatus(ticketId: string, status: string): void {
    if (status === 'closed') {
      this.closeTicket(ticketId).subscribe({
        next: () => {
          this.toastService.info(`Đã đóng yêu cầu hỗ trợ #${ticketId}`);
          this.loadUserTickets();
        },
        error: (err) => this.toastService.error('Không thể đóng ticket: ' + err.message),
      });
    }
  }

  reopenTicketAction(ticketId: string): void {
    this.reopenTicket(ticketId).subscribe({
      next: () => {
        this.toastService.success(`Đã mở lại yêu cầu hỗ trợ #${ticketId}`);
        this.loadUserTickets();
      },
      error: (err) => this.toastService.error('Không thể mở lại ticket: ' + err.message),
    });
  }

  /**
   * [GET] /api/support/tickets/statistics - Lấy thống kê
   */
  getStatistics(): Observable<SupportStatsDto> {
    return this.http.get<SupportStatsDto>(`${this.userApiUrl}/tickets/statistics`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [POST] /api/support/attachments - Đính kèm tệp
   */
  uploadAttachment(file: File, ticketId?: number, messageId?: number): Observable<SupportAttachmentDto> {
    const formData = new FormData();
    formData.append('file', file);
    if (ticketId) formData.append('ticketId', ticketId.toString());
    if (messageId) formData.append('messageId', messageId.toString());

    return this.http.post<SupportAttachmentDto>(`${this.userApiUrl}/attachments`, formData).pipe(
      catchError(this.handleError)
    );
  }

  // ─── ADMIN APIS ────────────────────────────────────────────────────────────

  /**
   * [GET] /api/admin/support/tickets - Lấy danh sách ticket cho Admin
   */
  getAdminTickets(params?: AdminTicketQueryParams): Observable<PaginatedResultDto<SupportTicketDto>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.status !== undefined && params.status !== null) httpParams = httpParams.set('status', params.status);
      if (params.priority !== undefined && params.priority !== null) httpParams = httpParams.set('priority', params.priority);
      if (params.category !== undefined && params.category !== null) httpParams = httpParams.set('category', params.category);
      if (params.assignedToId) httpParams = httpParams.set('assignedToId', params.assignedToId);
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.size) httpParams = httpParams.set('size', params.size);
    }

    return this.http.get<PaginatedResultDto<SupportTicketDto>>(`${this.adminApiUrl}/tickets`, { params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [GET] /api/admin/support/tickets/{id} - Lấy chi tiết ticket cho Admin
   */
  getAdminTicketById(id: number | string): Observable<SupportTicketDetailDto> {
    return this.http.get<SupportTicketDetailDto>(`${this.adminApiUrl}/tickets/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [PATCH] /api/admin/support/tickets/{id}/assign - Phân công ticket
   */
  assignTicket(id: number | string, payload: AssignTicketRequest): Observable<SupportTicketDto> {
    return this.http.patch<SupportTicketDto>(`${this.adminApiUrl}/tickets/${id}/assign`, payload).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [PATCH] /api/admin/support/tickets/{id}/status - Cập nhật trạng thái
   */
  updateTicketStatus(id: number | string, payload: UpdateTicketStatusRequest): Observable<SupportTicketDto> {
    return this.http.patch<SupportTicketDto>(`${this.adminApiUrl}/tickets/${id}/status`, payload).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [PATCH] /api/admin/support/tickets/{id}/priority - Cập nhật mức ưu tiên
   */
  updateTicketPriority(id: number | string, payload: UpdateTicketPriorityRequest): Observable<SupportTicketDto> {
    return this.http.patch<SupportTicketDto>(`${this.adminApiUrl}/tickets/${id}/priority`, payload).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [POST] /api/admin/support/tickets/{id}/messages - Phản hồi tin nhắn Admin (multipart/form-data)
   */
  sendAdminMessage(id: number | string, content: string, attachmentFile?: File): Observable<SupportMessageDto> {
    const formData = new FormData();
    formData.append('Content', content);
    if (attachmentFile) {
      formData.append('Attachment', attachmentFile);
    }

    return this.http.post<SupportMessageDto>(`${this.adminApiUrl}/tickets/${id}/messages`, formData).pipe(
      catchError(this.handleError)
    );
  }

  // ─── HELPER MAPPER ─────────────────────────────────────────────────────────

  mapTicketDtoToModel(dto: SupportTicketDto | SupportTicketDetailDto): SupportTicket {
    const detailDto = dto as SupportTicketDetailDto;

    const messagesMapped: SupportMessage[] = (detailDto.messages || []).map((m) => ({
      id: String(m.id),
      ticketId: String(m.ticketId),
      senderId: m.senderId || (m.isFromAdmin ? 'admin' : 'user'),
      senderName: m.senderName || (m.isFromAdmin ? 'Quản trị viên' : 'Người dùng'),
      senderAvatar: m.senderAvatar,
      senderType: m.isFromAdmin ? 'support' : 'user',
      message: m.content || m.message || '',
      attachments: m.attachments?.map((att) => ({
        name: att.fileName || att.name || 'attachment',
        url: att.fileUrl || att.url || '',
        size: att.fileSize || att.size,
        type: att.contentType || att.type,
      })),
      createdAt: m.createdAt,
    }));

    const attachmentsMapped: SupportAttachment[] = (detailDto.attachments || []).map((att) => ({
      name: att.fileName || att.name || 'attachment',
      url: att.fileUrl || att.url || '',
      size: att.fileSize || att.size,
      type: att.contentType || att.type,
    }));

    return {
      id: String(dto.id),
      ticketCode: dto.ticketCode || `#SP-${dto.id}`,
      userId: dto.userId || '',
      userEmail: dto.userEmail || '',
      userName: dto.userName || 'User',
      title: dto.subject || dto.title || '',
      description: dto.description || '',
      category: typeof dto.category === 'number' ? categoryEnumToString(dto.category) : (dto.category as any),
      priority: typeof dto.priority === 'number' ? priorityEnumToString(dto.priority) : (dto.priority as any || 'normal'),
      status: typeof dto.status === 'number' ? statusEnumToString(dto.status) : (dto.status as any || 'pending'),
      attachments: attachmentsMapped,
      messages: messagesMapped,
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || dto.createdAt || new Date().toISOString(),
      resolvedAt: dto.resolvedAt,
    };
  }

  private handleError(error: any) {
    console.error('SupportService Error:', error);
    const message = error?.error?.message || error?.message || 'Có lỗi xảy ra khi kết nối tới máy chủ.';
    return throwError(() => new Error(message));
  }
}
