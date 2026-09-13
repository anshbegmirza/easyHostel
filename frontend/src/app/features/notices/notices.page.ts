import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Notice, NoticesService } from './service/notices.service';
import { AuthService } from '../../core/authentication/auth.service';
import { isStaffRole } from '../../core/roles';
import { H4TableComponent } from '../../shared/h4-table/h4-table.component';
import { H4TableAction, H4TableColumn } from '../../shared/h4-table/h4-table.types';
import { NoticeFormDialogComponent } from './notice-form-dialog.component';

@Component({
  selector: 'app-notices-page',
  imports: [MatButtonModule, MatIconModule, H4TableComponent],
  templateUrl: './notices.page.html',
  styleUrl: './notices.page.scss',
})
export class NoticesPageComponent implements OnInit {
  readonly api = inject(NoticesService);
  readonly auth = inject(AuthService);
  readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly staff = signal(false);
  readonly notices = signal<Notice[]>([]);

  readonly columns: H4TableColumn<Notice>[] = [
    { key: 'title', header: 'Title', field: 'title', type: 'strong' },
    { key: 'author', header: 'Posted by', field: 'created_by_name' },
    { key: 'when', header: 'When', field: 'created_at', type: 'date' },
  ];

  readonly actions = computed(() => {
    const list: H4TableAction<Notice>[] = [];
    if (this.staff()) {
      list.push({
        id: 'delete',
        icon: 'delete',
        tooltip: 'Delete',
        color: 'warn',
      });
    }
    return list;
  });

  ngOnInit() {
    this.staff.set(isStaffRole(this.auth.user()?.role));
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (res) => {
        this.notices.set(res.notices);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.dialog
      .open(NoticeFormDialogComponent, { width: '440px' })
      .afterClosed()
      .subscribe((value) => {
        if (!value) {
          return;
        }
        this.api.create(value).subscribe({ next: () => this.reload() });
      });
  }

  onAction(event: { actionId: string; row: Notice }) {
    if (event.actionId === 'delete') {
      this.api.remove(event.row.id).subscribe({ next: () => this.reload() });
    }
  }
}
