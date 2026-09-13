import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Room } from '../rooms/service/rooms.service';

@Component({
  selector: 'app-decide-room-change-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './decide-room-change-dialog.component.html',
  styleUrl: './decide-room-change-dialog.component.scss',
})
export class DecideRoomChangeDialogComponent {
  readonly data = inject<{ approve: boolean; rooms: Room[] }>(MAT_DIALOG_DATA);
  readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    toRoomId: [''],
    staffNote: [''],
  });

  constructor() {
    if (this.data.approve) {
      this.form.controls.toRoomId.setValidators([Validators.required]);
      this.form.controls.toRoomId.updateValueAndValidity();
    }
  }
}
