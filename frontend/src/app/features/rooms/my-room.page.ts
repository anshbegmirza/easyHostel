import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoomChangesService, RoomChangeRequest } from '../room-changes/service/room-changes.service';
import { RoomsService, Room } from './service/rooms.service';
import { StatusIconComponent } from '../../shared/status-icon.component';
import { RoomChangeRequestDialogComponent } from './room-change-request-dialog.component';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-my-room-page',
  imports: [
    DatePipe,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    StatusIconComponent,
  ],
  templateUrl: './my-room.page.html',
  styleUrl: './my-room.page.scss',
})
export class MyRoomPageComponent implements OnInit {
  readonly api = inject(RoomsService);
  readonly roomChanges = inject(RoomChangesService);
  readonly dialog = inject(MatDialog);
  readonly toast = inject(ToastService);
  readonly loading = signal(true);
  readonly room = signal<Room | null>(null);
  readonly startDate = signal<string | null>(null);
  readonly requests = signal<RoomChangeRequest[]>([]);

  ngOnInit() {
    this.reload();
  }

  hasPending() {
    return this.requests().some((r) => r.status === 'pending');
  }

  reload() {
    this.loading.set(true);
    this.api.mine().subscribe({
      next: (res) => {
        this.room.set(res.room);
        this.startDate.set(res.allocation?.start_date || null);
        this.roomChanges.list().subscribe({
          next: (c) => {
            this.requests.set(c.requests);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  requestChange() {
    this.dialog
      .open(RoomChangeRequestDialogComponent, { width: '420px' })
      .afterClosed()
      .subscribe((value) => {
        if (!value) {
          return;
        }
        this.roomChanges.create(value).subscribe({
          next: () => {
            this.toast.success('Room change requested');
            this.reload();
          },
        });
      });
  }
}
