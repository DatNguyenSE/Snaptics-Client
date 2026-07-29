import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./pages/overview/overview.component').then((m) => m.OverviewComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/user-list/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./pages/users/user-detail/user-detail.component').then((m) => m.UserDetailComponent),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./pages/tickets/tickets.component').then((m) => m.AdminTicketsComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      {
        path: 'ai-operations',
        loadComponent: () =>
          import('./pages/ai-operations/ai-operations.component').then((m) => m.AiOperationsComponent),
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./pages/audit-logs/audit-logs.component').then((m) => m.AuditLogsComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'settings',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/system-settings/system-settings.component').then((m) => m.SystemSettingsComponent),
      },
      {
        path: 'system-config',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/system-config/system-config.component').then((m) => m.SystemConfigComponent),
      },
      {
        path: '**',
        loadComponent: () =>
          import('../features/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
