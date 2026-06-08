import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { LoginCreds, RegisterCreds, User } from '../../models/user';

import { map } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject (HttpClient);
  // Biến Signal để giữ trạng thái thông tin người dùng trên RAM (bộ nhớ tạm).
  //gọi API (như refresh-token) ở component gốc lúc mới chạy để khôi phục lại trạng thái.
  currentUser = signal<User | null>(null);
  protected baseUrl = environment.apiUrl;


  setCurrentUser(user: User) {
    user.roles = this.getRolesFromToken(user);
    this.currentUser.set(user);
  }
  
  // trả về mảng role từ token, vì có thể có 1 role hoặc nhiều role nên phải kiểm tra nếu là 1 role thì chuyển thành mảng để sau này dùng được .some() trong HasRoleDirective
  private getRolesFromToken(user: User): string[] {
    const payload = user.token.split('.')[1];
    const decoded = atob(payload);
    const jsonPayload = JSON.parse(decoded);
    return Array.isArray(jsonPayload.role) ? jsonPayload.role : [jsonPayload.role]
  }

  login(creds: LoginCreds) {
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

  register(creds: RegisterCreds) {
    return this.http.post(this.baseUrl + 'account/register', creds, { responseType: 'text' });
  }

  logout() {
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

  refreshToken() {
    // Tham số { withCredentials: true } là CỐT LÕI của cơ chế này.
    // yêu cầu trình duyệt tự móc HttpOnly Cookie ra đính kèm gửi đi.
    return this.http.post<User>(this.baseUrl + 'account/refresh-token', {},
      { withCredentials: true })
  }

  startTokenRefreshInterval() {
    // Định kỳ chạy ngầm API làm mới token để giữ phiên đăng nhập không bị hết hạn.
    // Mỗi 14 ngày, nó sẽ tự gửi request (kèm Cookie ngầm) để nhận Token và Cookie gia hạn mới.
    setInterval(() => {
      this.http.post<User>(this.baseUrl + 'account/refresh-token', {},
        { withCredentials: true }).subscribe({
          next: user => {
            this.setCurrentUser(user)
          },
          error: () => {
            this.logout()
          }
        })
    }, 14 * 24 * 60 * 60 * 1000) // 14 days
  }
}
