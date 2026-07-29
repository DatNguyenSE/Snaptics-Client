import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChangeSecurityDto, UpdateProfileDto, UserProfileDto } from '../../models/user-profile.dto';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/user-profile`;

  /**
   * [GET] /api/user-profile - Lấy thông tin hồ sơ cá nhân
   */
  getProfile(): Observable<UserProfileDto> {
    return this.http
      .get<UserProfileDto>(this.baseUrl, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  /**
   * [PUT] /api/user-profile - Cập nhật thông tin cá nhân
   */
  updateProfile(dto: UpdateProfileDto): Observable<UserProfileDto> {
    return this.http
      .put<UserProfileDto>(this.baseUrl, dto, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  /**
   * [POST] /api/user-profile/change-security - Đổi mật khẩu/bảo mật
   */
  changeSecurity(dto: ChangeSecurityDto): Observable<{ message: string; success?: boolean }> {
    return this.http
      .post<{ message: string; success?: boolean }>(`${this.baseUrl}/change-security`, dto, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('UserProfileService Error:', error);
    const message =
      error?.error?.message ||
      error?.message ||
      'Có lỗi xảy ra khi cập nhật hồ sơ cá nhân.';
    return throwError(() => new Error(message));
  }
}
