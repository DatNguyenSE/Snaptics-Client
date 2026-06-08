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