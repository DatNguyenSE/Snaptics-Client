import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../core/services/ticket.service';
import { ToastService } from '../../core/services/toast-service';
import { TicketDto, CreateTicketDto } from '../../models/ticket.dto';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.css'
})
export class TicketComponent implements OnInit {
  private ticketService = inject(TicketService);
  private toastService = inject(ToastService);

  // State Management với Signals
  tickets = signal<TicketDto[]>([]);
  selectedTicket = signal<TicketDto | null>(null);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Modal Controls
  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  // Form Binding Model
  formModel: {
    id?: number | string;
    title: string;
    description: string;
    priority: string;
    status: string;
  } = {
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Open'
  };

  ngOnInit(): void {
    this.loadTickets();
  }

  /** [GET] Lấy danh sách Ticket */
  loadTickets(): void {
    this.isLoading.set(true);
    this.ticketService.getTickets().subscribe({
      next: (res) => {
        let items: any[] = [];
        if (Array.isArray(res)) {
          items = res;
        } else if (res && Array.isArray((res as any).items)) {
          items = (res as any).items;
        }
        this.tickets.set(items || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error('Không thể tải danh sách Ticket: ' + err.message);
      }
    });
  }

  /** [GET] Xem chi tiết Ticket */
  viewDetail(id: number | string): void {
    this.isLoading.set(true);
    this.ticketService.getTicketById(id).subscribe({
      next: (ticket: any) => {
        this.selectedTicket.set({
          id: ticket.id,
          title: ticket.subject || ticket.title || '',
          description: ticket.description || '',
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.createdAt,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error('Lỗi tải chi tiết Ticket: ' + err.message);
      }
    });
  }

  /** Mở Dialog Tạo Ticket */
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.formModel = {
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Open'
    };
    this.isModalOpen.set(true);
  }

  /** Mở Dialog Chỉnh Sửa Ticket */
  openEditModal(ticket: TicketDto): void {
    this.isEditMode.set(true);
    this.formModel = {
      id: ticket.id,
      title: ticket.title || ticket.subject || '',
      description: ticket.description || '',
      priority: typeof ticket.priority === 'string' ? ticket.priority : 'Medium',
      status: typeof ticket.status === 'string' ? ticket.status : 'Open',
    };
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  /** [POST] Xử lý submit Form */
  onSubmit(): void {
    if (!this.formModel.title.trim()) {
      this.toastService.warning('Vui lòng nhập tiêu đề Ticket!');
      return;
    }

    this.isSubmitting.set(true);

    const createDto: CreateTicketDto = {
      title: this.formModel.title,
      description: this.formModel.description,
      priority: this.formModel.priority
    };

    this.ticketService.createTicket(createDto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.success('Tạo Ticket mới thành công!');
        this.closeModal();
        this.loadTickets();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.error('Tạo Ticket thất bại: ' + err.message);
      }
    });
  }

  /** [PATCH] Đóng Ticket */
  closeTicket(id: number | string): void {
    this.isLoading.set(true);
    this.ticketService.closeTicket(id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.success('Đã đóng Ticket thành công!');
        this.loadTickets();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error('Đóng Ticket thất bại: ' + err.message);
      }
    });
  }

  deleteTicket(id: number | string, title: string): void {
    this.closeTicket(id);
  }
}
