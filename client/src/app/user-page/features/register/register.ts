import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';

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
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Hàm này sẽ chạy khi user bấm nút Đăng ký
  onRegister() {
    // Mỗi lần bấm đăng ký thì reset lại thông báo cũ
    this.errorMessage = '';
    this.successMessage = '';

    // Kiểm tra user đã nhập đủ thông tin chưa
    if (!this.fullName || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Vui lòng nhập đầy đủ thông tin.';
      return;
    }

    // Kiểm tra mật khẩu và xác nhận mật khẩu có giống nhau không
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    // Object gửi lên API register
    // Tên field phải khớp với DTO bên backend
    // Hiện tại mình dùng fullName, email, password, confirmPassword
    const registerData = {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword,
    };

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
        this.successMessage = 'Đăng ký thành công! Đang chuyển sang trang đăng nhập...';

        // Sau 1 giây thì chuyển sang trang đăng nhập
        setTimeout(() => {
          this.router.navigate(['/dang-nhap']);
        }, 1000);
      },

      // error chạy khi API trả lỗi
      // Ghi err: any để tránh lỗi TypeScript "Object is of type unknown"
      error: (err: any) => {
        // Tắt loading
        this.isLoading = false;

        // In lỗi ra console để debug
        console.log(err);

        // Lấy message lỗi từ API nếu có
        // Nếu API không trả message thì hiện câu mặc định
        this.errorMessage =
          err?.error?.message ||
          err?.error?.title ||
          err?.error ||
          'Đăng ký thất bại. Vui lòng thử lại.';
      },
    });
  }
}