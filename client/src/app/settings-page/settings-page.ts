import { Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../core/services/account-service';
import { AppLanguage, LanguageService } from '../core/services/language-service';
import { ToastService } from '../core/services/toast-service';
import { Nav } from '../user-page/user-layout/nav/nav';

type AiSettingKey =
  | 'calories'
  | 'pricePopup'
  | 'dailyReminder'
  | 'budgetAlert'
  | 'usageReview';
type GeneralSettingKey = 'language' | 'currency' | 'budget' | 'backup';

interface AiSettingItem {
  key: AiSettingKey;
  titleKey: string;
  descriptionKey: string;
}

interface GeneralSettingItem {
  key: GeneralSettingKey;
  labelKey: string;
  value: string;
  icon: string;
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

  readonly aiSettings: AiSettingItem[] = [
    {
      key: 'calories',
      titleKey: 'settingsPage.ai.caloriesTitle',
      descriptionKey: 'settingsPage.ai.caloriesDescription',
    },
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
    calories: true,
    pricePopup: true,
    dailyReminder: true,
    budgetAlert: true,
    usageReview: true,
  };

  get profile() {
    const currentUser = this.accountService.currentUser();
    const fullName = currentUser?.displayName?.trim() || 'Minh Nguyen';
    const email = currentUser?.email?.trim() || 'minh@gmail.com';

    return {
      fullName,
      email,
      initials: this.buildInitials(fullName),
    };
  }

  get generalSettings(): GeneralSettingItem[] {
    return [
      {
        key: 'language',
        labelKey: 'settingsPage.general.language',
        value:
          this.language.currentLang() === 'vi'
            ? this.language.t('common.vietnamese')
            : this.language.t('common.english'),
        icon: 'language',
      },
      {
        key: 'currency',
        labelKey: 'settingsPage.general.currency',
        value: 'VND (\u20ab)',
        icon: 'payments',
      },
      {
        key: 'budget',
        labelKey: 'settingsPage.general.budget',
        value: '500,000 VND',
        icon: 'target',
      },
      {
        key: 'backup',
        labelKey: 'settingsPage.general.backup',
        value: this.language.t('settingsPage.general.enabled'),
        icon: 'cloud_done',
      },
    ];
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

  handleGeneralSettingClick(key: GeneralSettingKey): void {
    if (key === 'language') {
      this.toggleLanguage();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isProfileModalOpen) {
      this.closeProfileModal();
    }
  }

  private toggleLanguage(): void {
    const nextLanguage: AppLanguage = this.language.currentLang() === 'vi' ? 'en' : 'vi';
    this.language.setLanguage(nextLanguage);
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
