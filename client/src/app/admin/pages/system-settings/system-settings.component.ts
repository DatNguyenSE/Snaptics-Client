import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSettingsService } from '../../services/admin-settings.service';
import { SystemSettings } from '../../models/admin.models';
import { ConfirmationModalComponent, ConfirmModalConfig } from '../../components/confirmation-modal/confirmation-modal.component';
import { ToastService } from '../../../core/services/toast-service';

type SettingsTab = 'general' | 'ai' | 'security' | 'features';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [FormsModule, ConfirmationModalComponent],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.css',
})
export class SystemSettingsComponent implements OnInit {
  private readonly settingsService = inject(AdminSettingsService);
  private readonly toast = inject(ToastService);

  loading = true;
  saving = false;
  activeTab: SettingsTab = 'general';

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
      this.loading = false;
    });
  }

  setTab(tab: SettingsTab): void {
    this.activeTab = tab;
  }

  saveSection(section: keyof SystemSettings, title: string): void {
    this.confirmModal = {
      open: true,
      config: {
        title: `Save ${title} Settings`,
        description: 'Changes will apply to system operational limits and will be logged in Audit Logs.',
        confirmLabel: 'Save Changes',
        isDangerous: section === 'maintenance' || section === 'security',
        requireReason: true,
      },
      action: (reason) => {
        this.settingsService.saveSettings(section, this.settings[section], reason);
        this.toast.success(`${title} settings updated.`);
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
