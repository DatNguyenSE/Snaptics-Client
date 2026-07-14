import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { LoginCreds, LoginResponse, RegisterCreds, User } from '../../models/user';

// ─── Mock Auth Configuration ──────────────────────────────────────────────────
// Cờ này chỉ true khi KHÔNG phải production VÀ flag trong environment được bật.
// Đây là lớp bảo vệ kép: dù ai đó set useMockAuth=true trên production thì cũng
// bị chặn bởi điều kiện !environment.production.
const USE_MOCK_AUTH = !environment.production && environment.useMockAuth === true;

// Key lưu mock session trong sessionStorage (chỉ lưu user object, không có password)
const MOCK_SESSION_KEY = '__snaptics_mock_session__';

// Thông tin tài khoản mock — password KHÔNG được lưu vào bất kỳ storage nào
const MOCK_EMAIL = 'admin@mock.local';
const MOCK_PASSWORD = '123456';

// Tạo JWT giả với role ADMIN — payload được base64url encode
// Header: {"alg":"none","typ":"JWT"}
// Payload: {"sub":"mock-admin-001","role":"ADMIN","email":"admin@mock.local","nbf":0,"exp":9999999999}
function buildMockToken(): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payload = btoa(JSON.stringify({
    sub: 'mock-admin-001',
    role: 'ADMIN',
    email: MOCK_EMAIL,
    nbf: 0,
    exp: 9999999999,
    iat: Math.floor(Date.now() / 1000),
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signature = 'mock-signature-not-for-production';
  return `${header}.${payload}.${signature}`;
}

const MOCK_USER: User = {
  id: 'mock-admin-001',
  displayName: 'Mock Admin',
  email: MOCK_EMAIL,
  token: buildMockToken(),
  imageUrl: undefined,
  roles: ['ADMIN'],
};

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
  readonly useMockAuth: boolean = USE_MOCK_AUTH;

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
    try {
      const payload = user.token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const jsonPayload = JSON.parse(decoded);
      return Array.isArray(jsonPayload.role) ? jsonPayload.role : [jsonPayload.role];
    } catch {
      return user.roles || [];
    }
  }

  // ─── Mock Session Persistence ────────────────────────────────────────────────
  // Lưu flag session vào sessionStorage để restore khi F5 (không lưu password).
  // sessionStorage tự động xoá khi đóng tab — an toàn cho dev environment.

  private saveMockSession(): void {
    const sessionData = {
      id: MOCK_USER.id,
      displayName: MOCK_USER.displayName,
      email: MOCK_USER.email,
      imageUrl: MOCK_USER.imageUrl,
      roles: MOCK_USER.roles,
      // token được tạo lại mỗi lần để tránh token cũ hết hạn
      token: buildMockToken(),
    };
    sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(sessionData));
  }

  private clearMockSession(): void {
    sessionStorage.removeItem(MOCK_SESSION_KEY);
  }

  /**
   * Được gọi từ InitService khi app khởi động.
   * Nếu tìm thấy mock session trong sessionStorage thì restore lại auth state
   * mà không cần gọi refreshToken API.
   * @returns true nếu đã restore mock session thành công
   */
  tryRestoreMockSession(): boolean {
    if (!USE_MOCK_AUTH) return false;

    const raw = sessionStorage.getItem(MOCK_SESSION_KEY);
    if (!raw) return false;

    try {
      const saved = JSON.parse(raw) as User;
      // Tạo lại token mới để đảm bảo luôn valid
      saved.token = buildMockToken();
      this.currentUser.set(saved);
      this.isMockSession.set(true);
      return true;
    } catch {
      this.clearMockSession();
      return false;
    }
  }

  // ─── Login ────────────────────────────────────────────────────────────────────

  login(creds: LoginCreds) {
    // Mock login: chỉ kích hoạt khi USE_MOCK_AUTH=true và KHÔNG phải production
    // if (USE_MOCK_AUTH) {
    //   return this.mockLogin(creds);
    // }

    // Real API login (không thay đổi)
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

  /**
   * Mock login: kiểm tra credential mock, tạo user giả, cập nhật auth state.
   * Nếu credential sai → trả về Observable error giống lỗi API thật.
   * KHÔNG lưu password vào bất kỳ storage nào.
   */
  private mockLogin(creds: LoginCreds) {
    // Kiểm tra credential — so sánh email và password với tài khoản mock
    const isValidUser =
      creds.email === MOCK_EMAIL &&
      creds.password === MOCK_PASSWORD;

    if (!isValidUser) {
      // Trả về lỗi giống format lỗi API thật để component xử lý đồng nhất
      return throwError(() => ({
        status: 401,
        error: '[Mock Mode] Invalid mock credentials. Use admin@mock.local / 123456',
      }));
    }

    // Tạo user object (không chứa password)
    const mockUser: User = {
      ...MOCK_USER,
      token: buildMockToken(),
    };

    // Cập nhật auth state
    this.currentUser.set(mockUser);
    this.isMockSession.set(true);

    // Lưu session flag vào sessionStorage (không có password)
    this.saveMockSession();

    // Trả về Observable<User> giống format login thật
    return of(mockUser);
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

  // ─── Logout ───────────────────────────────────────────────────────────────────

  logout(redirectUrl = '/dang-nhap') {
    // Nếu là mock session thì không gọi API logout
    if (this.isMockSession()) {
      this.clearMockSession();
      this.isMockSession.set(false);
      this.currentUser.set(null);
      void this.router.navigateByUrl(redirectUrl);
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

  // ─── Token Refresh ────────────────────────────────────────────────────────────

  refreshToken() {
    return this.http.post<User>(
      this.baseUrl + 'account/refresh-token',
      {},
      { withCredentials: true },
    );
  }

  startTokenRefreshInterval() {
    // Không chạy refresh interval cho mock session
    if (this.isMockSession()) return;

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
