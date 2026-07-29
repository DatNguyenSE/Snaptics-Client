import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfileDto } from '../../models/user-profile.dto';
import { UserProfileService } from '../../core/services/user-profile.service';
import { AccountService } from '../../core/services/account-service';
import { ToastService } from '../../core/services/toast-service';

export interface SecurityActivityLog {
  id: string;
  action: string;
  device: string;
  ipLocation: string;
  timestamp: string;
  status: 'success' | 'warning';
}

@Component({
  selector: 'app-security-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-tab.component.html',
  styleUrl: '../settings-page.css',
})
export class SecurityTabComponent implements OnInit {
  @Input() profile: UserProfileDto | null = null;
  @Output() navigateTab = new EventEmitter<string>();
  @Output() profileUpdated = new EventEmitter<UserProfileDto>();

  private readonly userProfileService = inject(UserProfileService);
  private readonly accountService = inject(AccountService);
  private readonly toast = inject(ToastService);

  // 2FA State
  is2faModalOpen = false;
  otpCode = '';
  isSubmitting2fa = false;
  qrCodeMock = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/SnapticsAI:user@example.com?secret=JBSWY3DPEHPK3PXP';

  // Login Alerts State
  loginAlerts = {
    newLogin: true,
    unrecognizedDevice: true,
  };
  isSavingAlerts = false;

  // Email Verification State
  isResendingVerification = false;

  // Security Activity Logs
  activityLogs: SecurityActivityLog[] = [
    {
      id: '1',
      action: 'Account Login',
      device: 'Chrome on Windows 11',
      ipLocation: '113.161.42.10 (Ho Chi Minh City, VN)',
      timestamp: '2026-07-29 11:45 AM',
      status: 'success',
    },
    {
      id: '2',
      action: 'Password Changed',
      device: 'Chrome on Windows 11',
      ipLocation: '113.161.42.10 (Ho Chi Minh City, VN)',
      timestamp: '2026-07-28 04:20 PM',
      status: 'success',
    },
    {
      id: '3',
      action: 'Email Verification Requested',
      device: 'Safari on iPhone 15',
      ipLocation: '14.241.22.88 (Hanoi, VN)',
      timestamp: '2026-07-25 09:12 AM',
      status: 'success',
    },
  ];

  ngOnInit(): void {
    const savedAlerts = localStorage.getItem('SnapticsLoginAlerts');
    if (savedAlerts) {
      try {
        this.loginAlerts = { ...this.loginAlerts, ...JSON.parse(savedAlerts) };
      } catch {}
    }
  }

  goToTab(tabName: string): void {
    this.navigateTab.emit(tabName);
  }

  // ─── 2FA Handlers ──────────────────────────────────────────────────────────

  open2faModal(): void {
    this.otpCode = '';
    this.is2faModalOpen = true;
  }

  close2faModal(): void {
    this.is2faModalOpen = false;
    this.otpCode = '';
  }

  toggle2FA(): void {
    const targetState = !this.profile?.twoFactorEnabled;

    if (targetState) {
      // Step: Open OTP verification modal to confirm enabling
      this.open2faModal();
    } else {
      // Disabling 2FA
      this.userProfileService.changeSecurity({ enableTwoFactor: false }).subscribe({
        next: () => {
          if (this.profile) {
            const updated = { ...this.profile, twoFactorEnabled: false };
            this.profileUpdated.emit(updated);
          }
          this.toast.success('Đã tắt xác thực hai yếu tố (2FA).');
        },
        error: (err) => {
          this.toast.error(err.message || 'Không thể tắt 2FA.');
        },
      });
    }
  }

  confirmEnable2FA(): void {
    if (!this.otpCode || this.otpCode.trim().length < 6) {
      this.toast.error('Vui lòng nhập mã OTP gồm 6 chữ số.');
      return;
    }

    this.isSubmitting2fa = true;
    this.userProfileService
      .changeSecurity({ enableTwoFactor: true, twoFactorCode: this.otpCode.trim() })
      .subscribe({
        next: () => {
          this.isSubmitting2fa = false;
          this.close2faModal();
          if (this.profile) {
            const updated = { ...this.profile, twoFactorEnabled: true };
            this.profileUpdated.emit(updated);
          }
          this.toast.success('Kích hoạt xác thực hai yếu tố (2FA) thành công!');
        },
        error: (err) => {
          this.isSubmitting2fa = false;
          this.toast.error(err.message || 'Mã OTP không đúng hoặc đã hết hạn.');
        },
      });
  }

  // ─── Login Alerts Handler ──────────────────────────────────────────────────

  saveLoginAlerts(): void {
    this.isSavingAlerts = true;
    setTimeout(() => {
      localStorage.setItem('SnapticsLoginAlerts', JSON.stringify(this.loginAlerts));
      this.isSavingAlerts = false;
      this.toast.success('Đã lưu tùy chọn cảnh báo đăng nhập thành công!');
    }, 400);
  }

  // ─── Resend Email Verification Handler ──────────────────────────────────────

  resendEmailVerification(): void {
    const email = this.profile?.email || this.accountService.currentUser()?.email;
    if (!email) {
      this.toast.error('Email không hợp lệ.');
      return;
    }

    this.isResendingVerification = true;
    this.accountService.resendOtp(email).subscribe({
      next: () => {
        this.isResendingVerification = false;
        this.toast.success('Đã gửi email xác thực thành công!');
      },
      error: (err) => {
        this.isResendingVerification = false;
        this.toast.error(err.message || 'Không thể gửi email xác thực.');
      },
    });
  }
}
