import { Routes } from '@angular/router';
import {
  authGuard,
  guestGuard,
  moduleGuard,
  superuserGuard,
  tenantGuard,
} from './core/authentication/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPageComponent),
      },
      {
        path: 'users',
        canActivate: [moduleGuard('users')],
        loadComponent: () =>
          import('./features/users/users.page').then((m) => m.UsersPageComponent),
      },
      {
        path: 'user-roles',
        canActivate: [superuserGuard],
        loadComponent: () =>
          import('./features/roles/user-roles.page').then((m) => m.UserRolesPageComponent),
      },
      {
        path: 'user-roles/:userId',
        canActivate: [superuserGuard],
        loadComponent: () =>
          import('./features/roles/modules-edit.page').then(
            (m) => m.ModulesEditPageComponent
          ),
      },
      {
        path: 'templates',
        canActivate: [superuserGuard],
        loadComponent: () =>
          import('./features/roles/templates.page').then((m) => m.TemplatesPageComponent),
      },
      {
        path: 'templates/new',
        canActivate: [superuserGuard],
        loadComponent: () =>
          import('./features/roles/modules-edit.page').then(
            (m) => m.ModulesEditPageComponent
          ),
      },
      {
        path: 'templates/:templateId',
        canActivate: [superuserGuard],
        loadComponent: () =>
          import('./features/roles/modules-edit.page').then(
            (m) => m.ModulesEditPageComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.page').then((m) => m.ProfilePageComponent),
      },
      {
        path: 'rooms',
        canActivate: [moduleGuard('rooms')],
        loadComponent: () =>
          import('./features/rooms/rooms.page').then((m) => m.RoomsPageComponent),
      },
      {
        path: 'room-changes',
        canActivate: [moduleGuard('room-changes')],
        loadComponent: () =>
          import('./features/room-changes/room-changes.page').then((m) => m.RoomChangesPageComponent),
      },
      {
        path: 'my-room',
        canActivate: [tenantGuard],
        loadComponent: () =>
          import('./features/rooms/my-room.page').then((m) => m.MyRoomPageComponent),
      },
      {
        path: 'fees',
        loadComponent: () =>
          import('./features/fees/fees.page').then((m) => m.FeesPageComponent),
      },
      {
        path: 'fees/:id/receipt',
        loadComponent: () =>
          import('./features/fees/receipt.page').then((m) => m.ReceiptPageComponent),
      },
      {
        path: 'complaints',
        loadComponent: () =>
          import('./features/complaint/complaints.page').then((m) => m.ComplaintsPageComponent),
      },
      {
        path: 'complaints/:id',
        loadComponent: () =>
          import('./features/complaint/complaint-detail/complaint-detail.page').then(
            (m) => m.ComplaintDetailPageComponent
          ),
      },
      {
        path: 'notices',
        loadComponent: () =>
          import('./features/notices/notices.page').then((m) => m.NoticesPageComponent),
      },
      {
        path: 'reports',
        canActivate: [moduleGuard('reports')],
        loadComponent: () =>
          import('./features/reports/reports.page').then((m) => m.ReportsPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
