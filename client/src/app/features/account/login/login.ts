import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';

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
export class Login {
  private accountService = inject(AccountService);
  private router = inject(Router);
  
  protected Title = 'Welcome Back';
  model: any = {};
  isLoading = false;
  errorMessage = '';
// Hàm này sẽ chạy khi user bấm nút Đăng nhập
  login() {
    this.isLoading = true;
    this.errorMessage = '';
    // Gọi API login thông qua AccountService, truyền vào model chứa email và password
    this.accountService.login(this.model).subscribe({
      next: (res) => {
        console.log('Login successful:', res,this.model);
        this.isLoading = false;
        this.router.navigate(['/trang-chu']); // Redirect to dashboard or homepage
      },
      error: (error) => {
        console.error('Login failed:', error, this.model);
        this.isLoading = false;
        if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else {
          this.errorMessage = 'Failed to login. Please check your credentials and try again.';
        }
      }
    });
  }
}
