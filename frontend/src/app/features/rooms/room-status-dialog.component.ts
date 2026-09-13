import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Room } from './service/rooms.service';

@Component({
  selector: 'app-room-status-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  templateUrl: './room-status-dialog.component.html',
  styleUrl: './room-status-dialog.component.scss',
})
export class RoomStatusDialogComponent {
  readonly data = inject<{ room: Room }>(MAT_DIALOG_DATA);
  readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    status: [this.data.room.status, Validators.required],
  });
}
