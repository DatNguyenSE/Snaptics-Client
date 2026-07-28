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
} from '../../models/support-ticket.model';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/support`;

  /**
   * [GET] /api/support/tickets/statistics - Lấy thống kê số lượng Ticket
   */
  getStatistics(): Observable<SupportTicketStatisticsDto> {
    return this.http
      .get<SupportTicketStatisticsDto>(`${this.baseUrl}/tickets/statistics`)
      .pipe(catchError(this.handleError));
  }

  /**
   * [GET] /api/support/tickets - Lấy danh sách Ticket có phân trang và bộ lọc
   */
  getTickets(
    page: number = 1,
    size: number = 10,
    search?: string,
    status?: number,
    category?: number
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

    return this.http
      .get<PaginatedResultDto<SupportTicketDto>>(`${this.baseUrl}/tickets`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * [GET] /api/support/tickets/{id} - Lấy chi tiết Ticket cùng danh sách tin nhắn & đính kèm
   */
  getTicketDetail(id: number | string): Observable<SupportTicketDetailDto> {
    return this.http
      .get<SupportTicketDetailDto>(`${this.baseUrl}/tickets/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Alias cho getTicketDetail để tương thích ngược
   */
  getTicketById(id: number | string): Observable<SupportTicketDetailDto> {
    return this.getTicketDetail(id);
  }

  /**
   * [POST] /api/support/tickets - Tạo Ticket hỗ trợ mới
   */
  createTicket(dto: CreateSupportTicketDto): Observable<SupportTicketDto> {
    return this.http
      .post<SupportTicketDto>(`${this.baseUrl}/tickets`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * [POST] /api/support/tickets/{id}/messages - Gửi phản hồi/tin nhắn vào Ticket
   */
  sendMessage(
    ticketId: number | string,
    dto: SendMessageDto
  ): Observable<SupportMessageDto> {
    return this.http
      .post<SupportMessageDto>(`${this.baseUrl}/tickets/${ticketId}/messages`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * [PATCH] /api/support/tickets/{id}/close - Đóng Ticket
   */
  closeTicket(ticketId: number | string): Observable<SupportTicketDto> {
    return this.http
      .patch<SupportTicketDto>(`${this.baseUrl}/tickets/${ticketId}/close`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * [PATCH] /api/support/tickets/{id}/reopen - Mở lại Ticket đã đóng
   */
  reopenTicket(ticketId: number | string): Observable<SupportTicketDto> {
    return this.http
      .patch<SupportTicketDto>(`${this.baseUrl}/tickets/${ticketId}/reopen`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * [POST] /api/support/attachments - Đính kèm tệp cho Ticket hoặc Message (FormData)
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
      .post<SupportAttachmentDto>(`${this.baseUrl}/attachments`, formData)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('TicketService Error:', error);
    const message =
      error?.error?.message ||
      error?.message ||
      'Có lỗi xảy ra khi kết nối tới máy chủ Trung tâm Hỗ trợ.';
    return throwError(() => new Error(message));
  }
}
