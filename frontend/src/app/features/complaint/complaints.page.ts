import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Complaint, ComplaintsService } from './service/complaints.service';
import { AuthService } from '../../core/authentication/auth.service';
import { isParentRole, isStaffRole, isTenantRole } from '../../core/roles';
import { H4TableComponent } from '../../shared/h4-table/h4-table.component';
import { H4TableAction, H4TableColumn, H4TableFilter } from '../../shared/h4-table/h4-table.types';
import { ComplaintDialogComponent } from './complaint-dialog/complaint-dialog.component';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-complaints-page',
  imports: [MatButtonModule, MatIconModule, H4TableComponent],
  templateUrl: './complaints.page.html',
  styleUrl: './complaints.page.scss',
})
export class ComplaintsPageComponent implements OnInit {
  readonly api = inject(ComplaintsService);
  readonly auth = inject(AuthService);
  readonly dialog = inject(MatDialog);
  readonly toast = inject(ToastService);
  readonly router = inject(Router);

  readonly loading = signal(true);
  readonly staff = signal(false);
  readonly parent = signal(false);
  readonly tenant = signal(false);
  readonly complaints = signal<Complaint[]>([]);

  readonly columns = computed(() => {
    const showTenant = this.staff() || this.parent();
    const cols: H4TableColumn<Complaint>[] = [
      { key: 'status', header: 'Status', field: 'status', type: 'status', statusField: 'status' },
      { key: 'title', header: 'Title', field: 'title', type: 'strong' },
      { key: 'tenant', header: 'Tenant', field: 'tenant_name', hidden: !showTenant },
      { key: 'priority', header: 'Priority', field: 'priority', type: 'status', statusField: 'priority' },
      {
        key: 'sla',
        header: 'SLA',
        cell: (row) => (row.sla_breached ? 'Breached' : row.sla_due_at ? 'On track' : '—'),
      },
    ];
    return cols;
  });

  readonly filters: H4TableFilter[] = [
    {
      key: 'status',
      label: 'Status',
      field: 'status',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'in_progress', label: 'In progress' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      field: 'priority',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
  ];

  readonly actions: H4TableAction<Complaint>[] = [
    {
      id: 'open',
      icon: 'open_in_new',
      tooltip: 'Open',
      color: 'primary',
    },
  ];

  ngOnInit() {
    const role = this.auth.user()?.role;
    this.staff.set(isStaffRole(role));
    this.parent.set(isParentRole(role));
    this.tenant.set(isTenantRole(role));
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (res) => {
        this.complaints.set(res.complaints);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.dialog
      .open(ComplaintDialogComponent, { width: '440px' })
      .afterClosed()
      .subscribe((value) => {
        if (!value) {
          return;
        }
        const form = new FormData();
        form.append('title', value.title);
        form.append('description', value.description || '');
        form.append('priority', value.priority);
        if (value.photo) {
          form.append('photo', value.photo);
        }
        this.api.create(form).subscribe({
          next: () => {
            this.toast.success('Complaint submitted');
            this.reload();
          },
        });
      });
  }

  onAction(event: { actionId: string; row: Complaint }) {
    if (event.actionId === 'open') {
      this.openRow(event.row);
    }
  }

  openRow(row: Complaint) {
    this.router.navigate(['/complaints', row.id]);
  }
}
