import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  TicketDto,
  CreateTicketDto,
  UpdateTicketDto,
  SupportTicketDto,
  SupportTicketDetailDto,
  PaginatedResultDto,
  CreateTicketRequest,
} from '../../models/ticket.dto';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/support/tickets`;

  /**
   * [GET] /api/support/tickets - Lấy danh sách Ticket
   */
  getTickets(page = 1, size = 10, search?: string, status?: number): Observable<PaginatedResultDto<SupportTicketDto> | SupportTicketDto[]> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    if (status !== undefined && status !== null) params = params.set('status', status);

    return this.http.get<PaginatedResultDto<SupportTicketDto> | SupportTicketDto[]>(this.baseUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [GET] /api/support/tickets/{id} - Xem chi tiết Ticket
   */
  getTicketById(id: number | string): Observable<SupportTicketDetailDto> {
    return this.http.get<SupportTicketDetailDto>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [POST] /api/support/tickets - Tạo Ticket mới
   */
  createTicket(dto: CreateTicketDto | CreateTicketRequest): Observable<SupportTicketDto> {
    const payload: CreateTicketRequest = {
      subject: (dto as any).subject || (dto as any).title,
      description: dto.description || '',
      category: typeof dto.category === 'number' ? dto.category : 0,
    };
    return this.http.post<SupportTicketDto>(this.baseUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [PATCH] /api/support/tickets/{id}/close - Đóng Ticket
   */
  closeTicket(id: number | string): Observable<SupportTicketDto> {
    return this.http.patch<SupportTicketDto>(`${this.baseUrl}/${id}/close`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [PATCH] /api/support/tickets/{id}/reopen - Mở lại Ticket
   */
  reopenTicket(id: number | string): Observable<SupportTicketDto> {
    return this.http.patch<SupportTicketDto>(`${this.baseUrl}/${id}/reopen`, {}).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('TicketService API Error:', error);
    const message = error?.error?.message || error?.message || 'Có lỗi xảy ra khi kết nối tới máy chủ Ticket.';
    return throwError(() => new Error(message));
  }
}
