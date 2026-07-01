import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';
import { ToastService } from '../../../core/services/toast-service';

//các component: selector là 'app-login' nên trong HTML nếu muốn dùng component này thì viết <app-login></app-login>
//Template và style được tách riêng thành file login.html và login.css
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
// Class chứa logic cho trang đăng nhập,
// Bước 1: Khai báo các biến để bind với form trong HTML
// Bước 2: Viết hàm login() để xử lý khi user bấm nút Đăng nhập
// Bước 3: Gọi API đăng nhập thông qua AccountService
// Bước 4: Xử lý kết quả trả về từ API, nếu thành công thì chuyển sang trang chủ, nếu lỗi thì hiển thị thông báo lỗi
// Lưu ý: Tên field trong model phải khớp với DTO bên backend để API có thể nhận đúng dữ liệu
export class Login implements OnDestroy {
  private accountService = inject(AccountService);
  private router = inject(Router);
  
  protected Title = 'Welcome Back';
  model: any = {};
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  isOtpStep = false;
  otpCode = '';
  otpDigits = ['', '', '', '', '', ''];
  resendCountdown = 0;
  private countdownInterval: any;
  protected toast = inject(ToastService);

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  onOtpInput(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    if (/[^0-9]/.test(value)) {
      this.otpDigits[index] = '';
      return;
    }

    this.otpDigits[index] = value;
    this.updateOtpCode();

    if (value && index < 5) {
      const nextInput = document.getElementById('log-otp-' + (index + 1)) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = document.getElementById('log-otp-' + (index - 1)) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        this.otpDigits[index - 1] = '';
        this.updateOtpCode();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');
    if (pastedData) {
      const numbers = pastedData.replace(/[^0-9]/g, '').slice(0, 6);
      for (let i = 0; i < numbers.length; i++) {
        this.otpDigits[i] = numbers[i];
      }
      this.updateOtpCode();
      const lastFilledIndex = numbers.length - 1;
      const nextIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
      const nextInput = document.getElementById('log-otp-' + nextIndex) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  updateOtpCode() {
    this.otpCode = this.otpDigits.join('');
  }
  login() {
    this.isLoading = true;
    this.errorMessage = '';
    this.accountService.login(this.model).subscribe({
      next: (res) => {
        this.toast.success('Login successful');
        this.isLoading = false;
        if (this.accountService.currentUser()) {
          this.router.navigate(['/user/dashboard']);
        } else {
          this.isOtpStep = true;
          this.successMessage = 'Please check your email for the OTP code.';
        }
      },
      error: (error) => {
        console.error('Login failed:', error, this.model);
        this.isLoading = false;
        
        let errorMsg = 'Failed to login. Please check your credentials and try again.';
        if (error.error && typeof error.error === 'string') {
          errorMsg = error.error;
        } else if (error.error && error.error.message) {
          errorMsg = error.error.message;
        }

        const lowerError = errorMsg.toLowerCase();
        if (lowerError.includes('not verified') || lowerError.includes('unverified') || lowerError.includes('verify') || lowerError.includes('xác thực')) {
          this.isOtpStep = true;
          this.errorMessage = errorMsg;
          return;
        }

        this.errorMessage = errorMsg;
      }
    });
  }

  verifyOtp() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.accountService.verifyOtp(this.model.email, this.otpCode).subscribe({
      next: () => {
        this.isLoading = false;
        if (this.accountService.currentUser()) {
          this.router.navigate(['/user/dashboard']);
        } else {
          this.isOtpStep = false;
          this.successMessage = 'Account verified successfully. Please sign in.';
          this.errorMessage = '';
        }
      },
      error: (error) => {
        this.isLoading = false;

        if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else if (error.error && error.error.text) {
          this.errorMessage = error.error.text;
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Invalid OTP. Please try again.';
        }
      }
    });
  }

  resendOtp() {
    if (this.resendCountdown > 0) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.accountService.resendOtp(this.model.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'A new OTP has been sent to your email.';
        this.startResendCountdown();
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else {
          this.errorMessage = 'Failed to resend OTP. Please try again.';
        }
      }
    });
  }

  startResendCountdown() {
    this.resendCountdown = 60;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.countdownInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }
}
