import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { LoginCreds, RegisterCreds, User } from '../../user-page/models/user';

import { map } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  currentUser = signal<User | null>(null);
  protected baseUrl = environment.apiUrl;

  private setCurrentAccount(user: User) {
    const decodedToken: any = jwtDecode(user.token);
    const roles = this.getRolesFromDecodedToken(decodedToken);
    Array.isArray(roles) ? (user.roles = roles) : user.roles.push(roles);
    localStorage.setItem('SnapticsUser', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private getRolesFromDecodedToken(decodedToken: any): string[] {
    let roles = decodedToken.role;
    if (!Array.isArray(roles)) {
      roles = [roles]; // nếu có 1 role thì phải chuyển thành mảng vì ở bên HasRoleDirective phải là mảng mới xài được '.some()'
    }
    return roles;
  }

  login(creds: LoginCreds) {
    return this.http.post<User>(this.baseUrl + 'account/login', creds).pipe(
      //.pipe(...): Cho phép bạn xử lý dữ liệu trả về trước khi gửi ra ngoài.
      map((user) => {
        //map() dùng để biến đổi dữ liệu.
        if (user) {
          localStorage.setItem('SnapticsUser', JSON.stringify(user));
          // đổi về dạng object -> txtjson sau đó muốn lấy thì JSON.parse(localStorage.getItem("SnapticsUser"))
          this.setCurrentAccount(user);
        }
        return user;
      }),
    );
  }

  register(creds: RegisterCreds) {
    return this.http.post<void>(this.baseUrl + 'account/register', creds); //.pipe(...): Cho phép bạn xử lý dữ liệu trả về trước khi gửi ra ngoài.
  }

  logout() {
    localStorage.removeItem('SnapticsUser');
    this.currentUser.set(null);
    window.location.href = '/';
  }
}
