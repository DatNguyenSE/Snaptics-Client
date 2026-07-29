import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay, Observable, catchError, tap } from 'rxjs';
import { SystemSettings } from '../models/admin.models';
import { AuditLogService } from './audit-log.service';
import { environment } from '../../environments/environment';

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  ai: {
    enableSnapticsAi: true,
    enableReceiptScan: true,
    enableProductScan: true,
    aiModelVersion: 'gpt-4o-mini',
    dailyAiLimit: 50,
    dailyScanLimit: 20,
    confidenceThreshold: 75,
  },
  storage: {
    maxUploadSizeMb: 10,
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf'],
    receiptRetentionDays: 365,
    storageWarningThresholdGb: 80,
  },
  security: {
    maxLoginAttempts: 5,
    sessionDurationMinutes: 10080,
    adminSessionDurationMinutes: 480,
    requireAdminTwoFactor: false,
    sensitiveAccessDurationMinutes: 30,
  },
  maintenance: {
    maintenanceMode: false,
    maintenanceTitle: 'Hệ thống đang được bảo trì',
    maintenanceMessage: 'Chúng tôi đang nâng cấp hệ thống để mang đến trải nghiệm tốt hơn. Vui lòng quay lại sau.',
    estimatedCompletionTime: null,
    showSupportButton: true,
    scheduledMaintenance: undefined,
    featureFlags: {
      enableBudgetV2: true,
      enableAiInsights: true,
      enableReceiptHistory: false,
      enableMultiCurrency: false,
    },
  },
};

@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private readonly http = inject(HttpClient);
  private readonly auditLog = inject(AuditLogService);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/system/maintenance`;

  private readonly _settings = signal<SystemSettings>(structuredClone(DEFAULT_SYSTEM_SETTINGS));
  private readonly _saving = signal<boolean>(false);

  readonly settings = this._settings.asReadonly();
  readonly saving = this._saving.asReadonly();

  getMaintenanceStatus(): Observable<any> {
    return this.http.get<any>(this.baseUrl, { withCredentials: true }).pipe(
      tap((res) => {
        if (res && res.maintenanceMode !== undefined) {
          this._settings.update((s) => ({
            ...s,
            maintenance: {
              ...s.maintenance,
              maintenanceMode: res.maintenanceMode,
              maintenanceMessage: res.maintenanceMessage || s.maintenance.maintenanceMessage,
            },
          }));
        }
      }),
      catchError(() => of({ maintenanceMode: this._settings().maintenance.maintenanceMode }))
    );
  }

  toggleMaintenanceMode(enabled: boolean, message?: string): Observable<any> {
    return this.http.post<any>(this.baseUrl, { enabled, message }, { withCredentials: true }).pipe(
      tap(() => {
        this._settings.update((s) => ({
          ...s,
          maintenance: {
            ...s.maintenance,
            maintenanceMode: enabled,
            maintenanceMessage: message || s.maintenance.maintenanceMessage,
          },
        }));
      }),
      catchError((err) => {
        // Fallback update local state if backend API is offline
        this._settings.update((s) => ({
          ...s,
          maintenance: {
            ...s.maintenance,
            maintenanceMode: enabled,
          },
        }));
        return of({ success: true });
      })
    );
  }

  getSettings() {
    return of(structuredClone(this._settings())).pipe(delay(300));
  }

  saveSettings(section: keyof SystemSettings, changes: Partial<SystemSettings[typeof section]>, reason: string): void {
    this._saving.set(true);

    const before = { ...this._settings()[section] };

    this._settings.update((s) => ({
      ...s,
      [section]: { ...s[section], ...changes },
    }));

    const maintenanceChanges = changes as any;
    if (section === 'maintenance' && maintenanceChanges.maintenanceMode !== undefined) {
      this.toggleMaintenanceMode(maintenanceChanges.maintenanceMode as boolean, maintenanceChanges.maintenanceMessage).subscribe();
    }

    this.auditLog.addLog({
      action: 'Change System Setting',
      target: `${section} settings`,
      reason,
      riskLevel: 'high',
      beforeValue: before as Record<string, unknown>,
      afterValue: changes as Record<string, unknown>,
    });

    setTimeout(() => this._saving.set(false), 600);
  }
}
