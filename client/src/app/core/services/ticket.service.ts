import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { TicketDto, CreateTicketDto, UpdateTicketDto } from '../../models/ticket.dto';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  // URL endpoint: /api/tickets (dựa trên environment.apiUrl)
  private baseUrl = environment.apiUrl + 'tickets';

  /**
   * [GET] /api/tickets - Lấy danh sách Ticket
   */
  getTickets(): Observable<TicketDto[]> {
    return this.http.get<TicketDto[]>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [GET] /api/tickets/{id} - Xem chi tiết Ticket
   */
  getTicketById(id: number | string): Observable<TicketDto> {
    return this.http.get<TicketDto>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [POST] /api/tickets - Tạo Ticket mới
   */
  createTicket(dto: CreateTicketDto): Observable<TicketDto> {
    return this.http.post<TicketDto>(this.baseUrl, dto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [PUT] /api/tickets/{id} - Cập nhật Ticket (thông tin / trạng thái)
   */
  updateTicket(id: number | string, dto: UpdateTicketDto): Observable<TicketDto> {
    return this.http.put<TicketDto>(`${this.baseUrl}/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * [DELETE] /api/tickets/{id} - Xóa Ticket
   */
  deleteTicket(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('TicketService API Error:', error);
    const message = error?.error?.message || error?.message || 'Có lỗi xảy ra khi kết nối tới máy chủ Ticket.';
    return throwError(() => new Error(message));
  }
}
