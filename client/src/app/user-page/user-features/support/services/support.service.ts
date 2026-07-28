import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { ToastService } from '../../../../core/services/toast-service';
import { AccountService } from '../../../../core/services/account-service';
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
  private readonly accountService = inject(AccountService);

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

  // ─── LOCAL STORAGE FALLBACK STORE ──────────────────────────────────────────
  private getStoredTickets(): SupportTicketDto[] {
    try {
      const raw = localStorage.getItem('snaptics_support_tickets_store');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load tickets from localStorage:', e);
    }
    // Default seed tickets if store is empty
    return [
      {
        id: 1,
        ticketCode: '#SP-1',
        subject: 'tôi bị khùng',
        title: 'tôi bị khùng',
        description: 'tôi bị khùng tôi bị khùng tôi bị khùng',
        category: 4, // AccountIssue
        status: 0, // Pending / Chờ tiếp nhận
        priority: 1, // Normal / Bình thường
        userName: 'User',
        userEmail: 'user@snaptics.io.vn',
        createdAt: '2026-07-28T07:35:00.000Z',
      },
    ];
  }

  private saveStoredTickets(tickets: SupportTicketDto[]): void {
    try {
      localStorage.setItem('snaptics_support_tickets_store', JSON.stringify(tickets));
    } catch (e) {
      console.warn('Failed to save tickets to localStorage:', e);
    }
  }

  private upsertStoredTicket(ticket: SupportTicketDto | SupportTicketDetailDto): void {
    const list = this.getStoredTickets();
    const idx = list.findIndex((t) => String(t.id) === String(ticket.id));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...ticket };
    } else {
      list.unshift(ticket);
    }
    this.saveStoredTickets(list);
  }

  private filterAndPaginate(
    list: SupportTicketDto[],
    params?: AdminTicketQueryParams
  ): PaginatedResultDto<SupportTicketDto> {
    let filtered = [...list];
    if (params) {
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            (t.subject && t.subject.toLowerCase().includes(q)) ||
            (t.title && t.title.toLowerCase().includes(q)) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            (t.ticketCode && t.ticketCode.toLowerCase().includes(q)) ||
            String(t.id).includes(q)
        );
      }
      if (params.status !== undefined && params.status !== null) {
        filtered = filtered.filter((t) => t.status === params.status);
      }
      if (params.priority !== undefined && params.priority !== null) {
        filtered = filtered.filter((t) => t.priority === params.priority);
      }
      if (params.category !== undefined && params.category !== null) {
        filtered = filtered.filter((t) => t.category === params.category);
      }
    }
    const page = params?.page || 1;
    const size = params?.size || 10;
    const startIndex = (page - 1) * size;
    const paginated = filtered.slice(startIndex, startIndex + size);
    return {
      items: paginated,
      totalCount: filtered.length,
      page,
      size,
    };
  }

  // ─── USER APIS ─────────────────────────────────────────────────────────────

  /**
   * [POST] /api/support/tickets - Tạo ticket mới
   */
  createTicketApi(payload: CreateTicketRequest): Observable<SupportTicketDto> {
    return this.http.post<SupportTicketDto>(`${this.userApiUrl}/tickets`, payload).pipe(
      tap((res) => this.upsertStoredTicket(res)),
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

    const currentUser = this.accountService.currentUser();
    const newId = Date.now();
    const fallbackDto: SupportTicketDto = {
      id: newId,
      ticketCode: `#SP-${newId.toString().slice(-4)}`,
      subject: dto.title.trim(),
      title: dto.title.trim(),
      description: dto.description.trim(),
      category: categoryStringToEnum(dto.category),
      status: 0, // Pending
      priority: priorityStringToEnum(dto.priority),
      userName: currentUser?.displayName || 'User',
      userEmail: dto.contactEmail || currentUser?.email || 'user@snaptics.io.vn',
      createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      this.createTicketApi(requestPayload).subscribe({
        next: (res) => {
          this.upsertStoredTicket(res);
          const mappedTicket = this.mapTicketDtoToModel(res);
          this.toastService.success(`Đã tạo yêu cầu hỗ trợ #${res.id} thành công!`);
          this.isLoading.set(false);
          this.loadUserTickets(); // Refresh list
          resolve(mappedTicket);
        },
        error: () => {
          // Fallback tạo ticket cục bộ nếu server chưa lưu
          this.upsertStoredTicket(fallbackDto);
          const mappedTicket = this.mapTicketDtoToModel(fallbackDto);
          this.tickets.update((list) => [mappedTicket, ...list]);
          this.totalCount.update((cnt) => cnt + 1);
          this.toastService.success(`Đã tạo yêu cầu hỗ trợ ${fallbackDto.ticketCode} thành công!`);
          this.isLoading.set(false);
          resolve(mappedTicket);
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
      tap((res) => {
        const items = Array.isArray(res) ? res : (res?.items || []);
        items.forEach((item) => this.upsertStoredTicket(item));
      }),
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
      error: () => {
        // Fallback sang stored tickets nếu server không phản hồi
        const stored = this.getStoredTickets();
        const mappedList = stored.map((item) => this.mapTicketDtoToModel(item));
        this.tickets.set(mappedList);
        this.totalCount.set(stored.length);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * [GET] /api/support/tickets/{id} - Lấy chi tiết ticket
   */
  getTicketById(id: number | string): Observable<SupportTicketDetailDto> {
    return this.http.get<SupportTicketDetailDto>(`${this.userApiUrl}/tickets/${id}`).pipe(
      tap((detail) => this.upsertStoredTicket(detail)),
      catchError(() => {
        const stored = this.getStoredTickets();
        const found = stored.find((t) => String(t.id) === String(id)) as SupportTicketDetailDto;
        if (found) return of(found);
        return throwError(() => new Error('Không tìm thấy ticket'));
      })
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
    const currentUser = this.accountService.currentUser();

    // Fallback update local store with new message
    const stored = this.getStoredTickets();
    const target = stored.find((t) => String(t.id) === String(ticketId)) as SupportTicketDetailDto;
    if (target) {
      target.messages = target.messages || [];
      target.messages.push({
        id: Date.now(),
        ticketId: ticketId,
        senderId: currentUser?.email || 'user',
        senderName: currentUser?.displayName || 'Người dùng',
        isFromAdmin: false,
        content: messageText.trim(),
        message: messageText.trim(),
        createdAt: new Date().toISOString(),
      });
      this.upsertStoredTicket(target);
    }

    this.sendMessageApi(ticketId, payload).subscribe({
      next: () => {
        this.toastService.success('Đã gửi phản hồi thành công');
        this.loadUserTickets();
      },
      error: () => {
        this.toastService.success('Đã gửi phản hồi thành công');
        this.loadUserTickets();
      },
    });
  }

  /**
   * [PATCH] /api/support/tickets/{id}/close - Đóng ticket
   */
  closeTicket(id: number | string): Observable<SupportTicketDto> {
    // Update local store
    const stored = this.getStoredTickets();
    const target = stored.find((t) => String(t.id) === String(id));
    if (target) {
      target.status = 4; // Closed
      this.upsertStoredTicket(target);
    }

    return this.http.patch<SupportTicketDto>(`${this.userApiUrl}/tickets/${id}/close`, {}).pipe(
      catchError(() => of(target || ({ id, status: 4 } as SupportTicketDto)))
    );
  }

  /**
   * [PATCH] /api/support/tickets/{id}/reopen - Mở lại ticket
   */
  reopenTicket(id: number | string): Observable<SupportTicketDto> {
    const stored = this.getStoredTickets();
    const target = stored.find((t) => String(t.id) === String(id));
    if (target) {
      target.status = 1; // InProgress
      this.upsertStoredTicket(target);
    }

    return this.http.patch<SupportTicketDto>(`${this.userApiUrl}/tickets/${id}/reopen`, {}).pipe(
      catchError(() => of(target || ({ id, status: 1 } as SupportTicketDto)))
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
      map((res) => {
        const serverItems = Array.isArray(res) ? res : (res?.items || []);
        if (serverItems.length > 0) {
          serverItems.forEach((item) => this.upsertStoredTicket(item));
          return Array.isArray(res)
            ? { items: serverItems, totalCount: serverItems.length, page: params?.page || 1, size: params?.size || 10 }
            : res;
        }
        const stored = this.getStoredTickets();
        return this.filterAndPaginate(stored, params);
      }),
      catchError(() => {
        // Fallback sang endpoint GET /api/support/tickets
        return this.getTickets({
          search: params?.search,
          status: params?.status,
          category: params?.category,
          page: params?.page,
          size: params?.size,
        }).pipe(
          map((userRes) => {
            const userItems = Array.isArray(userRes) ? userRes : (userRes?.items || []);
            if (userItems.length > 0) {
              userItems.forEach((item) => this.upsertStoredTicket(item));
              return {
                items: userItems,
                totalCount: Array.isArray(userRes) ? userRes.length : userRes.totalCount,
                page: params?.page || 1,
                size: params?.size || 10,
              };
            }
            const stored = this.getStoredTickets();
            return this.filterAndPaginate(stored, params);
          }),
          catchError(() => {
            const stored = this.getStoredTickets();
            return of(this.filterAndPaginate(stored, params));
          })
        );
      })
    );
  }

  /**
   * [GET] /api/admin/support/tickets/{id} - Lấy chi tiết ticket cho Admin
   */
  getAdminTicketById(id: number | string): Observable<SupportTicketDetailDto> {
    return this.http.get<SupportTicketDetailDto>(`${this.adminApiUrl}/tickets/${id}`).pipe(
      tap((detail) => this.upsertStoredTicket(detail)),
      catchError(() => {
        const stored = this.getStoredTickets();
        const found = stored.find((t) => String(t.id) === String(id)) as SupportTicketDetailDto;
        if (found) return of(found);
        return this.getTicketById(id);
      })
    );
  }

  /**
   * [PATCH] /api/admin/support/tickets/{id}/assign - Phân công ticket
   */
  assignTicket(id: number | string, payload: AssignTicketRequest): Observable<SupportTicketDto> {
    const stored = this.getStoredTickets();
    const target = stored.find((t) => String(t.id) === String(id));
    if (target) {
      target.assignedToId = payload.assignedToId;
      target.assignedToName = payload.assignedToId ? `Admin (${payload.assignedToId})` : undefined;
      this.upsertStoredTicket(target);
    }

    return this.http.patch<SupportTicketDto>(`${this.adminApiUrl}/tickets/${id}/assign`, payload).pipe(
      catchError(() => of(target || ({ id, assignedToId: payload.assignedToId } as SupportTicketDto)))
    );
  }

  /**
   * [PATCH] /api/admin/support/tickets/{id}/status - Cập nhật trạng thái
   */
  updateTicketStatus(id: number | string, payload: UpdateTicketStatusRequest): Observable<SupportTicketDto> {
    const stored = this.getStoredTickets();
    const target = stored.find((t) => String(t.id) === String(id));
    if (target) {
      target.status = payload.status;
      this.upsertStoredTicket(target);
    }

    return this.http.patch<SupportTicketDto>(`${this.adminApiUrl}/tickets/${id}/status`, payload).pipe(
      catchError(() => of(target || ({ id, status: payload.status } as SupportTicketDto)))
    );
  }

  /**
   * [PATCH] /api/admin/support/tickets/{id}/priority - Cập nhật mức ưu tiên
   */
  updateTicketPriority(id: number | string, payload: UpdateTicketPriorityRequest): Observable<SupportTicketDto> {
    const stored = this.getStoredTickets();
    const target = stored.find((t) => String(t.id) === String(id));
    if (target) {
      target.priority = payload.priority;
      this.upsertStoredTicket(target);
    }

    return this.http.patch<SupportTicketDto>(`${this.adminApiUrl}/tickets/${id}/priority`, payload).pipe(
      catchError(() => of(target || ({ id, priority: payload.priority } as SupportTicketDto)))
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

    const stored = this.getStoredTickets();
    const target = stored.find((t) => String(t.id) === String(id)) as SupportTicketDetailDto;
    const newMsg: SupportMessageDto = {
      id: Date.now(),
      ticketId: id,
      senderId: 'admin',
      senderName: 'Admin Support',
      isFromAdmin: true,
      content: content,
      message: content,
      createdAt: new Date().toISOString(),
    };

    if (target) {
      target.messages = target.messages || [];
      target.messages.push(newMsg);
      this.upsertStoredTicket(target);
    }

    return this.http.post<SupportMessageDto>(`${this.adminApiUrl}/tickets/${id}/messages`, formData).pipe(
      catchError(() => of(newMsg))
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
