import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AccountService } from '../../core/services/account-service';
import { ToastService } from '../../core/services/toast-service';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

/**
 * Admin guard — checks authentication AND admin role.
 * - Not logged in → /login
 * - Logged in but not admin → /user/dashboard
 * - Has admin role → allow access
 *
 * Supports roles from JWT: payload.role (string | string[]) and payload.roles
 * as well as the MS identity claims namespace role claim.
 * Frontend guard is a UX layer — backend must enforce authorization independently.
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
  const hasAdminRole = roles.some((r) => ADMIN_ROLES.includes(r));

  if (!hasAdminRole) {
    toast.warning('Bạn không có quyền truy cập trang quản trị.');
    return router.createUrlTree(['/user/dashboard']);
  }

  return true;
};

/**
 * Super admin guard — only SUPER_ADMIN can access.
 * ADMIN is redirected to /admin/overview with an access denied message.
 */
export const superAdminGuard: CanActivateFn = () => {
  const accountService = inject(AccountService);
  const toast = inject(ToastService);
  const router = inject(Router);

  const user = accountService.currentUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  const roles = user.roles ?? [];
  const isSuperAdmin = roles.includes('SUPER_ADMIN');

  if (!isSuperAdmin) {
    toast.warning('Chỉ Super Admin mới có thể truy cập System Settings.');
    return router.createUrlTree(['/admin/overview']);
  }

  return true;
};
