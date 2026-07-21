import { Injectable, signal } from '@angular/core';
import { of, delay } from 'rxjs';
import { SystemSettings } from '../models/admin.models';
import { MOCK_SYSTEM_SETTINGS } from '../data/admin-mock-data';
import { AuditLogService } from './audit-log.service';
import { inject } from '@angular/core';

// TODO: Replace mock implementation with Admin API.
// GET /api/admin/settings
// PUT /api/admin/settings

@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private readonly auditLog = inject(AuditLogService);
  private readonly _settings = signal<SystemSettings>(structuredClone(MOCK_SYSTEM_SETTINGS));
  private readonly _saving = signal<boolean>(false);

  readonly settings = this._settings.asReadonly();
  readonly saving = this._saving.asReadonly();

  getSettings() {
    return of(structuredClone(MOCK_SYSTEM_SETTINGS)).pipe(delay(300));
  }

  saveSettings(section: keyof SystemSettings, changes: Partial<SystemSettings[typeof section]>, reason: string): void {
    this._saving.set(true);

    const before = { ...this._settings()[section] };

    this._settings.update((s) => ({
      ...s,
      [section]: { ...s[section], ...changes },
    }));

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
