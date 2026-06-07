import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';
import { RegisterCreds } from '../../models/user';

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
export class Register {
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
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (!this.emailPattern.test(email)) {
      this.errorMessage = 'Email format is invalid.';
      return;
    }

    // Kiểm tra mật khẩu và xác nhận mật khẩu có giống nhau không
    if (password !== confirmPassword) {
      this.errorMessage = 'Confirm password does not match.';
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
        this.successMessage = 'Registration successful! Redirecting to the login page...';

        // Sau 1 giây thì chuyển sang trang đăng nhập
        setTimeout(() => {
          this.router.navigate(['/dang-nhap']);
        }, 1000);
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
        return 'Unable to connect to the server (failed to fetch). Please check your network, CORS, or backend.';
      case 400:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'Registration data is invalid. Please review the fields and try again.';
      case 401:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'Your authentication session is invalid. Please refresh the page and try again.';
      case 403:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'You do not have permission to perform this registration action.';
      case 404:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'Registration API was not found. Please check the backend configuration.';
      case 409:
        return rawMessage ? this.formatFallbackError(rawMessage) : 'This email has already been registered.';
      case 422:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'Registration data does not meet the system requirements.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return rawMessage && !this.isGenericServerMessage(rawMessage)
          ? this.formatFallbackError(rawMessage)
          : 'The server encountered an internal error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'The server is temporarily unavailable. Please try again later.';
      default:
        return rawMessage
          ? this.formatFallbackError(rawMessage)
          : 'Registration failed. Please try again.';
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
        return 'This email has already been registered.';
      }

      if (
        normalizedMessage.includes('valid e-mail') ||
        normalizedMessage.includes('valid email') ||
        normalizedMessage.includes('email address') ||
        normalizedMessage.includes('format')
      ) {
        return 'Email format is invalid.';
      }
    }

    if (normalizedMessage.includes('required')) {
      return `${fieldLabel} is required.`;
    }

    if (normalizedMessage.includes('minimum length') || normalizedMessage.includes('at least')) {
      return `${fieldLabel} does not meet the minimum length requirement.`;
    }

    if (normalizedMessage.includes('maximum length') || normalizedMessage.includes('at most')) {
      return `${fieldLabel} exceeds the maximum allowed length.`;
    }

    return `${fieldLabel}: ${message}`;
  }

  private formatFallbackError(message: string): string {
    const normalizedMessage = message.trim().toLowerCase();

    if (normalizedMessage.includes('failed to fetch')) {
      return 'Unable to connect to the server (failed to fetch). Please check your network or backend.';
    }

    if (normalizedMessage.includes('regular expression') || normalizedMessage.includes('regex')) {
      return 'Registration data does not match the required format.';
    }

    if (
      normalizedMessage.includes('already') ||
      normalizedMessage.includes('exists') ||
      normalizedMessage.includes('duplicate') ||
      normalizedMessage.includes('taken')
    ) {
      return 'This email has already been registered.';
    }

    if (normalizedMessage.includes('one or more validation errors occurred')) {
      return 'Registration data is invalid. Please review the form and try again.';
    }

    if (normalizedMessage.includes('forbidden')) {
      return 'You do not have permission to perform this action.';
    }

    if (normalizedMessage.includes('unauthorized')) {
      return 'This request is unauthorized. Please try again.';
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
        return 'Display name';
      case 'email':
        return 'Email';
      case 'password':
        return 'Password';
      case 'confirmpassword':
        return 'Confirm password';
      default:
        return field;
    }
  }
}
