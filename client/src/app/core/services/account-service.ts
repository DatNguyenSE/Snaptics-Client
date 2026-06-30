import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { LoginCreds, RegisterCreds, User } from '../../models/user';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  protected baseUrl = environment.apiUrl;

  private useMockAuth = false;

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

  updateProfile(profile: Pick<User, 'displayName' | 'email'>): void {
    const activeUser = this.currentUser() ?? this.getStoredUser();

    if (!activeUser) {
      return;
    }

    const updatedUser: User = {
      ...activeUser,
      displayName: profile.displayName?.trim() || activeUser.displayName,
      email: profile.email.trim(),
    };

    this.currentUser.set(updatedUser);
    localStorage.setItem('SnapticsUser', JSON.stringify(updatedUser));
  }

  private getRolesFromToken(user: User): string[] {
    const payload = user.token.split('.')[1];
    const decoded = atob(payload);
    const jsonPayload = JSON.parse(decoded);
    return Array.isArray(jsonPayload.role) ? jsonPayload.role : [jsonPayload.role];
  }

  login(creds: LoginCreds) {
    if (this.useMockAuth) {
      const mockUser = this.mockUsers.find(
        (item) => item.email === creds.email && item.password === creds.password,
      );

      if (!mockUser) {
        return throwError(() => ({
          error: 'Email or password is incorrect',
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
      .post<any>(this.baseUrl + 'account/login', creds, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response && response.token) {
            this.setCurrentUser(response as User);
            localStorage.setItem('SnapticsUser', JSON.stringify(response));
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

          if (parsedResponse && parsedResponse.token) {
            this.setCurrentUser(parsedResponse as User);
            localStorage.setItem('SnapticsUser', JSON.stringify(parsedResponse));
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

  refreshToken() {
    if (this.useMockAuth) {
      const user = this.getStoredUser();

      if (!user) {
        return throwError(() => ({
          error: 'No mock user found in localStorage',
        }));
      }

      this.setCurrentUser(user);

      return of(user);
    }

    return this.http.post<User>(
      this.baseUrl + 'account/refresh-token',
      {},
      { withCredentials: true },
    );
  }

  startTokenRefreshInterval() {
    if (this.useMockAuth) {
      return;
    }

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
    localStorage.removeItem('SnapticsUser');
    void this.router.navigateByUrl(redirectUrl);
  }

  private getStoredUser(): User | null {
    const savedUser = localStorage.getItem('SnapticsUser');

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser) as User;
  }
}
