import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { LoginCreds, LoginResponse, RegisterCreds, User } from '../../models/user';


@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<User | null>(null);

  /** true nếu user đang đăng nhập bằng tài khoản mock (dùng để hiển thị nhãn UI) */
  isMockSession = signal<boolean>(false);

  /** Expose mock mode flag để template và các component có thể đọc */
  readonly useMockAuth: boolean = false;

  protected baseUrl = environment.apiUrl;

  setCurrentUser(user: User) {
    if (user && user.token) {
      user.roles = this.getRolesFromToken(user);
    } else if (user) {
      const backendRoles = user.roles || (user as any).role || [];
      const rolesArray = Array.isArray(backendRoles) ? backendRoles : [backendRoles];
      user.roles = rolesArray.map((r: any) => typeof r === 'string' ? r.toUpperCase() : r);
    }
    this.currentUser.set(user);
  }

  private getRolesFromToken(user: User): string[] {
    try {
      const payload = user.token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const jsonPayload = JSON.parse(decoded);
      const roleClaim = jsonPayload.role || jsonPayload.roles || jsonPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      
      if (!roleClaim) return [];
      
      const rolesArray = Array.isArray(roleClaim) ? roleClaim : [roleClaim];
      return rolesArray.map((r: any) => typeof r === 'string' ? r.toUpperCase() : r);
    } catch {
      return user.roles || [];
    }
  }

  // ─── Login ────────────────────────────────────────────────────────────────────

  login(creds: LoginCreds) {
    // Real API login

    return this.http
      .post<any>(this.baseUrl + 'account/login', creds, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response) {
            if (response.user) {
              const userObj = response.user;
              const token = response.token || response.accessToken;
              if (token) userObj.token = token;
              if (response.roles) userObj.roles = response.roles;
              this.setCurrentUser(userObj);
            } else if (response.email || response.id) {
              const userObj = response as User;
              const token = response.token || response.accessToken;
              if (token && !userObj.token) userObj.token = token;
              this.setCurrentUser(userObj);
            }
            if (this.currentUser()) {
              this.startTokenRefreshInterval();
            }
          }

          return response;
        }),
      );
  }


  // ─── Register / OTP / Password ────────────────────────────────────────────────

  register(creds: RegisterCreds) {
    return this.http.post(this.baseUrl + 'account/register', creds, { responseType: 'text' });
  }

  verifyOtp(email: string, otp: string) {
    return this.http.post(this.baseUrl + 'account/verify-otp', { email, otp }, { withCredentials: true, responseType: 'text' })
      .pipe(
        map((response: string) => {
          let parsedResponse: any = response;
          try {
            parsedResponse = JSON.parse(response);
          } catch (e) { }

          if (parsedResponse && typeof parsedResponse === 'object' && (parsedResponse.email || parsedResponse.id || parsedResponse.token)) {
            this.setCurrentUser(parsedResponse as User);
          }
          return parsedResponse;
        })
      );
  }

  resendOtp(email: string) {
    return this.http.post(this.baseUrl + 'account/resend-otp', { email }, { responseType: 'text' });
  }

  forgotPassword(email: string) {
    return this.http.post(
      this.baseUrl + 'account/forgot-password',
      { email },
      { responseType: 'text' },
    );
  }

  resetPassword(email: string, token: string, newPassword: string) {
    return this.http.post(
      this.baseUrl + 'account/reset-password',
      { email, token, newPassword },
      { responseType: 'text' },
    );
  }

  // ─── Logout ───────────────────────────────────────────────────────────────────

  logout(redirectUrl = '/dang-nhap') {
    this.http.post(this.baseUrl + 'account/logout', {}, { withCredentials: true }).subscribe({
      next: () => {
        this.clearSessionAndRedirect(redirectUrl);
      },
      error: () => {
        this.clearSessionAndRedirect(redirectUrl);
      },
    });
  }

  // ─── Token Refresh ────────────────────────────────────────────────────────────

  refreshToken() {
    return this.http.post<User>(
      this.baseUrl + 'account/refresh-token',
      {},
      { withCredentials: true },
    );
  }

  startTokenRefreshInterval() {
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

  private clearSessionAndRedirect(redirectUrl: string) {
    this.currentUser.set(null);
    void this.router.navigateByUrl(redirectUrl);
  }
}
