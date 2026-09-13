import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RoomChangeRequest, RoomChangesService } from './service/room-changes.service';
import { RoomsService, Room } from '../rooms/service/rooms.service';
import { AuthService } from '../../core/authentication/auth.service';
import { isStaffRole } from '../../core/roles';
import { H4TableComponent } from '../../shared/h4-table/h4-table.component';
import { H4TableAction, H4TableColumn, H4TableFilter } from '../../shared/h4-table/h4-table.types';
import { DecideRoomChangeDialogComponent } from './decide-room-change-dialog.component';

@Component({
  selector: 'app-room-changes-page',
  imports: [MatButtonModule, MatIconModule, H4TableComponent],
  templateUrl: './room-changes.page.html',
  styleUrl: './room-changes.page.scss',
})
export class RoomChangesPageComponent implements OnInit {
  readonly api = inject(RoomChangesService);
  readonly rooms = inject(RoomsService);
  readonly auth = inject(AuthService);
  readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly staff = signal(false);
  readonly requests = signal<RoomChangeRequest[]>([]);

  readonly columns = computed(() => {
    const cols: H4TableColumn<RoomChangeRequest>[] = [
      { key: 'status', header: 'Status', field: 'status', type: 'status', statusField: 'status' },
      { key: 'tenant', header: 'Tenant', field: 'tenant_name', hidden: !this.staff() },
      { key: 'from', header: 'From', field: 'from_room_code' },
      { key: 'to', header: 'To', field: 'to_room_code' },
      { key: 'reason', header: 'Reason', field: 'reason', type: 'strong' },
    ];
    return cols;
  });

  readonly filters: H4TableFilter[] = [
    {
      key: 'status',
      label: 'Status',
      field: 'status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
  ];

  readonly actions = computed(() => {
    if (!this.staff()) {
      return [] as H4TableAction<RoomChangeRequest>[];
    }
    return [
      {
        id: 'approve',
        icon: 'check_circle',
        tooltip: 'Approve',
        color: 'primary' as const,
        show: (row: RoomChangeRequest) => row.status === 'pending',
      },
      {
        id: 'reject',
        icon: 'cancel',
        tooltip: 'Reject',
        show: (row: RoomChangeRequest) => row.status === 'pending',
      },
    ];
  });

  ngOnInit() {
    this.staff.set(isStaffRole(this.auth.user()?.role));
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (res) => {
        this.requests.set(res.requests);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onAction(event: { actionId: string; row: RoomChangeRequest }) {
    const approve = event.actionId === 'approve';
    if (!approve && event.actionId !== 'reject') {
      return;
    }

    const open = (rooms: Room[]) => {
      this.dialog
        .open(DecideRoomChangeDialogComponent, {
          width: '420px',
          data: { approve, rooms },
        })
        .afterClosed()
        .subscribe((value) => {
          if (!value) {
            return;
          }
          this.api
            .decide(event.row.id, {
              status: approve ? 'approved' : 'rejected',
              staff_note: value.staffNote,
              to_room_id: approve ? value.toRoomId : undefined,
            })
            .subscribe({ next: () => this.reload() });
        });
    };

    if (approve) {
      this.rooms.list().subscribe({
        next: (res) => open(res.rooms.filter((r) => r.status !== 'maintenance')),
      });
    } else {
      open([]);
    }
  }
}
