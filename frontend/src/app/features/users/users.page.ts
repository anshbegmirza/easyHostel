import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AppUser, UsersService } from './service/users.service';
import { RoomsService, TenantOption } from '../rooms/service/rooms.service';
import { H4TableComponent } from '../../shared/h4-table/h4-table.component';
import { H4TableAction, H4TableColumn, H4TableFilter } from '../../shared/h4-table/h4-table.types';
import { ParentFormDialogComponent } from './parent-form-dialog.component';
import { TenantFormDialogComponent } from './tenant-form-dialog.component';
import {
  UserDialogComponent,
  UserDialogMode,
} from './user-dialog.component';

@Component({
  selector: 'app-users-page',
  imports: [MatButtonModule, MatIconModule, H4TableComponent],
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
})
export class UsersPageComponent implements OnInit {
  readonly api = inject(UsersService);
  readonly rooms = inject(RoomsService);
  readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly users = signal<AppUser[]>([]);
  readonly tenantOptions = signal<TenantOption[]>([]);

  readonly columns: H4TableColumn<AppUser>[] = [
    { key: 'status', header: 'Status', field: 'status', type: 'status', statusField: 'status' },
    { key: 'name', header: 'Name', field: 'name', type: 'strong' },
    { key: 'email', header: 'Email', field: 'email' },
    { key: 'role', header: 'Role', field: 'role' },
  ];

  readonly filters: H4TableFilter[] = [
    {
      key: 'role',
      label: 'Role',
      field: 'role',
      options: [
        { value: 'tenant', label: 'Tenant' },
        { value: 'parent', label: 'Parent' },
        { value: 'staff', label: 'Staff' },
        { value: 'admin', label: 'Admin' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      field: 'status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'active', label: 'Active' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
  ];

  readonly actions: H4TableAction<AppUser>[] = [
    {
      id: 'view',
      icon: 'description',
      tooltip: 'Details',
    },
    {
      id: 'edit',
      icon: 'edit',
      tooltip: 'Edit',
      color: 'primary',
    },
    {
      id: 'approve',
      icon: 'check_circle',
      tooltip: 'Approve',
      color: 'primary',
      show: (row) => row.role === 'tenant' && row.status === 'pending',
    },
    {
      id: 'reject',
      icon: 'cancel',
      tooltip: 'Reject',
      show: (row) => row.role === 'tenant' && row.status === 'pending',
    },
  ];

  ngOnInit() {
    this.reload();
    this.rooms.tenants(false).subscribe({
      next: (res) => this.tenantOptions.set(res.tenants),
    });
  }

  reload() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (res) => {
        this.users.set(res.users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openTenant() {
    this.dialog
      .open(TenantFormDialogComponent, { width: '420px' })
      .afterClosed()
      .subscribe((value) => {
        if (!value) {
          return;
        }
        this.api.createTenant(value).subscribe({ next: () => this.reload() });
      });
  }

  openParent() {
    this.rooms.tenants(false).subscribe({
      next: (res) => {
        this.tenantOptions.set(res.tenants);
        this.dialog
          .open(ParentFormDialogComponent, { width: '440px', data: { tenants: res.tenants } })
          .afterClosed()
          .subscribe((value) => {
            if (!value) {
              return;
            }
            this.api
              .createParent({
                name: value.name,
                email: value.email,
                username: value.username,
                password: value.password,
                tenant_ids: value.tenantIds,
              })
              .subscribe({ next: () => this.reload() });
          });
      },
    });
  }

  openUser(user: AppUser, mode: UserDialogMode) {
    this.dialog
      .open(UserDialogComponent, {
        width: '480px',
        data: { user, mode, tenants: this.tenantOptions() },
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.reload();
        }
      });
  }

  onAction(event: { actionId: string; row: AppUser }) {
    if (event.actionId === 'view') {
      this.openUser(event.row, 'view');
      return;
    }
    if (event.actionId === 'edit') {
      this.openUser(event.row, 'edit');
      return;
    }
    if (event.actionId === 'approve') {
      this.api.approve(event.row.id).subscribe({ next: () => this.reload() });
      return;
    }
    if (event.actionId === 'reject') {
      this.api.reject(event.row.id).subscribe({ next: () => this.reload() });
    }
  }
}
