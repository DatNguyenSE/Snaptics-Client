import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountService } from '../../../core/services/account-service';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  requestEmail = '';
  email = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  get isResetMode(): boolean {
    return !!this.email && !!this.token;
  }

  get hasIncompleteResetLink(): boolean {
    return (!!this.email || !!this.token) && !this.isResetMode;
  }

  ngOnInit() {
    this.email = this.route.snapshot.queryParamMap.get('email')?.trim() || '';
    this.token = this.route.snapshot.queryParamMap.get('token')?.trim() || '';
    this.requestEmail = this.email;

    if (this.hasIncompleteResetLink) {
      this.errorMessage = 'Liên kết đặt lại mật khẩu này không đầy đủ. Vui lòng yêu cầu liên kết mới bên dưới.';
    }
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isResetMode) {
      this.resetPassword();
      return;
    }

    this.requestPasswordReset();
  }

  private requestPasswordReset() {
    const email = this.requestEmail.trim();

    if (!email) {
      this.errorMessage = 'Vui lòng nhập địa chỉ email.';
      return;
    }

    if (!this.emailPattern.test(email)) {
      this.errorMessage = 'Định dạng email không hợp lệ.';
      return;
    }

    this.isLoading = true;

    this.accountService.forgotPassword(email).subscribe({
      next: () => {
        this.requestEmail = email;
        this.successMessage = 'Nếu tài khoản tồn tại với email này, liên kết đặt lại mật khẩu đã được gửi.';
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = this.getRequestErrorMessage(err);
        this.isLoading = false;
      },
    });
  }

  private resetPassword() {
    if (!this.email || !this.token) {
      this.errorMessage = 'Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu thông tin. Vui lòng yêu cầu lại.';
      return;
    }

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Vui lòng nhập và xác nhận mật khẩu mới.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Mật khẩu phải có ít nhất 8 ký tự.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    this.isLoading = true;

    this.accountService
      .resetPassword(this.email, this.token, this.newPassword)
      .subscribe({
        next: () => {
          this.newPassword = '';
          this.confirmPassword = '';
          this.successMessage = 'Mật khẩu đã được đặt lại thành công. Đang chuyển hướng đến đăng nhập...';
          this.isLoading = false;

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1200);
        },
        error: (err: HttpErrorResponse) => {
          console.error(err);
          this.errorMessage = this.getResetErrorMessage(err);
          this.isLoading = false;
        },
      });
  }

  private getRequestErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.';
    }

    return this.getRawErrorMessage(err) || 'Gửi email đặt lại mật khẩu thất bại. Vui lòng thử lại.';
  }

  private getResetErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.';
    }

    if (err.status === 400 || err.status === 404) {
      return this.getRawErrorMessage(err) || 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.';
    }

    return this.getRawErrorMessage(err) || 'Không thể đặt lại mật khẩu lúc này. Vui lòng thử lại.';
  }

  private getRawErrorMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error.trim();
    }

    const message = err.error?.message || err.error?.title || err.message;
    return typeof message === 'string' ? message.trim() : '';
  }
}
