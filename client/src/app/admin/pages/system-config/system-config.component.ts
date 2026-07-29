import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminHangfireService, UpdateHangfireScheduleRequest } from '../../services/admin-hangfire.service';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-admin-system-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-config.component.html',
  styleUrl: './system-config.component.css'
})
export class SystemConfigComponent {
  private readonly hangfireService = inject(AdminHangfireService);
  private readonly toast = inject(ToastService);

  // Time states
  rolloverTime: UpdateHangfireScheduleRequest = { hour: 0, minute: 0 };
  reviewTime: UpdateHangfireScheduleRequest = { hour: 20, minute: 0 };
  cleanupTime: UpdateHangfireScheduleRequest = { hour: 3, minute: 0 };

  isSavingRollover = false;
  isSavingReview = false;
  isSavingCleanup = false;

  isTriggeringRollover = false;
  isTriggeringReview = false;
  isTriggeringCleanup = false;

  // 1. Periodic Rollover
  saveRolloverSchedule() {
    this.isSavingRollover = true;
    this.hangfireService.updatePeriodicRolloverSchedule(this.rolloverTime).subscribe({
      next: (res) => {
        this.toast.success('Cập nhật cấu hình gia hạn ví định kỳ thành công.');
        this.isSavingRollover = false;
      },
      error: () => {
        this.toast.error('Lỗi khi cập nhật cấu hình.');
        this.isSavingRollover = false;
      }
    });
  }

  triggerRollover() {
    this.isTriggeringRollover = true;
    this.hangfireService.triggerPeriodicRollover().subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Gia hạn ví đã được kích hoạt thành công.');
        this.isTriggeringRollover = false;
      },
      error: () => {
        this.toast.error('Lỗi khi kích hoạt gia hạn ví.');
        this.isTriggeringRollover = false;
      }
    });
  }

  // 2. Item Review
  saveReviewSchedule() {
    this.isSavingReview = true;
    this.hangfireService.updateItemReviewSchedule(this.reviewTime).subscribe({
      next: (res) => {
        this.toast.success('Cập nhật cấu hình nhắc nhở đánh giá thành công.');
        this.isSavingReview = false;
      },
      error: () => {
        this.toast.error('Lỗi khi cập nhật cấu hình.');
        this.isSavingReview = false;
      }
    });
  }

  triggerReview() {
    this.isTriggeringReview = true;
    this.hangfireService.triggerItemReview().subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Nhắc nhở đánh giá đã được kích hoạt.');
        this.isTriggeringReview = false;
      },
      error: () => {
        this.toast.error('Lỗi khi kích hoạt nhắc nhở đánh giá.');
        this.isTriggeringReview = false;
      }
    });
  }

  // 3. Cleanup Notifications
  saveCleanupSchedule() {
    this.isSavingCleanup = true;
    this.hangfireService.updateCleanupSchedule(this.cleanupTime).subscribe({
      next: (res) => {
        this.toast.success('Cập nhật cấu hình dọn dẹp hệ thống thành công.');
        this.isSavingCleanup = false;
      },
      error: () => {
        this.toast.error('Lỗi khi cập nhật cấu hình.');
        this.isSavingCleanup = false;
      }
    });
  }

  triggerCleanup() {
    this.isTriggeringCleanup = true;
    this.hangfireService.triggerCleanup().subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Dọn dẹp hệ thống đã được kích hoạt.');
        this.isTriggeringCleanup = false;
      },
      error: () => {
        this.toast.error('Lỗi khi kích hoạt dọn dẹp.');
        this.isTriggeringCleanup = false;
      }
    });
  }
}
