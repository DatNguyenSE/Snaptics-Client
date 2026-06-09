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
      this.errorMessage = 'This password reset link is incomplete. Please request a new reset email below.';
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
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    if (!this.emailPattern.test(email)) {
      this.errorMessage = 'Email format is invalid.';
      return;
    }

    this.isLoading = true;

    this.accountService.forgotPassword(email).subscribe({
      next: () => {
        this.requestEmail = email;
        this.successMessage = 'If an account exists for this email, a password reset link has been sent.';
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
      this.errorMessage = 'This reset link is invalid or incomplete. Please request a new reset email.';
      return;
    }

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please enter and confirm your new password.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Password confirmation does not match.';
      return;
    }

    this.isLoading = true;

    this.accountService
      .resetPassword(this.email, this.token, this.newPassword)
      .subscribe({
        next: () => {
          this.newPassword = '';
          this.confirmPassword = '';
          this.successMessage = 'Password has been reset successfully. Redirecting to sign in...';
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
      return 'Unable to connect to the server. Please try again later.';
    }

    return this.getRawErrorMessage(err) || 'Failed to send the password reset email. Please try again.';
  }

  private getResetErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'Unable to connect to the server. Please try again later.';
    }

    if (err.status === 400 || err.status === 404) {
      return this.getRawErrorMessage(err) || 'This reset link is invalid or has expired. Please request a new one.';
    }

    return this.getRawErrorMessage(err) || 'Cannot reset password right now. Please try again.';
  }

  private getRawErrorMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error.trim();
    }

    const message = err.error?.message || err.error?.title || err.message;
    return typeof message === 'string' ? message.trim() : '';
  }
}
