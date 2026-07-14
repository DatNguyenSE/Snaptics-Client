import { inject, Injectable } from '@angular/core';
import { AccountService } from './account-service';
import { Router } from '@angular/router';
import { tap } from 'rxjs/internal/operators/tap';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InitService {
  private accountService = inject(AccountService);
  private router = inject(Router);

  init() {
    // Thử restore mock session trước (nếu mock mode đang bật và có session)
    // Nếu thành công, bỏ qua refreshToken API để tránh lỗi khi backend không chạy
    const mockRestored = this.accountService.tryRestoreMockSession();
    if (mockRestored) {
      return of(null);
    }

    // Luồng thật: gọi refreshToken để restore session từ cookie HTTP-only
    return this.accountService.refreshToken().pipe(
      tap(user => {
        if (user) {
          this.accountService.setCurrentUser(user);
          this.accountService.startTokenRefreshInterval();
        }
      }),
      catchError((error) => {
        console.log('Không thể làm mới token:', error);
        return of(null); 
      })
    );
  }
}