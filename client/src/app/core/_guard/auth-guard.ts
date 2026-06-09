import { CanActivateFn, Router } from '@angular/router';
import { AccountService } from '../services/account-service';
import { inject } from '@angular/core';
import { ToastService } from '../services/toast-service';

export const authGuard: CanActivateFn = (route, state) => {
  const accountService = inject(AccountService);
  const toast = inject(ToastService);
  const routers = inject(Router);

  if(accountService.currentUser()) {
    return true;
  }else{
    toast.error('Đăng nhập để sử dụng!');
    console.log('You shall not pass!');
    return routers.createUrlTree(['/login']);
  }
};
