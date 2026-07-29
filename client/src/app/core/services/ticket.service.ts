import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  CreateSupportTicketDto,
  SendMessageDto,
  SupportAttachmentDto,
  SupportMessageDto,
  SupportTicketDetailDto,
  SupportTicketDto,
  SupportTicketStatisticsDto,
  PaginatedResultDto,
  UserTicketQueryDto,
  AdminTicketQueryDto,
} from '../../models/support-ticket.model';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly userBaseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/support-ticket`;
  private readonly adminBaseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/support-ticket`;

  /**
   * [GET] /api/support-ticket/statistics - Lấy thống kê số lượng Ticket của User
   */
  getStatistics(): Observable<SupportTicketStatisticsDto> {
    return this.http
      .get<SupportTicketStatisticsDto>(`${this.userBaseUrl}/statistics`)
      .pipe(catchError(this.handleError));
  }

  /**
   * [GET] /api/support-ticket - Lấy danh sách Ticket người dùng (phân trang & lọc)
   */
  getTickets(
    page: number = 1,
    size: number = 10,
    search?: string,
    status?: number,
    category?: number,
    priority?: number
  ): Observable<PaginatedResultDto<SupportTicketDto>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (status !== undefined && status !== null && status !== -1) {
      params = params.set('status', status);
    }
    if (category !== undefined && category !== null && category !== -1) {
      params = params.set('category', category);
    }
    if (priority !== undefined && priority !== null && priority !== -1) {
      params = params.set('priority', priority);
    }

    return this.http
      .get<PaginatedResultDto<SupportTicketDto>>(`${this.userBaseUrl}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * [GET] /api/support-ticket/{id} - Lấy chi tiết Ticket kèm tin nhắn & tệp đính kèm
   */
  getTicketDetail(id: number | string): Observable<SupportTicketDetailDto> {
    return this.http
      .get<SupportTicketDetailDto>(`${this.userBaseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getTicketById(id: number | string): Observable<SupportTicketDetailDto> {
    return this.getTicketDetail(id);
  }

  /**
   * [POST] /api/support-ticket - Tạo Ticket hỗ trợ mới
   */
  createTicket(dto: CreateSupportTicketDto): Observable<SupportTicketDto> {
    return this.http
      .post<SupportTicketDto>(`${this.userBaseUrl}`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * [POST] /api/support-ticket/{id}/messages - Gửi phản hồi trong Ticket
   */
  sendMessage(
    ticketId: number | string,
    dto: SendMessageDto
  ): Observable<SupportMessageDto> {
    return this.http
      .post<SupportMessageDto>(`${this.userBaseUrl}/${ticketId}/messages`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * [PATCH] /api/support-ticket/{id}/close - Đóng Ticket
   */
  closeTicket(ticketId: number | string): Observable<SupportTicketDto> {
    return this.http
      .patch<SupportTicketDto>(`${this.userBaseUrl}/${ticketId}/close`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * [PATCH] /api/support-ticket/{id}/reopen - Mở lại Ticket
   */
  reopenTicket(ticketId: number | string): Observable<SupportTicketDto> {
    return this.http
      .patch<SupportTicketDto>(`${this.userBaseUrl}/${ticketId}/reopen`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Admin API: [GET] /api/admin/support-ticket - QL toàn bộ Ticket (Admin)
   */
  getAdminTickets(query?: AdminTicketQueryDto): Observable<PaginatedResultDto<SupportTicketDto>> {
    let params = new HttpParams()
      .set('page', query?.page || 1)
      .set('size', query?.size || 10);
    if (query?.search?.trim()) params = params.set('search', query.search.trim());
    if (query?.status !== undefined && query?.status !== -1) params = params.set('status', query.status);
    if (query?.category !== undefined && query?.category !== -1) params = params.set('category', query.category);
    if (query?.priority !== undefined && query?.priority !== -1) params = params.set('priority', query.priority);
    if (query?.assignedToId) params = params.set('assignedToId', query.assignedToId);

    return this.http
      .get<PaginatedResultDto<SupportTicketDto>>(`${this.adminBaseUrl}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Admin API: Gán ticket cho Admin
   */
  assignTicket(ticketId: number | string, adminId: string): Observable<SupportTicketDto> {
    return this.http
      .post<SupportTicketDto>(`${this.adminBaseUrl}/${ticketId}/assign`, { adminId })
      .pipe(catchError(this.handleError));
  }

  /**
   * Admin API: Cập nhật trạng thái ticket
   */
  updateTicketStatus(ticketId: number | string, status: number): Observable<SupportTicketDto> {
    return this.http
      .put<SupportTicketDto>(`${this.adminBaseUrl}/${ticketId}/status`, { status })
      .pipe(catchError(this.handleError));
  }

  /**
   * Admin API: Cập nhật độ ưu tiên ticket
   */
  updateTicketPriority(ticketId: number | string, priority: number): Observable<SupportTicketDto> {
    return this.http
      .put<SupportTicketDto>(`${this.adminBaseUrl}/${ticketId}/priority`, { priority })
      .pipe(catchError(this.handleError));
  }

  /**
   * Admin API: Trả lời Ticket từ Admin
   */
  adminReplyTicket(ticketId: number | string, dto: SendMessageDto): Observable<SupportMessageDto> {
    return this.http
      .post<SupportMessageDto>(`${this.adminBaseUrl}/${ticketId}/reply`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * [POST] Upload attachment
   */
  uploadAttachment(
    file: File,
    ticketId?: number,
    messageId?: number
  ): Observable<SupportAttachmentDto> {
    const formData = new FormData();
    formData.append('file', file);
    if (ticketId !== undefined && ticketId !== null) {
      formData.append('ticketId', ticketId.toString());
    }
    if (messageId !== undefined && messageId !== null) {
      formData.append('messageId', messageId.toString());
    }

    return this.http
      .post<SupportAttachmentDto>(`${this.userBaseUrl}/attachments`, formData)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('TicketService Error:', error);
    const message =
      error?.error?.message ||
      error?.message ||
      'Có lỗi xảy ra khi kết nối tới Trung tâm Hỗ trợ.';
    return throwError(() => new Error(message));
  }
}
