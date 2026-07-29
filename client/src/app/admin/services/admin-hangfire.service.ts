import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface UpdateHangfireScheduleRequest {
  hour: number;
  minute: number;
}

@Injectable({ providedIn: 'root' })
export class AdminHangfireService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/hangfire-config`;

  // 1. Periodic Rollover
  updatePeriodicRolloverSchedule(request: UpdateHangfireScheduleRequest) {
    return this.http.post<{ message: string; cron: string }>(`${this.baseUrl}/periodic-rollover`, request, { withCredentials: true });
  }

  triggerPeriodicRollover() {
    return this.http.post<{ message: string }>(`${this.baseUrl}/trigger/periodic-rollover`, null, { withCredentials: true });
  }

  // 2. Item Review
  updateItemReviewSchedule(request: UpdateHangfireScheduleRequest) {
    return this.http.post<{ message: string; cron: string }>(`${this.baseUrl}/item-review`, request, { withCredentials: true });
  }

  triggerItemReview() {
    return this.http.post<{ message: string }>(`${this.baseUrl}/trigger/item-review`, null, { withCredentials: true });
  }

  // 3. Cleanup Notifications
  updateCleanupSchedule(request: UpdateHangfireScheduleRequest) {
    return this.http.post<{ message: string; cron: string }>(`${this.baseUrl}/cleanup`, request, { withCredentials: true });
  }

  triggerCleanup() {
    return this.http.post<{ message: string }>(`${this.baseUrl}/trigger/cleanup`, null, { withCredentials: true });
  }
}
