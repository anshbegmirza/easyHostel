import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Fee, FeesService } from './service/fees.service';
import { RoomsService } from '../rooms/service/rooms.service';
import { AuthService } from '../../core/authentication/auth.service';
import { isParentRole, isStaffRole } from '../../core/roles';
import { H4TableComponent } from '../../shared/h4-table/h4-table.component';
import { H4TableAction, H4TableColumn, H4TableFilter } from '../../shared/h4-table/h4-table.types';
import { FeeFormDialogComponent } from './fee-form-dialog.component';

@Component({
  selector: 'app-fees-page',
  imports: [MatButtonModule, MatIconModule, H4TableComponent],
  templateUrl: './fees.page.html',
  styleUrl: './fees.page.scss',
})
export class FeesPageComponent implements OnInit {
  readonly api = inject(FeesService);
  readonly rooms = inject(RoomsService);
  readonly auth = inject(AuthService);
  readonly dialog = inject(MatDialog);
  readonly router = inject(Router);

  readonly loading = signal(true);
  readonly staff = signal(false);
  readonly parent = signal(false);
  readonly fees = signal<Fee[]>([]);

  readonly columns = computed(() => {
    const showTenant = this.staff() || this.parent();
    const cols: H4TableColumn<Fee>[] = [
      { key: 'status', header: 'Status', field: 'status', type: 'status', statusField: 'status' },
      { key: 'period', header: 'Period', field: 'period_label', type: 'strong' },
      { key: 'tenant', header: 'Tenant', field: 'tenant_name', hidden: !showTenant },
      { key: 'amount', header: 'Amount', field: 'amount', type: 'currency' },
    ];
    return cols;
  });

  readonly filters: H4TableFilter[] = [
    {
      key: 'status',
      label: 'Status',
      field: 'status',
      options: [
        { value: 'due', label: 'Due' },
        { value: 'paid', label: 'Paid' },
        { value: 'waived', label: 'Waived' },
      ],
    },
  ];

  readonly actions = computed(() => {
    const list: H4TableAction<Fee>[] = [];
    if (this.staff()) {
      list.push(
        {
          id: 'paid',
          icon: 'check_circle',
          tooltip: 'Mark paid',
          color: 'primary',
          show: (row) => row.status === 'due',
        },
        {
          id: 'waive',
          icon: 'money_off',
          tooltip: 'Waive',
          show: (row) => row.status === 'due',
        }
      );
    }
    list.push({
      id: 'receipt',
      icon: 'receipt_long',
      tooltip: 'Receipt',
      show: (row) => row.status === 'paid',
    });
    return list;
  });

  ngOnInit() {
    const role = this.auth.user()?.role;
    this.staff.set(isStaffRole(role));
    this.parent.set(isParentRole(role));
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (res) => {
        this.fees.set(res.fees);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.rooms.tenants(false).subscribe({
      next: (res) => {
        this.dialog
          .open(FeeFormDialogComponent, { width: '420px', data: { tenants: res.tenants } })
          .afterClosed()
          .subscribe((value) => {
            if (!value) {
              return;
            }
            this.api
              .create({
                user_id: value.userId,
                period_label: value.periodLabel,
                amount: value.amount,
              })
              .subscribe({ next: () => this.reload() });
          });
      },
    });
  }

  onAction(event: { actionId: string; row: Fee }) {
    if (event.actionId === 'paid') {
      this.api.updateStatus(event.row.id, { status: 'paid', method: 'manual' }).subscribe({
        next: () => this.reload(),
      });
      return;
    }
    if (event.actionId === 'waive') {
      this.api.updateStatus(event.row.id, { status: 'waived' }).subscribe({ next: () => this.reload() });
      return;
    }
    if (event.actionId === 'receipt') {
      this.router.navigate(['/fees', event.row.id, 'receipt']);
    }
  }
}
