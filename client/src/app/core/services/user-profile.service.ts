import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChangeEmailDto, ChangePasswordDto, UpdateProfileDto, UserProfileDto } from '../../models/user-profile.dto';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/user/profile`;

  /**
   * [GET] /api/user/profile - Lấy thông tin hồ sơ cá nhân
   */
  getProfile(): Observable<UserProfileDto> {
    return this.http
      .get<UserProfileDto>(this.baseUrl, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  /**
   * [PUT] /api/user/profile - Cập nhật thông tin cá nhân
   */
  updateProfile(dto: UpdateProfileDto): Observable<string> {
    return this.http
      .put(this.baseUrl, dto, { withCredentials: true, responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  /**
   * [POST] /api/user/profile/avatar - Tải lên ảnh đại diện
   */
  uploadAvatar(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ imageUrl: string }>(`${this.baseUrl}/avatar`, formData, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  /**
   * [PUT] /api/user/profile/email - Đổi email
   */
  changeEmail(dto: ChangeEmailDto): Observable<string> {
    return this.http
      .put(`${this.baseUrl}/email`, dto, { withCredentials: true, responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  /**
   * [PUT] /api/user/profile/password - Đổi mật khẩu
   */
  changePassword(dto: ChangePasswordDto): Observable<string> {
    return this.http
      .put(`${this.baseUrl}/password`, dto, { withCredentials: true, responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('UserProfileService Error:', error);
    const message =
      error?.error?.message ||
      error?.message ||
      error?.error ||
      'Có lỗi xảy ra khi gọi API.';
    return throwError(() => new Error(message));
  }
}
