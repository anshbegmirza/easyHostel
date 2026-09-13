import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RoleUserRow, RolesService } from './service/roles.service';
import { H4TableComponent } from '../../shared/h4-table/h4-table.component';
import { H4TableAction, H4TableColumn, H4TableFilter } from '../../shared/h4-table/h4-table.types';

@Component({
  selector: 'app-user-roles-page',
  imports: [MatButtonModule, MatIconModule, H4TableComponent],
  templateUrl: './user-roles.page.html',
  styleUrl: './user-roles.page.scss',
})
export class UserRolesPageComponent implements OnInit {
  readonly api = inject(RolesService);
  readonly router = inject(Router);

  readonly loading = signal(true);
  readonly users = signal<RoleUserRow[]>([]);

  readonly columns: H4TableColumn<RoleUserRow>[] = [
    { key: 'status', header: 'Status', field: 'status', type: 'status', statusField: 'status' },
    { key: 'name', header: 'Name', field: 'name', type: 'strong' },
    { key: 'email', header: 'Email', field: 'email' },
    { key: 'role', header: 'Role', field: 'role' },
    {
      key: 'modules',
      header: 'Modules',
      cell: (row) => String(row.grant_count),
    },
  ];

  readonly filters: H4TableFilter[] = [
    {
      key: 'role',
      label: 'Role',
      field: 'role',
      options: [
        { value: 'superuser', label: 'Superuser' },
        { value: 'admin', label: 'Admin' },
        { value: 'staff', label: 'Staff' },
        { value: 'tenant', label: 'Tenant' },
        { value: 'parent', label: 'Parent' },
      ],
    },
  ];

  readonly actions: H4TableAction<RoleUserRow>[] = [
    {
      id: 'edit',
      icon: 'edit',
      tooltip: 'Edit modules',
      color: 'primary',
    },
  ];

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.api.listUsers().subscribe({
      next: (res) => {
        this.users.set(res.users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openEdit(user: RoleUserRow) {
    this.router.navigate(['/user-roles', user.id]);
  }

  onAction(event: { actionId: string; row: RoleUserRow }) {
    if (event.actionId === 'edit') {
      this.openEdit(event.row);
    }
  }
}
