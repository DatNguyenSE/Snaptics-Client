import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppLanguage, LanguageService } from '../../core/services/language-service';
import { ThemeService, AppTheme } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast-service';

@Component({
  selector: 'app-general-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './general-tab.component.html',
  styleUrl: '../settings-page.css',
})
export class GeneralTabComponent implements OnInit {
  protected readonly language = inject(LanguageService);
  protected readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);

  // Appearance State
  selectedTheme: AppTheme = 'system';
  selectedLang: AppLanguage = 'vi';
  isSavingAppearance = false;

  // Regional Preferences State
  regional = {
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1.000.000,00',
    landingPage: 'dashboard',
  };
  isSavingRegional = false;

  // Notifications State
  notifications = {
    email: true,
    push: true,
    spendingReminder: true,
    budgetWarning: true,
    monthlyReport: true,
  };
  isSavingNotifications = false;

  readonly timezones = [
    { value: 'Asia/Ho_Chi_Minh', label: '(GMT+07:00) Bangkok, Hanoi, Jakarta' },
    { value: 'UTC', label: '(GMT+00:00) Coordinated Universal Time' },
    { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
    { value: 'Europe/London', label: '(GMT+00:00) London, Dublin, Edinburgh' },
    { value: 'Asia/Tokyo', label: '(GMT+09:00) Osaka, Sapporo, Tokyo' },
  ];

  readonly dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2026)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2026)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-12-31)' },
  ];

  readonly numberFormats = [
    { value: '1.000.000,00', label: '1.000.000,00 (Standard Vietnam & EU)' },
    { value: '1,000,000.00', label: '1,000,000.00 (Standard US & UK)' },
    { value: '1 000 000,00', label: '1 000 000,00 (ISO Format)' },
  ];

  readonly landingPages = [
    { value: 'dashboard', label: 'Dashboard / Tổng quan' },
    { value: 'transactions', label: 'Transactions / Giao dịch' },
    { value: 'budget', label: 'Budget / Ngân sách' },
    { value: 'analysis', label: 'Analysis / Phân tích' },
  ];

  ngOnInit(): void {
    this.selectedTheme = this.theme.currentTheme();
    this.selectedLang = this.language.currentLang();

    // Restore saved settings from localStorage if existing
    const savedReg = localStorage.getItem('SnapticsRegionalPrefs');
    if (savedReg) {
      try {
        this.regional = { ...this.regional, ...JSON.parse(savedReg) };
      } catch {}
    }

    const savedNotif = localStorage.getItem('SnapticsNotifPrefs');
    if (savedNotif) {
      try {
        this.notifications = { ...this.notifications, ...JSON.parse(savedNotif) };
      } catch {}
    }
  }

  saveAppearance(): void {
    this.isSavingAppearance = true;
    setTimeout(() => {
      this.theme.setTheme(this.selectedTheme);
      this.language.setLanguage(this.selectedLang);
      this.isSavingAppearance = false;
      this.toast.success('Đã lưu tùy chọn giao diện & ngôn ngữ thành công!');
    }, 400);
  }

  saveRegional(): void {
    this.isSavingRegional = true;
    setTimeout(() => {
      localStorage.setItem('SnapticsRegionalPrefs', JSON.stringify(this.regional));
      this.isSavingRegional = false;
      this.toast.success('Đã lưu thiết lập định dạng vùng miền thành công!');
    }, 400);
  }

  saveNotifications(): void {
    this.isSavingNotifications = true;
    setTimeout(() => {
      localStorage.setItem('SnapticsNotifPrefs', JSON.stringify(this.notifications));
      this.isSavingNotifications = false;
      this.toast.success('Đã lưu tùy chọn thông báo thành công!');
    }, 400);
  }
}
