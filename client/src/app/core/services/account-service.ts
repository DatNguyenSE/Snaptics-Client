import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';
import { LoginCreds, RegisterCreds, User } from '../../models/user';

import { map, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private router = inject(Router);
  // Biến Signal để giữ trạng thái thông tin người dùng trên RAM (bộ nhớ tạm).
  //gọi API (như refresh-token) ở component gốc lúc mới chạy để khôi phục lại trạng thái.
  currentUser = signal<User | null>(null);
  protected baseUrl = environment.apiUrl;

  private useMockAuth = true;

  private mockUsers = [
    {
      email: 'admin@gmail.com',
      password: '123456',
      displayName: 'Admin User',
      roles: ['Admin'],
    },
    {
      email: 'user@gmail.com',
      password: '123456',
      displayName: 'Normal User',
      roles: ['Member'],
    },
  ];

  private createMockToken(roles: string[]) {
    const header = btoa(
      JSON.stringify({
        alg: 'HS256',
        typ: 'JWT',
      }),
    );

    const payload = btoa(
      JSON.stringify({
        role: roles,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      }),
    );

    const signature = 'mock-signature';

    return `${header}.${payload}.${signature}`;
  }
  setCurrentUser(user: User) {
    user.roles = this.getRolesFromToken(user);
    this.currentUser.set(user);
  }

  // trả về mảng role từ token, vì có thể có 1 role hoặc nhiều role nên phải kiểm tra nếu là 1 role thì chuyển thành mảng để sau này dùng được .some() trong HasRoleDirective
  private getRolesFromToken(user: User): string[] {
    const payload = user.token.split('.')[1];
    const decoded = atob(payload);
    const jsonPayload = JSON.parse(decoded);
    return Array.isArray(jsonPayload.role) ? jsonPayload.role : [jsonPayload.role];
  }
  login(creds: LoginCreds) {
    if (this.useMockAuth) {
      console.log('MOCK LOGIN RUNNING', creds);
      const mockUser = this.mockUsers.find(
        (x) => x.email === creds.email && x.password === creds.password,
      );

      if (!mockUser) {
        return throwError(() => ({
          error: 'Email hoặc mật khẩu không đúng',
        }));
      }

      const user = {
        email: mockUser.email,
        displayName: mockUser.displayName,
        token: this.createMockToken(mockUser.roles),
      } as User;

      this.setCurrentUser(user);
      localStorage.setItem('SnapticsUser', JSON.stringify(user));

      return of(user);
    }

    return this.http
      .post<User>(this.baseUrl + 'account/login', creds, { withCredentials: true })
      .pipe(
        map((user) => {
          if (user) {
            this.setCurrentUser(user);
            localStorage.setItem('SnapticsUser', JSON.stringify(user));
          }

          return user;
        }),
      );
      
  }
  //hàm đăng nhập
  /*login(creds: LoginCreds) {
      // Khi đăng nhập thành công, Server trả về dữ liệu 'user', ĐỒNG THỜI gửi kèm header "Set-Cookie" chứa Token bảo mật (HttpOnly).
      // BẮT BUỘC phải có { withCredentials: true } thì trình duyệt mới chịu NHẬN và LƯU cookie từ server khác port.
      return this.http.post<User>(this.baseUrl+'account/login', creds, { withCredentials: true }).pipe(        //.pipe(...): Cho phép bạn xử lý dữ liệu trả về trước khi gửi ra ngoài.
        map(user => {                                                           //map() dùng để biến đổi dữ liệu.
          if(user) {
            this.setCurrentUser(user);  
            // Kích hoạt bộ đếm thời gian tự động xin cấp lại token mới
          }
          return user;
        })
      )
  }
  */

  //hàm đăng ký thêm người dùng
  register(creds: RegisterCreds) {
    return this.http.post(this.baseUrl + 'account/register', creds, { responseType: 'text' });
  }
  //hàm quản lý mật khẩu
  forgotPassword(email: string) {
    return this.http.post(
      this.baseUrl + 'account/forgot-password',
      { email },
      { responseType: 'text' },
    );
  }
  //hàm đặt lại password trong services
  resetPassword(email: string, token: string, newPassword: string) {
    return this.http.post(
      this.baseUrl + 'account/reset-password',
      { email, token, newPassword },
      { responseType: 'text' },
    );
  }

  private clearSessionAndRedirect(redirectUrl: string) {
    this.currentUser.set(null);
    localStorage.removeItem('SnapticsUser');
    void this.router.navigateByUrl(redirectUrl);
  }

  logout(redirectUrl = '/dang-nhap') {
    if (this.useMockAuth) {
      this.clearSessionAndRedirect(redirectUrl);
      return;
    }

    this.http.post(this.baseUrl + 'account/logout', {}, { withCredentials: true }).subscribe({
      next: () => {
        this.clearSessionAndRedirect(redirectUrl);
      },
      error: () => {
        this.clearSessionAndRedirect(redirectUrl);
      },
    });
  }
  /*logout() {
    // Gọi API logout, ĐẶC BIỆT chú ý tham số { withCredentials: true }
    // Tham số này chỉ thị cho trình duyệt phải TỰ ĐỘNG đính kèm cái HttpOnly Cookie đang lưu ngầm gửi lên server.
    // Nhận được request này, Backend sẽ xác nhận và gửi ngược lại lệnh xóa cái Cookie này (xóa session), hoàn tất đăng xuất an toàn.
    this.http.post(this.baseUrl + 'account/logout', {}, { withCredentials: true }).subscribe({
      next: () => {
        // Xóa thông tin user tạm trên bộ nhớ RAM
        this.currentUser.set(null);
         window.location.href = '/';
      }
    })

  }
*/
  refreshToken() {
    if (this.useMockAuth) {
      const savedUser = localStorage.getItem('SnapticsUser');

      if (!savedUser) {
        return throwError(() => ({
          error: 'Chưa có user mock trong localStorage',
        }));
      }

      const user = JSON.parse(savedUser) as User;
      this.setCurrentUser(user);

      return of(user);
    }

    return this.http.post<User>(
      this.baseUrl + 'account/refresh-token',
      {},
      { withCredentials: true },
    );
  }
  /*refreshToken() {
    // Tham số { withCredentials: true } là CỐT LÕI của cơ chế này.
    // yêu cầu trình duyệt tự móc HttpOnly Cookie ra đính kèm gửi đi.
    return this.http.post<User>(this.baseUrl + 'account/refresh-token', {},
      { withCredentials: true })
  }
*/
  startTokenRefreshInterval() {
    if (this.useMockAuth) return;

    setInterval(
      () => {
        this.http
          .post<User>(this.baseUrl + 'account/refresh-token', {}, { withCredentials: true })
          .subscribe({
            next: (user) => {
              this.setCurrentUser(user);
            },
            error: () => {
              this.logout();
            },
          });
      },
      14 * 24 * 60 * 60 * 1000,
    );
  }
  /* startTokenRefreshInterval() {
    // Định kỳ chạy ngầm API làm mới token để giữ phiên đăng nhập không bị hết hạn.
    // Mỗi 14 ngày, nó sẽ tự gửi request (kèm Cookie ngầm) để nhận Token và Cookie gia hạn mới.
    setInterval(
      () => {
        this.http
          .post<User>(this.baseUrl + 'account/refresh-token', {}, { withCredentials: true })
          .subscribe({
            next: (user) => {
              this.setCurrentUser(user);
            },
            error: () => {
              this.logout();
            },
          });
      },
      14 * 24 * 60 * 60 * 1000,
    ); // 14 days
  }
    */
}
