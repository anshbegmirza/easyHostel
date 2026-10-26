import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Room, RoomsService } from './service/rooms.service';
import { H4TableComponent } from '../../shared/h4-table/h4-table.component';
import { H4TableAction, H4TableColumn, H4TableFilter } from '../../shared/h4-table/h4-table.types';
import { AllocateRoomDialogComponent } from './allocate-room-dialog.component';
import { RoomAllocationsDialogComponent } from './room-allocations-dialog.component';
import { RoomFormDialogComponent } from './room-form-dialog.component';
import { RoomStatusDialogComponent } from './room-status-dialog.component';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-rooms-page',
  imports: [MatButtonModule, MatIconModule, H4TableComponent],
  templateUrl: './rooms.page.html',
  styleUrl: './rooms.page.scss',
})
export class RoomsPageComponent implements OnInit {
  readonly api = inject(RoomsService);
  readonly dialog = inject(MatDialog);
  readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly rooms = signal<Room[]>([]);

  readonly columns: H4TableColumn<Room>[] = [
    { key: 'status', header: 'Status', field: 'status', type: 'status', statusField: 'status' },
    { key: 'code', header: 'Code', field: 'code', type: 'strong' },
    {
      key: 'occupancy',
      header: 'Occupancy',
      cell: (row) => `${row.occupied || 0} / ${row.capacity}`,
    },
  ];

  readonly filters: H4TableFilter[] = [
    {
      key: 'status',
      label: 'Status',
      field: 'status',
      options: [
        { value: 'available', label: 'Available' },
        { value: 'occupied', label: 'Occupied' },
        { value: 'maintenance', label: 'Maintenance' },
      ],
    },
  ];

  readonly actions: H4TableAction<Room>[] = [
    {
      id: 'allocations',
      icon: 'group',
      tooltip: 'Allocations',
    },
    {
      id: 'allocate',
      icon: 'person_add',
      tooltip: 'Allocate',
      color: 'primary',
      disabled: (row) => row.status === 'maintenance' || (row.occupied || 0) >= row.capacity,
    },
    {
      id: 'status',
      icon: 'tune',
      tooltip: 'Set status',
    },
  ];

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (res) => {
        this.rooms.set(res.rooms);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.dialog
      .open(RoomFormDialogComponent, { width: '420px' })
      .afterClosed()
      .subscribe((value) => {
        if (!value) {
          return;
        }
        this.api.create(value).subscribe({
          next: () => {
            this.toast.success('Room created');
            this.reload();
          },
        });
      });
  }

  onAction(event: { actionId: string; row: Room }) {
    if (event.actionId === 'allocate') {
      this.openAllocate(event.row);
      return;
    }
    if (event.actionId === 'allocations') {
      this.openAllocations(event.row);
      return;
    }
    if (event.actionId === 'status') {
      this.openStatus(event.row);
    }
  }

  openAllocate(room: Room) {
    this.api.tenants(true).subscribe({
      next: (res) => {
        this.dialog
          .open(AllocateRoomDialogComponent, {
            width: '420px',
            data: { room, tenants: res.tenants },
          })
          .afterClosed()
          .subscribe((value) => {
            if (!value?.userId) {
              return;
            }
            this.api.allocate({ room_id: room.id, user_id: value.userId }).subscribe({
              next: () => {
                this.toast.success('Tenant allocated');
                this.reload();
              },
            });
          });
      },
    });
  }

  openAllocations(room: Room) {
    const ref = this.dialog.open(RoomAllocationsDialogComponent, {
      width: '440px',
      data: { room },
    });
    ref.afterClosed().subscribe(() => {
      if (ref.componentInstance.changed) {
        this.reload();
      }
    });
  }

  openStatus(room: Room) {
    this.dialog
      .open(RoomStatusDialogComponent, { width: '360px', data: { room } })
      .afterClosed()
      .subscribe((value) => {
        if (!value?.status) {
          return;
        }
        this.api.update(room.id, { status: value.status }).subscribe({
          next: () => {
            this.toast.success('Room status updated');
            this.reload();
          },
        });
      });
  }
}
