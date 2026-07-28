import { Routes } from '@angular/router';
import { authGuard } from './core/_guard/auth-guard';
import { adminGuard } from './admin/guards/admin.guard';
import { maintenanceGuard } from './core/guards/maintenance.guard';
import { ForgotPassword } from './features/account/forgot-password/forgot-password';
import { Login } from './features/account/login/login';
import { Register } from './features/account/register/register';
import { LandingPage } from './features/landing-page/landing-page';
import { SettingsPage } from './settings-page/settings-page';
import { UserPage } from './user-page/user-page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'landing',
    component: LandingPage,
    canActivate: [maintenanceGuard],
  },
  {
    path: 'Trang-chu',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'trang-chu',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'Home-page',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'home',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'maintenance',
    canActivate: [maintenanceGuard],
    loadComponent: () =>
      import('./features/maintenance/maintenance.component').then((m) => m.MaintenanceComponent),
  },
  {
    path: 'dang-nhap',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'Login',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'dang-ky',
    redirectTo: 'register',
    pathMatch: 'full',
  },
  {
    path: 'Register',
    redirectTo: 'register',
    pathMatch: 'full',
  },
  {
    path: 'quen-mat-khau',
    redirectTo: 'forgot-password',
    pathMatch: 'full',
  },
  {
    path: 'ForgotPassword',
    redirectTo: 'forgot-password',
    pathMatch: 'full',
  },
  {
    path: 'user',
    component: UserPage,
    runGuardsAndResolvers: 'always',
    canActivate: [maintenanceGuard, authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./user-page/user-features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'budget',
        loadComponent: () =>
          import('./user-page/user-features/budget/budget').then((m) => m.Budget),
      },
      {
        path: 'budget/:budgetId',
        loadComponent: () =>
          import('./user-page/user-features/budget/shared-budget-detail/shared-budget-detail').then(
            (m) => m.SharedBudgetDetail
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./user-page/user-features/transaction/transaction').then((m) => m.Transaction),
      },
      {
        path: 'analysis',
        loadComponent: () =>
          import('./user-page/user-features/analysis/analysis').then((m) => m.Analysis),
      },
      {
        path: 'scan',
        loadComponent: () =>
          import('./user-page/user-features/scan/scan').then((m) => m.Scan),
      },
      {
        path: 'notification',
        loadComponent: () =>
          import('./user-page/user-features/notification/notification').then((m) => m.Notification),
      },
      {
        path: 'category',
        loadComponent: () =>
          import('./user-page/user-features/category/category').then((m) => m.Category),
      },

      {
        path: 'manual-entry',
        loadComponent: () =>
          import('./user-page/user-features/manual-entry/manual-entry').then(
            (m) => m.ManualEntry,
          ),
      },
      {
        path: 'in-come-source',
        loadComponent: () =>
          import('./user-page/user-features/in-come-source/in-come-source').then(
            (m) => m.InComeSource,
          ),
      },
      {
        path: 'frequency',
        loadComponent: () =>
          import('./user-page/user-features/frequency/frequency').then((m) => m.Frequency),
      },
      {
        path: 'snaptics-ai',
        loadComponent: () =>
          import('./user-page/user-features/snaptics-ai/snaptics-ai').then((m) => m.SnapticsAIPage),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./user-page/user-features/support/support').then((m) => m.Support),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'support',
    redirectTo: 'user/support',
    pathMatch: 'full',
  },
  {
    path: 'settings',
    component: SettingsPage,
    runGuardsAndResolvers: 'always',
    canActivate: [maintenanceGuard, authGuard],
  },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'forgot-password', component: ForgotPassword },

  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
