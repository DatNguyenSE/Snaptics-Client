import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService } from '../core/services/language-service';
import { UserProfileService } from '../core/services/user-profile.service';
import { UserProfileDto } from '../models/user-profile.dto';

import { AccountTabComponent } from './components/account-tab.component';
import { GeneralTabComponent } from './components/general-tab.component';
import { ProfileTabComponent } from './components/profile-tab.component';
import { SecurityTabComponent } from './components/security-tab.component';
import { CurrenciesTabComponent } from './components/currencies-tab.component';

export type SettingsTabId =
  | 'account'
  | 'general'
  | 'profile'
  | 'security'
  | 'currencies';

interface TabItem {
  id: SettingsTabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    AccountTabComponent,
    GeneralTabComponent,
    ProfileTabComponent,
    SecurityTabComponent,
    CurrenciesTabComponent,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userProfileService = inject(UserProfileService);
  protected readonly language = inject(LanguageService);

  activeTab: SettingsTabId = 'account';
  profile: UserProfileDto | null = null;
  isLoadingProfile = false;
  /** Controls whether the right-edge gradient scroll hint is visible */
  showTabFade = true;

  get tabs(): TabItem[] {
    const isVi = this.language.currentLang() === 'vi';
    return [
      { id: 'account', label: isVi ? 'Tài khoản' : 'Account', icon: 'manage_accounts' },
      { id: 'general', label: isVi ? 'Cài đặt chung' : 'General', icon: 'settings' },
      { id: 'profile', label: isVi ? 'Hồ sơ cá nhân' : 'Profile', icon: 'person' },
      { id: 'security', label: isVi ? 'Bảo mật' : 'Security', icon: 'security' },
      { id: 'currencies', label: isVi ? 'Tiền tệ' : 'Currencies', icon: 'payments' },
    ];
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const tabParam = params['tab']?.toLowerCase() as SettingsTabId;
      const isValidTab = this.tabs.some((t) => t.id === tabParam);
      if (isValidTab) {
        this.activeTab = tabParam;
        this.scrollActiveTabIntoView(tabParam);
      } else {
        this.activeTab = 'account';
      }
    });

    this.fetchUserProfile();
  }

  fetchUserProfile(): void {
    this.isLoadingProfile = true;
    this.userProfileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.isLoadingProfile = false;
      },
      error: () => {
        this.isLoadingProfile = false;
      },
    });
  }

  selectTab(tabId: SettingsTabId): void {
    this.activeTab = tabId;
    this.scrollActiveTabIntoView(tabId);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge',
    });
  }

  /** Called by (scroll) event on .settings-tabs viewport — hides fade gradient when at end */
  onTabsScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    this.showTabFade = !atEnd;
  }

  private scrollActiveTabIntoView(tabId: SettingsTabId): void {
    // Delay so Angular renders the active class before scrolling
    setTimeout(() => {
      const btn = document.getElementById(`settings-tab-${tabId}`);
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 60);
  }

  onProfileUpdated(updated: UserProfileDto): void {
    this.profile = { ...this.profile, ...updated };
  }
}
