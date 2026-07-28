import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';
import { RegisterCreds } from '../../../models/user';
import { OnDestroy } from '@angular/core';

// Đây là component đăng ký tài khoản mới,
// selector là 'app-register' nên trong HTML nếu muốn dùng component
// này thì viết <app-register></app-register>
// Template và style được tách riêng thành file register.html và register.css
@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})

// Class chứa logic cho trang đăng ký,
// Bước 1: Khai báo các biến để bind với form trong HTML
// Bước 2: Viết hàm onRegister() để xử lý khi user bấm nút Đăng ký
// Bước 3: Gọi API đăng ký thông qua AccountService
// Bước 4: Xử lý kết quả trả về từ API, hiển thị thông báo thành công hoặc lỗi
// Bước 5: Nếu đăng ký thành công thì chuyển sang trang đăng nhập sau 1 giây
// Lưu ý: Tên field trong registerData phải khớp với DTO bên backend để API có thể nhận đúng dữ liệu
export class Register implements OnDestroy {
  private accountService = inject(AccountService);
  private router = inject(Router);
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isOtpStep = false;
  otpCode = '';
  otpDigits = ['', '', '', '', '', ''];
  resendCountdown = 0;
  private countdownInterval: any;

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
      const nextInput = document.getElementById('reg-otp-' + (index + 1)) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = document.getElementById('reg-otp-' + (index - 1)) as HTMLInputElement;
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
      const nextInput = document.getElementById('reg-otp-' + nextIndex) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  updateOtpCode() {
    this.otpCode = this.otpDigits.join('');
  }

  // Hàm này sẽ chạy khi user bấm nút Đăng ký
  onRegister() {
    // Mỗi lần bấm đăng ký thì reset lại thông báo cũ
    this.errorMessage = '';
    this.successMessage = '';

    const fullName = this.fullName.trim();
    const email = this.email.trim();
    const password = this.password;
    const confirmPassword = this.confirmPassword;

    // Kiểm tra user đã nhập đủ thông tin chưa
    if (!fullName || !email || !password || !confirmPassword) {
      this.errorMessage = 'Vui lòng điền đầy đủ tất cả thông tin.';
      return;
    }

    if (!this.emailPattern.test(email)) {
      this.errorMessage = 'Định dạng email không hợp lệ.';
      return;
    }

    // Kiểm tra mật khẩu và xác nhận mật khẩu có giống nhau không
    if (password !== confirmPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    // Object gửi lên API register
    // Tên field phải khớp với DTO bên backend
    // Frontend vẫn dùng fullName và confirmPassword để check UI,
    // nhưng payload gửi backend chỉ có displayName, email, password
    const registerData: RegisterCreds = {
      displayName: fullName,
      email,
      password,
    };

    console.log('Register data sent to API:', registerData);
    this.fullName = fullName;
    this.email = email;

    // Bắt đầu gọi API nên bật trạng thái loading
    this.isLoading = true;

    // Gọi hàm register trong AccountService
    // Hàm này đang post tới: environment.apiUrl + 'account/register'
    this.accountService.register(registerData).subscribe({
      // next chạy khi API trả về thành công
      next: () => {
        // Tắt loading
        this.isLoading = false;

        // Hiện thông báo thành công
        this.successMessage = 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.';
        this.isOtpStep = true;
      },

      // error chạy khi API trả lỗi
      // Ghi err theo kiểu HttpErrorResponse để đọc status code và message rõ hơn
      error: (err: HttpErrorResponse) => {
        // Tắt loading
        this.isLoading = false;

        // In lỗi ra console để debug
        console.log(err);

        // Lấy message lỗi từ API nếu có
        // Nếu API không trả message thì hiện câu mặc định
        this.errorMessage = this.getRegisterErrorMessage(err);
      },
    });
  }

  verifyOtp() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.accountService.verifyOtp(this.email, this.otpCode).subscribe({
      next: () => {
        this.isLoading = false;
        if (this.accountService.currentUser()) {
          this.router.navigate(['/user/dashboard']);
        } else {
          this.successMessage = 'Xác thực tài khoản thành công! Đang chuyển hướng đến đăng nhập...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1000);
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
          this.errorMessage = 'Mã OTP không hợp lệ. Vui lòng thử lại.';
        }
      }
    });
  }

  resendOtp() {
    if (this.resendCountdown > 0) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.accountService.resendOtp(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Mã OTP mới đã được gửi tới email của bạn.';
        this.startResendCountdown();
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else {
          this.errorMessage = 'Gửi lại mã OTP thất bại. Vui lòng thử lại.';
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

// Hàm này sẽ phân tích lỗi trả về từ API và trả về thông báo phù hợp cho user
// Nó sẽ ưu tiên hiển thị các lỗi validation nếu có, sau đó mới đến lỗi chung
  private getRegisterErrorMessage(err: HttpErrorResponse): string {
    const validationMessages = this.getValidationMessages(err.error?.errors ?? err.error?.Errors);
    const rawMessage = this.getRawErrorMessage(err);
    //if này để ưu tiên hiển thị lỗi validation nếu API trả về, vì thường những lỗi này sẽ rõ ràng hơn cho user biết họ sai ở đâu trong form


    if ((err.status === 400 || err.status === 409 || err.status === 422) && validationMessages.length > 0) {
      return validationMessages.join(' ');
    }

    //switch này để xử lý các lỗi phổ biến khác dựa trên status code, nếu API trả về message cụ thể thì sẽ hiển thị message đó sau khi đã được format lại, còn nếu không có message hoặc message quá chung chung thì sẽ hiển thị câu mặc định cho từng trường hợp
    
    switch (err.status) {
      case 0:
        return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 400:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'Dữ liệu đăng ký không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      case 401:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'Phiên làm việc không hợp lệ. Vui lòng tải lại trang và thử lại.';
      case 403:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'Bạn không có quyền thực hiện thao tác đăng ký này.';
      case 404:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'Không tìm thấy dịch vụ đăng ký.';
      case 409:
        return rawMessage ? this.formatFallbackError(rawMessage) : 'Email này đã được đăng ký.';
      case 422:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'Dữ liệu đăng ký không đáp ứng yêu cầu hệ thống.';
      case 429:
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau giây lát.';
      case 500:
        return rawMessage && !this.isGenericServerMessage(rawMessage)
          ? this.formatFallbackError(rawMessage)
          : 'Máy chủ xảy ra lỗi nội bộ. Vui lòng thử lại sau.';
      case 502:
      case 503:
      case 504:
        return 'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.';
      default:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'Đăng ký thất bại. Vui lòng thử lại.';
    }
  }

  private getRawErrorMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error.trim();
    }

    const message = err?.error?.message || err?.error?.title || err.message;
    return typeof message === 'string' ? message.trim() : '';
  }

  private getValidationMessages(errors: unknown): string[] {
    if (!errors || typeof errors !== 'object') {
      return [];
    }

    return Object.entries(errors as Record<string, unknown>).flatMap(([field, messages]) => {
      const items = Array.isArray(messages) ? messages : [messages];

      return items
        .filter((message): message is string => typeof message === 'string' && message.trim().length > 0)
        .map((message) => this.formatValidationMessage(field, message));
    });
  }

  private formatValidationMessage(field: string, message: string): string {
    const fieldLabel = this.getFieldLabel(field);
    const normalizedField = field.toLowerCase();
    const normalizedMessage = message.trim().toLowerCase();

    if (normalizedMessage.includes('regular expression') || normalizedMessage.includes('regex')) {
      return `${fieldLabel} không đúng định dạng yêu cầu${normalizedField.includes('password') ? ' (không hợp regex mật khẩu).' : ' (không hợp regex).'}`;
    }

    if (normalizedField.includes('email')) {
      if (
        normalizedMessage.includes('already') ||
        normalizedMessage.includes('exists') ||
        normalizedMessage.includes('duplicate') ||
        normalizedMessage.includes('taken')
      ) {
        return 'Email này đã được đăng ký.';
      }

      if (
        normalizedMessage.includes('valid e-mail') ||
        normalizedMessage.includes('valid email') ||
        normalizedMessage.includes('email address') ||
        normalizedMessage.includes('format')
      ) {
        return 'Định dạng email không hợp lệ.';
      }
    }

    if (normalizedMessage.includes('required')) {
      return `${fieldLabel} không được để trống.`;
    }

    if (normalizedMessage.includes('minimum length') || normalizedMessage.includes('at least')) {
      return `${fieldLabel} chưa đạt độ dài tối thiểu.`;
    }

    if (normalizedMessage.includes('maximum length') || normalizedMessage.includes('at most')) {
      return `${fieldLabel} vượt quá độ dài tối đa cho phép.`;
    }

    return `${fieldLabel}: ${message}`;
  }

  private formatFallbackError(message: string): string {
    const normalizedMessage = message.trim().toLowerCase();

    if (normalizedMessage.includes('failed to fetch')) {
      return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.';
    }

    if (normalizedMessage.includes('regular expression') || normalizedMessage.includes('regex')) {
      return 'Dữ liệu đăng ký không đúng định dạng yêu cầu.';
    }

    if (
      normalizedMessage.includes('already') ||
      normalizedMessage.includes('exists') ||
      normalizedMessage.includes('duplicate') ||
      normalizedMessage.includes('taken')
    ) {
      return 'Email này đã được đăng ký.';
    }

    if (normalizedMessage.includes('one or more validation errors occurred')) {
      return 'Dữ liệu đăng ký không hợp lệ. Vui lòng kiểm tra lại biểu mẫu.';
    }

    if (normalizedMessage.includes('forbidden')) {
      return 'Bạn không có quyền thực hiện hành động này.';
    }

    if (normalizedMessage.includes('unauthorized')) {
      return 'Yêu cầu chưa được xác thực. Vui lòng thử lại.';
    }

    return message;
  }

  private isGenericServerMessage(message: string): boolean {
    const normalizedMessage = message.trim().toLowerCase();

    return (
      !normalizedMessage ||
      normalizedMessage === 'http failure response for (unknown url): 500 undefined' ||
      normalizedMessage.includes('internal server error') ||
      normalizedMessage.includes('http failure response')
    );
  }

  private getFieldLabel(field: string): string {
    switch (field.toLowerCase()) {
      case 'displayname':
      case 'fullname':
        return 'Họ và tên';
      case 'email':
        return 'Email';
      case 'password':
        return 'Mật khẩu';
      case 'confirmpassword':
        return 'Xác nhận mật khẩu';
      default:
        return field;
    }
  }
}
