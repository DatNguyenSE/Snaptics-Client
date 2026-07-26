import { Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../core/services/account-service';
import { AppLanguage, LanguageService } from '../core/services/language-service';
import { ToastService } from '../core/services/toast-service';
import { ThemeService } from '../core/services/theme.service';
import { Nav } from '../user-page/user-layout/nav/nav';

type AiSettingKey =
  | 'pricePopup'
  | 'dailyReminder'
  | 'budgetAlert'
  | 'usageReview';

interface AiSettingItem {
  key: AiSettingKey;
  titleKey: string;
  descriptionKey: string;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [Nav, FormsModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  private readonly accountService = inject(AccountService);
  private readonly toast = inject(ToastService);

  protected readonly language = inject(LanguageService);
  protected readonly theme = inject(ThemeService);

  readonly aiSettings: AiSettingItem[] = [
    {
      key: 'pricePopup',
      titleKey: 'settingsPage.ai.priceTitle',
      descriptionKey: 'settingsPage.ai.priceDescription',
    },
    {
      key: 'dailyReminder',
      titleKey: 'settingsPage.ai.reminderTitle',
      descriptionKey: 'settingsPage.ai.reminderDescription',
    },
    {
      key: 'budgetAlert',
      titleKey: 'settingsPage.ai.budgetAlertTitle',
      descriptionKey: 'settingsPage.ai.budgetAlertDescription',
    },
    {
      key: 'usageReview',
      titleKey: 'settingsPage.ai.usageTitle',
      descriptionKey: 'settingsPage.ai.usageDescription',
    },
  ];

  isProfileModalOpen = false;
  profileForm = {
    fullName: '',
    email: '',
  };

  private aiSettingState: Record<AiSettingKey, boolean> = {
    pricePopup: true,
    dailyReminder: true,
    budgetAlert: true,
    usageReview: true,
  };

  get profile() {
    const currentUser = this.accountService.currentUser();
    const fullName = currentUser?.displayName?.trim() || 'Người dùng mới';
    const email = currentUser?.email?.trim() || 'nguoidungmoi@gmail.com';

    return {
      fullName,
      email,
      initials: this.buildInitials(fullName),
    };
  }

  get isProfileFormValid(): boolean {
    const fullName = this.profileForm.fullName.trim();
    const email = this.profileForm.email.trim();

    return fullName.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  toggleSetting(key: AiSettingKey): void {
    this.aiSettingState = {
      ...this.aiSettingState,
      [key]: !this.aiSettingState[key],
    };
  }

  isSettingEnabled(key: AiSettingKey): boolean {
    return this.aiSettingState[key];
  }

  openProfileModal(): void {
    this.profileForm = {
      fullName: this.profile.fullName,
      email: this.profile.email,
    };
    this.isProfileModalOpen = true;
  }

  closeProfileModal(): void {
    this.isProfileModalOpen = false;
  }

  saveProfile(): void {
    if (!this.isProfileFormValid) {
      return;
    }

    // this.accountService.updateProfile({
    //   displayName: this.profileForm.fullName,
    //   email: this.profileForm.email,
    // });
    this.closeProfileModal();
    this.toast.success(this.language.t('settingsPage.profile.success'));
  }

  logoutToHome(): void {
    this.accountService.logout('/landing');
  }

  setLanguage(lang: AppLanguage): void {
    this.language.setLanguage(lang);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isProfileModalOpen) {
      this.closeProfileModal();
    }
  }

  private buildInitials(fullName: string): string {
    const parts = fullName
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return 'M';
    }

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
