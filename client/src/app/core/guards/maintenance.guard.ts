import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AccountService } from '../services/account-service';
import { SystemStatusService } from '../services/system-status.service';

/**
 * Maintenance Guard
 * - When maintenance mode is active:
 *   - ADMIN users can navigate normally (not blocked).
 *   - Non-admin users attempting to access application routes are redirected to /maintenance.
 *   - Whitelisted routes like /login or /maintenance are allowed.
 * - When maintenance mode is off:
 *   - If a user tries to access /maintenance directly, redirect to home page.
 */
export const maintenanceGuard: CanActivateFn = (route, state) => {
  const accountService = inject(AccountService);
  const statusService = inject(SystemStatusService);
  const router = inject(Router);

  const currentPath = state.url.split('?')[0];
  const isMaintenancePage = currentPath === '/maintenance';
  const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login');

  const status = statusService.status();
  const isMaintenanceOn = status.maintenanceMode;

  const user = accountService.currentUser();
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('ADMIN');

  // If Maintenance is active
  if (isMaintenanceOn) {
    // Admin is completely unrestricted
    if (isAdmin) {
      return true;
    }

    // Allow login route for admin access
    if (isLoginPage) {
      return true;
    }

    // Allow maintenance page itself to avoid redirect loop
    if (isMaintenancePage) {
      return true;
    }

    // Redirect regular users/guests to maintenance page
    return router.createUrlTree(['/maintenance']);
  }

  // If Maintenance is OFF
  if (isMaintenancePage) {
    // Prevent staying on maintenance page when system is operational
    return router.createUrlTree(['/']);
  }

  return true;
};
