import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../core/authentication/auth.service';
import { ThemeMenuComponent } from '../shared/theme-menu/theme-menu.component';
import { PwaInstallBannerComponent } from '../shared/pwa-install-banner/pwa-install-banner.component';
import { ConfirmDialogService } from '../shared/confirm-dialog/confirm-dialog.service';
import { AppNotification, NotificationsService } from './service/notifications.service';
import { isParentRole, isStaffRole, isTenantRole } from '../core/roles';
import { CredentialsService } from '../core/authentication/credentials.service';

type NavLink = { path: string; label: string; icon: string; exact: boolean };
type NavItem = NavLink | { label: string; icon: string; children: NavLink[] };

function isNavGroup(item: NavItem): item is { label: string; icon: string; children: NavLink[] } {
  return 'children' in item;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    DatePipe,
    ThemeMenuComponent,
    PwaInstallBannerComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly credentials = inject(CredentialsService);
  readonly notificationsService = inject(NotificationsService);
  readonly confirmDialog = inject(ConfirmDialogService);
  readonly router = inject(Router);
  readonly drawer = viewChild<MatSidenav>('drawer');

  readonly notifications = signal<AppNotification[]>([]);
  readonly unread = signal(0);
  readonly settingsOpen = signal(false);
  readonly isGroup = isNavGroup;

  readonly handset = toSignal(
    inject(BreakpointObserver)
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  readonly navItems = computed(() => {
    const role = this.auth.user()?.role;
    const can = (code: string) => this.credentials.hasModule(code);

    const settingsChildren: NavLink[] = [
      ...(can('users') ? [{ path: '/users', label: 'Users', icon: 'group', exact: false }] : []),
      ...(role === 'superuser'
        ? [
            { path: '/user-roles', label: 'User roles', icon: 'admin_panel_settings', exact: false },
            { path: '/templates', label: 'Template management', icon: 'view_quilt', exact: false },
          ]
        : []),
      { path: '/profile', label: 'Profile', icon: 'person', exact: false },
    ];
    const settings: NavItem = {
      label: 'Settings',
      icon: 'settings',
      children: settingsChildren,
    };

    if (isStaffRole(role)) {
      const items: NavItem[] = [];
      if (can('dashboard')) {
        items.push({ path: '/', label: 'Dashboard', icon: 'dashboard', exact: true });
      }
      if (can('rooms')) {
        items.push({ path: '/rooms', label: 'Rooms', icon: 'meeting_room', exact: false });
      }
      if (can('room-changes')) {
        items.push({ path: '/room-changes', label: 'Room changes', icon: 'swap_horiz', exact: false });
      }
      if (can('fees')) {
        items.push({ path: '/fees', label: 'Fees', icon: 'payments', exact: false });
      }
      if (can('complaints')) {
        items.push({ path: '/complaints', label: 'Complaints', icon: 'report_problem', exact: false });
      }
      if (can('notices')) {
        items.push({ path: '/notices', label: 'Notices', icon: 'campaign', exact: false });
      }
      if (can('reports')) {
        items.push({ path: '/reports', label: 'Reports', icon: 'assessment', exact: false });
      }
      items.push(settings);
      return items;
    }
    if (isParentRole(role) || isTenantRole(role)) {
      const items: NavItem[] = [];
      if (can('dashboard')) {
        items.push({ path: '/', label: 'Dashboard', icon: 'home', exact: true });
      }
      if (isTenantRole(role) && can('my-room')) {
        items.push({ path: '/my-room', label: 'My room', icon: 'bed', exact: false });
      }
      if (can('fees')) {
        items.push({ path: '/fees', label: 'Fees', icon: 'payments', exact: false });
      }
      if (can('complaints')) {
        items.push({ path: '/complaints', label: 'Complaints', icon: 'report_problem', exact: false });
      }
      if (can('notices')) {
        items.push({ path: '/notices', label: 'Notices', icon: 'campaign', exact: false });
      }
      items.push(settings);
      return items;
    }
    return [{ path: '/', label: 'Dashboard', icon: 'home', exact: true }, settings];
  });

  ngOnInit() {
    this.settingsOpen.set(this.isSettingsUrl(this.router.url));
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.isSettingsUrl(e.urlAfterRedirects)) {
          this.settingsOpen.set(true);
        }
      });
    this.loadNotifications();
  }

  trackNav(item: NavItem) {
    return isNavGroup(item) ? `group:${item.label}` : item.path;
  }

  toggleSettings() {
    this.settingsOpen.update((open) => !open);
  }

  isSettingsUrl(url: string) {
    return (
      url.startsWith('/users') ||
      url.startsWith('/profile') ||
      url.startsWith('/user-roles') ||
      url.startsWith('/templates')
    );
  }

  loadNotifications() {
    this.notificationsService.list().subscribe({
      next: (res) => {
        this.notifications.set(res.notifications);
        this.unread.set(res.unread);
      },
    });
  }

  markAllRead() {
    this.notificationsService.markAllRead().subscribe({
      next: () => {
        this.unread.set(0);
        this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
      },
    });
  }

  openNotif(n: AppNotification) {
    if (!n.read) {
      this.notificationsService.markRead(n.id).subscribe({
        next: () => {
          this.unread.update((u) => Math.max(0, u - 1));
          this.notifications.update((list) =>
            list.map((item) => (item.id === n.id ? { ...item, read: true } : item))
          );
        },
      });
    }
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
  }

  initials() {
    const name = this.auth.user()?.name || '?';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('');
  }

  closeIfHandset() {
    if (this.handset()) {
      this.drawer()?.close();
    }
  }

  goToProfile() {
    this.router.navigateByUrl('/profile');
    this.closeIfHandset();
  }

  logout() {
    this.confirmDialog
      .open({
        title: 'Log out',
        message: 'Are you sure you want to log out?',
        confirmText: 'Log out',
        confirmColor: 'primary',
      })
      .subscribe((ok) => {
        if (ok) {
          this.auth.logout();
        }
      });
  }
}
