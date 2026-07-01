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
  protected baseUrl = environment.apiUrl;

  setCurrentUser(user: User) {
    if (user.token) {
      user.roles = this.getRolesFromToken(user);
    } else {
      user.roles = user.roles || [];
    }
    this.currentUser.set(user);
  }

  private getRolesFromToken(user: User): string[] {
    const payload = user.token.split('.')[1];
    const decoded = atob(payload);
    const jsonPayload = JSON.parse(decoded);
    return Array.isArray(jsonPayload.role) ? jsonPayload.role : [jsonPayload.role];
  }

  login(creds: LoginCreds) {
    return this.http
      .post<any>(this.baseUrl + 'account/login', creds, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response) {
            if (response.user) {
              this.setCurrentUser(response.user);
            } else if (response.email || response.id) {
              this.setCurrentUser(response as User);
            }
            if (this.currentUser()) {
              this.startTokenRefreshInterval();      
            }
          }

          return response;
        }),
      );
  }

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
          } catch (e) {}

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
