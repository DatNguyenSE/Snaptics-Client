import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

export interface SystemStatus {
  maintenanceMode: boolean;
  title: string;
  message: string;
  estimatedCompletionTime?: string | null;
  showSupportButton: boolean;
}

const STORAGE_KEY = 'snaptics_system_status';

const DEFAULT_STATUS: SystemStatus = {
  maintenanceMode: false,
  title: 'Hệ thống đang được bảo trì',
  message: 'Chúng tôi đang nâng cấp hệ thống để mang đến trải nghiệm tốt hơn. Vui lòng quay lại sau.',
  estimatedCompletionTime: null,
  showSupportButton: true,
};

@Injectable({
  providedIn: 'root',
})
export class SystemStatusService {
  private http = inject(HttpClient);

  private readonly systemApiUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl + 'system'
    : environment.apiUrl + '/system';

  private readonly adminApiUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl + 'admin/system'
    : environment.apiUrl + '/admin/system';

  readonly status = signal<SystemStatus>(this.loadInitialStatus());
  readonly isChecking = signal<boolean>(false);

  private loadInitialStatus(): SystemStatus {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse cached system status:', e);
    }
    return DEFAULT_STATUS;
  }

  private saveToStorage(newStatus: SystemStatus): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStatus));
    } catch (e) {
      console.warn('Failed to save system status to cache:', e);
    }
  }

  /**
   * Fetches latest system status from public API GET /api/system/status.
   * Updates internal state and returns Observable<SystemStatus>.
   */
  checkStatus(): Observable<SystemStatus> {
    this.isChecking.set(true);

    return this.http.get<SystemStatus>(`${this.systemApiUrl}/status`).pipe(
      tap((res) => {
        if (res) {
          const updated: SystemStatus = {
            maintenanceMode: !!res.maintenanceMode,
            title: res.title || DEFAULT_STATUS.title,
            message: res.message || DEFAULT_STATUS.message,
            estimatedCompletionTime: res.estimatedCompletionTime || null,
            showSupportButton: res.showSupportButton ?? true,
          };
          this.status.set(updated);
          this.saveToStorage(updated);
        }
        this.isChecking.set(false);
      }),
      catchError(() => {
        // Fallback to current local state on network/API failure
        this.isChecking.set(false);
        return of(this.status());
      })
    );
  }

  /**
   * Admin endpoint to update maintenance settings via PATCH /api/admin/system/settings/maintenance.
   */
  updateMaintenanceSettings(settings: Partial<SystemStatus>): Observable<SystemStatus> {
    const payload: SystemStatus = {
      ...this.status(),
      ...settings,
    };

    return this.http
      .patch<SystemStatus>(`${this.adminApiUrl}/settings/maintenance`, payload)
      .pipe(
        tap((res) => {
          const updated = res || payload;
          this.status.set(updated);
          this.saveToStorage(updated);
        }),
        catchError(() => {
          // If backend API isn't reachble, update local signal & storage directly for dev/preview
          this.status.set(payload);
          this.saveToStorage(payload);
          return of(payload);
        })
      );
  }
}
