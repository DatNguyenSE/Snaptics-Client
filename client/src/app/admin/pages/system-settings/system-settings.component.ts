import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSettingsService } from '../../services/admin-settings.service';
import { SystemSettings } from '../../models/admin.models';
import { ConfirmationModalComponent, ConfirmModalConfig } from '../../components/confirmation-modal/confirmation-modal.component';
import { ToastService } from '../../../core/services/toast-service';
import { SystemStatusService } from '../../../core/services/system-status.service';

type SettingsTab = 'general' | 'ai' | 'security' | 'features';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.css',
})
export class SystemSettingsComponent implements OnInit {
  private readonly settingsService = inject(AdminSettingsService);
  private readonly statusService = inject(SystemStatusService);
  private readonly toast = inject(ToastService);

  loading = true;
  saving = false;
  activeTab: SettingsTab = 'general';
  isPreviewOpen = false;

  settings!: SystemSettings;

  confirmModal: { open: boolean; config: ConfirmModalConfig; action?: (reason: string) => void } = {
    open: false,
    config: { title: '', description: '' },
  };

  readonly tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'general', label: 'General & Maintenance', icon: 'settings' },
    { id: 'ai', label: 'AI Engine Limits', icon: 'smart_toy' },
    { id: 'security', label: 'Security & Auth', icon: 'security' },
    { id: 'features', label: 'Feature Flags', icon: 'toggle_on' },
  ];

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe((s) => {
      this.settings = s;

      // Sync active maintenance status from SystemStatusService
      const status = this.statusService.status();
      this.settings.maintenance.maintenanceMode = status.maintenanceMode;
      this.settings.maintenance.maintenanceTitle = status.title;
      this.settings.maintenance.maintenanceMessage = status.message;
      this.settings.maintenance.estimatedCompletionTime = status.estimatedCompletionTime;
      this.settings.maintenance.showSupportButton = status.showSupportButton;

      this.loading = false;
    });
  }

  setTab(tab: SettingsTab): void {
    this.activeTab = tab;
  }

  openPreview(): void {
    this.isPreviewOpen = true;
  }

  closePreview(): void {
    this.isPreviewOpen = false;
  }

  saveSection(section: keyof SystemSettings, title: string): void {
    this.confirmModal = {
      open: true,
      config: {
        title: `Lưu cấu hình ${title}`,
        description: section === 'maintenance'
          ? 'Thay đổi chế độ bảo trì sẽ ảnh hưởng trực tiếp tới quyền truy cập của người dùng trên toàn hệ thống.'
          : 'Thay đổi sẽ được áp dụng vào giới hạn vận hành của hệ thống và ghi nhận trong Audit Logs.',
        confirmLabel: 'Xác nhận lưu',
        isDangerous: section === 'maintenance' || section === 'security',
        requireReason: true,
      },
      action: (reason) => {
        this.settingsService.saveSettings(section, this.settings[section], reason);

        if (section === 'maintenance') {
          // Sync changes to SystemStatusService so guards and maintenance page pick it up immediately
          this.statusService.updateMaintenanceSettings({
            maintenanceMode: this.settings.maintenance.maintenanceMode,
            title: this.settings.maintenance.maintenanceTitle || 'Hệ thống đang được bảo trì',
            message: this.settings.maintenance.maintenanceMessage || 'Chúng tôi đang nâng cấp hệ thống để mang đến trải nghiệm tốt hơn. Vui lòng quay lại sau.',
            estimatedCompletionTime: this.settings.maintenance.estimatedCompletionTime,
            showSupportButton: this.settings.maintenance.showSupportButton ?? true,
          }).subscribe();
        }

        this.toast.success(`Cập nhật cài đặt ${title} thành công.`);
      },
    };
  }

  onModalConfirm(event: { reason: string }): void {
    if (this.confirmModal.action) {
      this.confirmModal.action(event.reason);
    }
    this.confirmModal = { ...this.confirmModal, open: false };
  }

  onModalCancel(): void {
    this.confirmModal = { ...this.confirmModal, open: false };
  }
}
