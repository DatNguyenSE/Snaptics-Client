import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap, throwError, catchError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { LoginCreds, RegisterCreds, User } from '../../models/user';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  isMockSession = signal<boolean>(false);
  readonly useMockAuth: boolean = false;

  protected baseUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl + 'Account'
    : environment.apiUrl + '/Account';

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

  login(creds: LoginCreds): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/login`, creds, { withCredentials: true })
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
        catchError((err: any) => throwError(() => err))
      );
  }

  // ─── Register / OTP / Password ────────────────────────────────────────────────

  register(creds: RegisterCreds): Observable<string> {
    return this.http.post(`${this.baseUrl}/register`, creds, { responseType: 'text' }).pipe(
      catchError((err: any) => throwError(() => err))
    );
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-otp`, { email, otp }, { withCredentials: true, responseType: 'text' })
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
        }),
        catchError((err: any) => throwError(() => err))
      );
  }

  resendOtp(email: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/resend-otp`, { email }, { responseType: 'text' }).pipe(
      catchError((err: any) => throwError(() => err))
    );
  }

  forgotPassword(email: string): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/forgot-password`,
      { email },
      { responseType: 'text' },
    ).pipe(
      catchError((err: any) => throwError(() => err))
    );
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/reset-password`,
      { email, token, newPassword },
      { responseType: 'text' },
    ).pipe(
      catchError((err: any) => throwError(() => err))
    );
  }

  // ─── Logout ───────────────────────────────────────────────────────────────────

  logout(redirectUrl = '/dang-nhap'): void {
    this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.clearSessionAndRedirect(redirectUrl);
      },
      error: () => {
        this.clearSessionAndRedirect(redirectUrl);
      },
    });
  }

  // ─── Token Refresh ────────────────────────────────────────────────────────────

  refreshToken(): Observable<User> {
    return this.http.post<User>(
      `${this.baseUrl}/refresh-token`,
      {},
      { withCredentials: true },
    ).pipe(
      catchError((err: any) => throwError(() => err))
    );
  }

  startTokenRefreshInterval(): void {
    setInterval(
      () => {
        this.http
          .post<User>(`${this.baseUrl}/refresh-token`, {}, { withCredentials: true })
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

  private clearSessionAndRedirect(redirectUrl: string): void {
    this.currentUser.set(null);
    void this.router.navigateByUrl(redirectUrl);
  }
}
