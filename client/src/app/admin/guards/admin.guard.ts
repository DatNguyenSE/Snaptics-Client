import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AccountService } from '../../core/services/account-service';
import { ToastService } from '../../core/services/toast-service';

/**
 * Admin guard — checks authentication AND ADMIN role.
 * - Not logged in → /login
 * - Logged in but not ADMIN → /user/dashboard with warning toast
 * - Has ADMIN role → allow access
 */
export const adminGuard: CanActivateFn = () => {
  const accountService = inject(AccountService);
  const toast = inject(ToastService);
  const router = inject(Router);

  const user = accountService.currentUser();

  if (!user) {
    toast.error('Vui lòng đăng nhập để tiếp tục.');
    return router.createUrlTree(['/login']);
  }

  const roles = user.roles ?? [];
  const hasAdminRole = roles.includes('ADMIN');

  if (!hasAdminRole) {
    toast.warning('Bạn không có quyền truy cập trang quản trị.');
    return router.createUrlTree(['/user/dashboard']);
  }

  return true;
};
