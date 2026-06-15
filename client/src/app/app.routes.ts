import { Routes } from '@angular/router';
import { authGuard } from './core/_guard/auth-guard';
import { ForgotPassword } from './features/account/forgot-password/forgot-password';
import { Login } from './features/account/login/login';
import { Register } from './features/account/register/register';
import { SettingsPage } from './settings-page/settings-page';
import { UserPage } from './user-page/user-page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'user',
    pathMatch: 'full',
  },
  {
    path: 'Trang-chu',
    redirectTo: 'user',
    pathMatch: 'full',
  },
  {
    path: 'trang-chu',
    redirectTo: 'user',
    pathMatch: 'full',
  },
  {
    path: 'Home-page',
    redirectTo: 'user',
    pathMatch: 'full',
  },
  {
    path: 'home',
    redirectTo: 'user',
    pathMatch: 'full',
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
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./user-page/user-features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./user-page/user-features/transaction/transaction').then((m) => m.Transaction),
      },
      {
        path: 'scan',
        loadComponent: () =>
          import('./user-page/user-features/scan/scan').then((m) => m.Scan),
      },
      {
        path: 'reminders',
        loadComponent: () =>
          import('./user-page/user-features/reminder/reminder').then((m) => m.Reminder),
      },
      {
        path: 'reminder',
        redirectTo: 'reminders',
        pathMatch: 'full',
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'settings',
    component: SettingsPage,
    runGuardsAndResolvers: 'always',
    canActivate: [authGuard],
  },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'forgot-password', component: ForgotPassword },
];
