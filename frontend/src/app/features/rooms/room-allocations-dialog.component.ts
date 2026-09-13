import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Allocation, Room, RoomsService } from './service/rooms.service';

@Component({
  selector: 'app-room-allocations-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './room-allocations-dialog.component.html',
  styleUrl: './room-allocations-dialog.component.scss',
})
export class RoomAllocationsDialogComponent implements OnInit {
  readonly data = inject<{ room: Room }>(MAT_DIALOG_DATA);
  readonly api = inject(RoomsService);
  readonly dialogRef = inject(MatDialogRef<RoomAllocationsDialogComponent>);
  readonly loading = signal(true);
  readonly allocations = signal<Allocation[]>([]);
  changed = false;

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.api.allocations(this.data.room.id).subscribe({
      next: (res) => {
        this.allocations.set(res.allocations);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  release(allocation: Allocation) {
    this.api.release(allocation.id).subscribe({
      next: () => {
        this.changed = true;
        this.reload();
      },
    });
  }
}
